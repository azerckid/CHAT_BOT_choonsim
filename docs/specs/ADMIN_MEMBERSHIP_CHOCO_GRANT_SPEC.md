# 관리자 페이지 멤버십 지정 시 CHOCO 자동 지급 구현 사양서

**작성일**: 2026-01-11  
**목적**: 관리자가 멤버십을 지정할 때 해당 플랜의 CHOCO가 자동으로 지급되도록 구현  
**상태**: 📋 설계 단계

---

## 1. 현재 문제점

### 1.1 현재 동작
- 관리자 페이지(`/admin/users/:id`)에서 멤버십 티어를 변경하면:
  - `subscriptionTier` 필드만 업데이트됨
  - `subscriptionStatus` 필드만 업데이트됨
  - **CHOCO는 자동으로 지급되지 않음**
  - 관리자가 수동으로 `chocoBalance`를 입력해야 함

### 1.2 문제점
1. **일관성 부족**: 실제 결제 플로우에서는 멤버십 활성화 시 CHOCO가 자동 지급되지만, 관리자 페이지에서는 수동 입력 필요
2. **사용자 경험**: 관리자가 멤버십을 지정해도 사용자는 CHOCO를 받지 못함
3. **운영 복잡도**: 매번 수동으로 CHOCO 양을 계산하고 입력해야 함
4. **실수 가능성**: 잘못된 CHOCO 양 입력 가능

---

## 2. 구현 목표

### 2.1 목표
관리자가 멤버십 티어를 변경하고 상태를 "ACTIVE"로 설정하면, 해당 플랜의 `creditsPerMonth`만큼 CHOCO가 자동으로 지급되도록 구현

### 2.2 요구사항
1. 티어 변경 감지: 이전 티어와 새 티어가 다를 때만 처리
2. 상태 확인: `subscriptionStatus`가 "ACTIVE"일 때만 CHOCO 지급
3. 온체인 전송: NEAR 계정이 있는 경우 온체인 CHOCO 전송
4. DB 업데이트: `chocoBalance` 자동 증가
5. 기록 생성: `TokenTransfer` 및 `Payment` 기록 생성
6. 중복 방지: 같은 티어로 변경하거나 이미 지급된 경우 재지급 방지

---

## 3. 구현 계획

### 3.1 수정 대상 파일
- `app/routes/admin/users/detail.tsx`: `action` 함수의 `update_user` 케이스 수정

### 3.2 구현 로직

```
1. 사용자 정보 조회 (현재 subscriptionTier, chocoBalance, nearAccountId)
2. 티어 변경 여부 확인
   - 이전 티어 === 새 티어 → CHOCO 지급 스킵
   - 이전 티어 !== 새 티어 → 계속 진행
3. 상태 확인
   - subscriptionStatus !== "ACTIVE" → CHOCO 지급 스킵
   - subscriptionStatus === "ACTIVE" → 계속 진행
4. 플랜 정보 조회
   - SUBSCRIPTION_PLANS[새 티어] 조회
   - creditsPerMonth 확인
5. CHOCO 계산
   - chocoAmount = creditsPerMonth (1 Credit = 1 CHOCO)
   - chocoAmountRaw = chocoAmount * 10^18
6. 온체인 전송 (NEAR 계정이 있는 경우)
   - sendChocoToken(user.nearAccountId, chocoAmountRaw)
   - 실패해도 DB는 업데이트 (나중에 복구 가능)
7. DB 업데이트
   - chocoBalance 증가
   - subscriptionTier 업데이트
   - subscriptionStatus 업데이트
   - currentPeriodEnd 설정 (1개월 후)
8. 기록 생성
   - Payment 기록 (type: "ADMIN_MEMBERSHIP_GRANT")
   - TokenTransfer 기록 (온체인 전송 성공 시)
```

### 3.3 예외 처리
- 티어가 변경되지 않은 경우: CHOCO 지급 없음
- 상태가 "ACTIVE"가 아닌 경우: CHOCO 지급 없음
- FREE 티어로 변경: CHOCO 지급 없음 (FREE는 creditsPerMonth가 있지만 관리자 지정 시 지급하지 않음)
- NEAR 계정이 없는 경우: DB만 업데이트, 온체인 전송 스킵
- 온체인 전송 실패: DB는 업데이트, 에러 로그 기록

---

## 4. 기술적 세부사항

### 4.1 수정할 코드 위치

**파일**: `app/routes/admin/users/detail.tsx`  
**함수**: `action` 함수의 `update_user` 케이스

### 4.2 필요한 Import

```typescript
import { SUBSCRIPTION_PLANS } from "~/lib/subscription-plans";
import { BigNumber } from "bignumber.js";
import { logger } from "~/lib/logger.server";
import { nanoid } from "nanoid";
import { DateTime } from "luxon";
```

### 4.3 구현 예시 코드

```typescript
if (actionType === "update_user") {
    const role = formData.get("role") as string;
    const tier = formData.get("tier") as string;
    const status = formData.get("subscriptionStatus") as string;
    const chocoBalance = formData.get("chocoBalance") as string;

    // 1. 현재 사용자 정보 조회
    const currentUser = await db.query.user.findFirst({
        where: eq(schema.user.id, id),
        columns: {
            subscriptionTier: true,
            chocoBalance: true,
            nearAccountId: true,
            nearPrivateKey: true,
        },
    });

    if (!currentUser) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    // 2. 티어 변경 여부 확인
    const tierChanged = currentUser.subscriptionTier !== tier;
    const shouldGrantChoco = tierChanged && status === "ACTIVE" && tier !== "FREE";

    let chocoTxHash: string | null = null;
    let chocoAmount = "0";

    // 3. CHOCO 지급 로직 (티어 변경 및 ACTIVE 상태일 때만)
    if (shouldGrantChoco) {
        const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
        if (plan && plan.creditsPerMonth > 0) {
            chocoAmount = plan.creditsPerMonth.toString();
            const chocoAmountRaw = new BigNumber(chocoAmount)
                .multipliedBy(new BigNumber(10).pow(18))
                .toFixed(0);

            // 온체인 전송 (NEAR 계정이 있는 경우)
            if (currentUser.nearAccountId) {
                try {
                    const { sendChocoToken } = await import("~/lib/near/token.server");
                    const sendResult = await sendChocoToken(
                        currentUser.nearAccountId,
                        chocoAmountRaw
                    );
                    chocoTxHash = (sendResult as any).transaction.hash;

                    logger.info({
                        category: "ADMIN",
                        message: `Granted ${chocoAmount} CHOCO for membership (admin)`,
                        metadata: { userId: id, tier, txHash: chocoTxHash },
                    });
                } catch (error) {
                    logger.error({
                        category: "ADMIN",
                        message: "Failed to transfer CHOCO on-chain (admin membership grant)",
                        stackTrace: (error as Error).stack,
                        metadata: { userId: id, tier },
                    });
                    // 온체인 전송 실패해도 DB는 업데이트
                }
            }
        }
    }

    // 4. DB 업데이트
    await db.transaction(async (tx) => {
        const currentChocoBalance = currentUser.chocoBalance || "0";
        const chocoToAdd = shouldGrantChoco ? chocoAmount : "0";
        const newChocoBalance = new BigNumber(currentChocoBalance)
            .plus(chocoToAdd)
            .toString();

        // currentPeriodEnd 계산 (ACTIVE 상태일 때만)
        const nextMonth = status === "ACTIVE"
            ? DateTime.now().plus({ months: 1 }).toJSDate()
            : undefined;

        await tx.update(schema.user).set({
            role,
            subscriptionTier: tier,
            subscriptionStatus: status,
            chocoBalance: chocoBalance || newChocoBalance, // 수동 입력이 있으면 우선, 없으면 자동 계산
            currentPeriodEnd: nextMonth,
            updatedAt: new Date(),
        }).where(eq(schema.user.id, id));

        // Payment 기록 생성 (CHOCO 지급 시)
        if (shouldGrantChoco && chocoAmount !== "0") {
            await tx.insert(schema.payment).values({
                id: crypto.randomUUID(),
                userId: id,
                amount: 0, // 관리자 지정이므로 금액 없음
                currency: "CHOCO",
                status: "COMPLETED",
                provider: "ADMIN",
                type: "ADMIN_MEMBERSHIP_GRANT",
                description: `Membership granted: ${tier}`,
                creditsGranted: parseInt(chocoAmount), // 호환성을 위해 유지 (deprecated)
                txHash: chocoTxHash || undefined,
                metadata: JSON.stringify({
                    tier,
                    chocoAmount,
                    chocoTxHash,
                    grantedBy: "admin",
                }),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // TokenTransfer 기록 (온체인 전송 성공 시)
            if (chocoTxHash && currentUser.nearAccountId) {
                const chocoAmountRaw = new BigNumber(chocoAmount)
                    .multipliedBy(new BigNumber(10).pow(18))
                    .toFixed(0);

                await tx.insert(schema.tokenTransfer).values({
                    id: nanoid(),
                    userId: id,
                    txHash: chocoTxHash,
                    amount: chocoAmountRaw,
                    tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                    status: "COMPLETED",
                    purpose: "ADMIN_MEMBERSHIP_GRANT",
                    createdAt: new Date(),
                });
            }
        }
    });

    return { success: true, message: "User updated successfully" };
}
```

---

## 5. 고려사항

### 5.1 수동 CHOCO 입력과의 관계
- 관리자가 `chocoBalance`를 수동으로 입력한 경우: 수동 입력값 우선
- 관리자가 `chocoBalance`를 입력하지 않은 경우: 자동 계산값 사용

### 5.2 중복 지급 방지
- 같은 티어로 변경: CHOCO 지급 없음
- 티어 변경 + 상태가 "ACTIVE"가 아닌 경우: CHOCO 지급 없음
- FREE 티어로 변경: CHOCO 지급 없음 (FREE는 일일 지급 방식)

### 5.3 FREE 티어 처리
- FREE 티어는 `creditsPerMonth: 1500`이지만, 관리자가 지정할 때는 지급하지 않음
- FREE는 일일 지급 방식이므로 별도 처리 필요

### 5.4 기간 설정
- `currentPeriodEnd`: 멤버십 상태가 "ACTIVE"일 때만 1개월 후로 설정
- 상태가 "inactive", "expired", "canceled"인 경우: `currentPeriodEnd` 업데이트 안 함

### 5.5 로깅 및 감사
- 모든 관리자 멤버십 지정은 `Payment` 테이블에 기록
- `purpose: "ADMIN_MEMBERSHIP_GRANT"`로 구분
- `provider: "ADMIN"`으로 표시
- 온체인 전송 성공 시 `TokenTransfer` 기록

### 5.6 NEAR 계정이 없는 경우의 후속 처리 ⚠️

**현재 문제점**:
- 관리자가 멤버십을 지정했지만 사용자의 NEAR 계정이 없는 경우, DB에만 CHOCO가 기록됨
- 이후 사용자가 로그인하여 지갑이 생성되어도, 미전송된 CHOCO를 자동으로 전송하는 로직이 없음

**현재 `ensureNearWallet` 동작**:
- 지갑 생성 시 Credits만 확인하고 CHOCO로 변환
- DB에 기록된 CHOCO는 확인하지 않음

**해결 방안**:
지갑 생성 시 DB의 `chocoBalance`와 온체인 잔액을 비교하여 차이가 있으면 자동 전송하는 로직 추가 필요

**구현 위치**: `app/lib/near/wallet.server.ts`의 `ensureNearWallet` 함수

**추가 로직**:
```typescript
// 지갑 생성 후, DB chocoBalance와 온체인 잔액 비교
const dbChocoBalance = new BigNumber(user.chocoBalance || "0");
const onChainBalance = await getChocoBalance(newAccountId);
const onChainBalanceBN = new BigNumber(onChainBalance || "0");

// DB에 CHOCO가 있지만 온체인에 없는 경우 전송
if (dbChocoBalance.isGreaterThan(onChainBalanceBN)) {
    const pendingChoco = dbChocoBalance.minus(onChainBalanceBN);
    const pendingChocoRaw = pendingChoco.multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
    
    try {
        const sendResult = await sendChocoToken(newAccountId, pendingChocoRaw);
        const chocoTxHash = (sendResult as any).transaction.hash;
        
        // TokenTransfer 기록 생성
        await db.insert(schema.tokenTransfer).values({
            id: nanoid(),
            userId,
            txHash: chocoTxHash,
            amount: pendingChocoRaw,
            tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
            status: "COMPLETED",
            purpose: "PENDING_GRANT", // 미전송 CHOCO 전송
            createdAt: new Date(),
        });
        
        logger.info({
            category: "WALLET",
            message: `Transferred pending CHOCO: ${pendingChoco.toString()}`,
            metadata: { userId, nearAccountId: newAccountId, txHash: chocoTxHash }
        });
    } catch (error) {
        logger.error({
            category: "WALLET",
            message: "Failed to transfer pending CHOCO",
            stackTrace: (error as Error).stack,
            metadata: { userId, nearAccountId: newAccountId }
        });
    }
}
```

**또는 대안**: Payment 테이블에서 `type: "ADMIN_MEMBERSHIP_GRANT"`이고 `txHash`가 없는 기록을 찾아서 전송하는 방법도 고려 가능

---

## 6. 테스트 시나리오

### 6.1 시나리오 1: BASIC 티어로 변경 (ACTIVE)
- **전제**: 사용자가 FREE 티어
- **동작**: 관리자가 BASIC 티어, ACTIVE 상태로 변경
- **예상 결과**: 
  - `chocoBalance`에 2,000 CHOCO 추가
  - 온체인 전송 (NEAR 계정이 있는 경우)
  - `Payment` 기록 생성
  - `TokenTransfer` 기록 생성 (온체인 전송 성공 시)

### 6.2 시나리오 2: 같은 티어로 변경
- **전제**: 사용자가 이미 BASIC 티어
- **동작**: 관리자가 다시 BASIC 티어로 변경
- **예상 결과**: CHOCO 지급 없음

### 6.3 시나리오 3: 티어 변경 + 상태가 inactive
- **전제**: 사용자가 FREE 티어
- **동작**: 관리자가 BASIC 티어, inactive 상태로 변경
- **예상 결과**: CHOCO 지급 없음

### 6.4 시나리오 4: FREE 티어로 변경
- **전제**: 사용자가 BASIC 티어
- **동작**: 관리자가 FREE 티어로 변경
- **예상 결과**: CHOCO 지급 없음

### 6.5 시나리오 5: NEAR 계정이 없는 경우
- **전제**: 사용자가 NEAR 계정 없음
- **동작**: 관리자가 BASIC 티어, ACTIVE 상태로 변경
- **예상 결과**: 
  - DB에만 CHOCO 추가
  - 온체인 전송 스킵
  - `Payment` 기록 생성
  - `TokenTransfer` 기록 없음

---

## 7. 구현 체크리스트

### Phase 1: 관리자 페이지 멤버십 지정 시 CHOCO 자동 지급
- [ ] `app/routes/admin/users/detail.tsx` 수정
- [ ] 필요한 import 추가
- [ ] 티어 변경 감지 로직 구현
- [ ] 상태 확인 로직 구현
- [ ] CHOCO 계산 로직 구현
- [ ] 온체인 전송 로직 구현
- [ ] DB 업데이트 로직 구현
- [ ] Payment 기록 생성 로직 구현
- [ ] TokenTransfer 기록 생성 로직 구현
- [ ] 에러 처리 및 로깅 구현
- [ ] 테스트 시나리오 검증

### Phase 2: 지갑 생성 시 미전송 CHOCO 자동 전송 (후속 작업)
- [ ] `app/lib/near/wallet.server.ts`의 `ensureNearWallet` 함수 수정
- [ ] DB chocoBalance와 온체인 잔액 비교 로직 추가
- [ ] 미전송 CHOCO 자동 전송 로직 구현
- [ ] TokenTransfer 기록 생성 (purpose: "PENDING_GRANT")
- [ ] 에러 처리 및 로깅 구현
- [ ] 테스트 시나리오 검증

---

## 8. 참고 사항

### 8.1 관련 파일
- `app/lib/subscription-plans.ts`: 멤버십 플랜 정의
- `app/lib/toss.server.ts`: 토스 결제 시 멤버십 처리 로직 참고
- `app/routes/api.payment.activate-subscription.ts`: 페이팔 멤버십 활성화 로직 참고

### 8.2 기존 구현과의 일관성
- 실제 결제 플로우와 동일한 방식으로 CHOCO 지급
- 동일한 기록 생성 방식 (`Payment`, `TokenTransfer`)
- 동일한 에러 처리 방식

---

## 9. 향후 개선 사항

1. **지갑 생성 시 미전송 CHOCO 자동 전송**: 사용자가 로그인하여 지갑이 생성될 때, DB에 기록된 CHOCO를 자동으로 온체인에 전송 (Phase 2)
2. **멤버십 갱신 시 자동 CHOCO 지급**: Cron Job을 통해 만료된 멤버십 갱신 시 자동 지급
3. **멤버십 다운그레이드 처리**: 상위 티어에서 하위 티어로 변경 시 처리 로직
4. **멤버십 일시 정지**: 일시 정지 시 CHOCO 지급 중단 로직
5. **관리자 로그**: 관리자가 멤버십을 지정한 기록을 별도 테이블에 저장
6. **Payment 테이블 기반 미전송 CHOCO 추적**: `type: "ADMIN_MEMBERSHIP_GRANT"`이고 `txHash`가 없는 기록을 찾아서 전송하는 방법 고려

---

## 10. 승인 및 구현

- [ ] 설계 검토 완료
- [ ] 구현 시작
- [ ] 테스트 완료
- [ ] 배포 준비
