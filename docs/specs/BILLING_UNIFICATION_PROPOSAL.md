# 빌링 시스템 통합 제안서

**작성일**: 2026-01-11  
**목적**: Credits와 CHOCO 통합 방안 제시 및 마이그레이션 전략 수립

---

## 1. 현재 시스템 분석

### 1.1 현재 자산 구조

#### Credits (내부 가상 화폐)
- **사용처**:
  - 채팅 메시지 전송 시 차감 (`app/routes/api/chat/index.ts`)
  - 아이템 구매 시 차감 (`app/routes/api/items/purchase.ts`)
  - 미션 보상 지급 (`app/routes/missions.tsx`)
  - 멤버십 월간 크레딧 지급 (`subscription-plans.ts`)
- **충전 방법**:
  - 토스 결제 → Credits 부여 (`toss.server.ts`)
  - 페이팔 결제 → Credits 부여 (`api.payment.capture-order.ts`)
  - NEAR 입금 → CHOCO 환전 후 Credits도 함께 증가 (`deposit-engine.server.ts`)
- **DB 필드**: `user.credits` (integer)

#### CHOCO (블록체인 토큰)
- **사용처**:
  - NEAR 입금 시 CHOCO로 자동 환전 (`deposit-engine.server.ts`)
  - X402 결제 시 CHOCO 차감 (`x402.server.ts`)
- **충전 방법**:
  - NEAR 입금 → CHOCO 환전 (1 NEAR = 5,000 CHOCO)
- **DB 필드**: `user.chocoBalance` (text, BigNumber string)
- **온체인**: NEAR 블록체인에 실제 토큰으로 존재

### 1.2 현재 문제점

1. **이중 자산 시스템**: Credits와 CHOCO가 혼재되어 사용자 혼란 가능
2. **환율 불일치**: `credit-policy.ts`에서 1 CHOCO = 1 Credit로 설정되어 있으나, 실제로는 별도 관리
3. **결제 수단별 처리 불일치**:
   - 토스/페이팔 → Credits만 부여
   - NEAR → CHOCO + Credits 동시 증가
4. **아이템 가격**: `priceCredits`로만 표시되어 CHOCO와의 관계 불명확
5. **멤버십**: Credits로만 지급되어 CHOCO와의 연동 없음

---

## 2. 통합 방안 제안

### 방안 A: CHOCO 완전 통합 (권장) ⭐

#### 개념
- **Credits를 완전히 제거하고 CHOCO만 사용**
- 모든 결제 수단(토스, 페이팔, NEAR) → CHOCO로 변환
- 채팅, 아이템 구매, 멤버십 모두 CHOCO로 처리

#### 장점
1. **단일 자산 시스템**: 사용자 혼란 최소화
2. **블록체인 기반**: 투명성 및 검증 가능성
3. **확장성**: 향후 멀티체인 지원 용이
4. **일관성**: 모든 결제가 동일한 자산으로 처리

#### 단점
1. **마이그레이션 복잡도**: 기존 Credits 보유자 처리 필요
2. **온체인 트랜잭션**: 모든 충전/사용이 온체인 기록 필요 (가스비 대납으로 해결 가능)
3. **개발 리소스**: 전체 시스템 수정 필요

#### 구현 전략
1. **환율 설정**:
   - 1 USD = X CHOCO (예: 1 USD = 10,000 CHOCO)
   - 1 KRW = Y CHOCO (예: 1 KRW = 7.5 CHOCO, USD 환율 기준)
   - CoinGecko API로 실시간 환율 적용

2. **결제 플로우 변경**:
   ```
   토스/페이팔 결제 → USD/KRW → CHOCO 계산 → 온체인 발행 → DB 업데이트
   ```

3. **사용 플로우**:
   ```
   채팅/아이템 사용 → CHOCO 차감 (온체인 + DB)
   ```

4. **마이그레이션**:
   - 기존 Credits → CHOCO 변환 (1:1 또는 환율 적용)
   - `user.credits` 필드 제거 또는 deprecated 처리

---

### 방안 B: Credits를 CHOCO의 내부 단위로 유지

#### 개념
- **Credits는 UI 표시용 내부 단위로만 사용**
- 실제 자산은 CHOCO만 관리
- Credits = CHOCO (1:1 또는 고정 환율)

#### 장점
1. **점진적 마이그레이션**: 기존 코드 수정 최소화
2. **사용자 친화적**: Credits라는 친숙한 단위 유지 가능
3. **유연성**: 향후 환율 조정 가능

#### 단점
1. **이중 관리**: Credits와 CHOCO 동기화 필요
2. **복잡도**: 두 필드 모두 관리해야 함
3. **불일치 위험**: 동기화 실패 시 데이터 불일치 가능

#### 구현 전략
1. **동기화 로직**:
   ```typescript
   // 모든 Credits 변경 시 CHOCO도 함께 변경
   credits += 100 → chocoBalance += 100 (1:1)
   ```

2. **표시 우선순위**:
   - UI: Credits 표시 (사용자 친화적)
   - 실제 자산: CHOCO (온체인 기준)

---

### 방안 C: 하이브리드 방식 (단기 전환)

#### 개념
- **단기**: Credits와 CHOCO 병행 사용
- **장기**: 점진적으로 CHOCO로 통합

#### 장점
1. **점진적 전환**: 리스크 최소화
2. **기존 사용자 보호**: Credits 보유자 영향 최소화

#### 단점
1. **복잡도 증가**: 두 시스템 병행 관리
2. **전환 기간 불명확**: 언제 완전 전환할지 불명확

---

## 3. 권장 방안: CHOCO 완전 통합 (방안 A)

### 3.1 선택 이유

1. **Zero-Friction UX 철학과 일치**: 
   - 이미 NEAR 시스템에서 "Invisible Wallet" 구현 완료
   - 사용자는 CHOCO를 직접 다룰 필요 없음 (내부적으로만 처리)

2. **확장성**:
   - 향후 멀티체인 지원 시 CHOCO가 표준 자산
   - 크로스체인 브릿지 구현 용이

3. **투명성**:
   - 모든 거래가 온체인에 기록되어 검증 가능
   - 사용자 신뢰도 향상

4. **단순성**:
   - 단일 자산 시스템으로 운영 복잡도 감소
   - 버그 및 데이터 불일치 위험 최소화

### 3.2 구현 로드맵

#### Phase 1: 환율 시스템 구축 (1주)
- [ ] CoinGecko API 통합 (`exchange-rate.server.ts` 확장)
- [ ] USD/KRW → CHOCO 환율 계산 함수 구현
- [ ] 환율 캐싱 및 업데이트 로직 구현

#### Phase 2: 결제 수단별 CHOCO 발행 (2주)
- [ ] 토스 결제 → CHOCO 발행 로직 구현
- [ ] 페이팔 결제 → CHOCO 발행 로직 구현
- [ ] NEAR 입금 → CHOCO 발행 로직 유지 (이미 구현됨)
- [ ] 결제 완료 시 온체인 CHOCO 발행 (서비스 계정에서 발행)

#### Phase 3: 사용 로직 변경 (2주)
- [ ] 채팅 비용 차감: Credits → CHOCO
- [ ] 아이템 구매: `priceCredits` → `priceChoco`
- [ ] 멤버십 지급: Credits → CHOCO
- [ ] 미션 보상: Credits → CHOCO

#### Phase 4: UI 업데이트 (1주)
- [ ] 모든 UI에서 Credits 표시 → CHOCO 표시
- [ ] 가격 표시: KRW/USD → CHOCO 변환 표시
- [ ] 잔액 표시: CHOCO 우선 표시

#### Phase 5: 마이그레이션 (1주)
- [ ] 기존 Credits → CHOCO 변환 스크립트 작성
- [ ] 데이터 마이그레이션 실행
- [ ] 검증 및 롤백 계획 수립

#### Phase 6: Credits 필드 제거 (1주)
- [ ] `user.credits` 필드 deprecated 처리
- [ ] 모든 코드에서 Credits 참조 제거
- [ ] DB 스키마 마이그레이션 (선택사항)

**총 예상 기간**: 8주

---

## 4. 기술적 세부 사항

### 4.1 환율 계산

```typescript
// app/lib/near/exchange-rate.server.ts 확장
export async function calculateChocoFromUSD(usdAmount: number): Promise<string> {
    const nearPriceUSD = await getNearPriceUSD(); // CoinGecko에서 가져옴
    const chocoPerUSD = 10000; // 1 USD = 10,000 CHOCO (예시)
    return (usdAmount * chocoPerUSD).toString();
}

export async function calculateChocoFromKRW(krwAmount: number): Promise<string> {
    const usdAmount = krwAmount / 1350; // 1 USD = 1,350 KRW (예시)
    return await calculateChocoFromUSD(usdAmount);
}
```

### 4.2 결제 플로우 변경

#### 토스/페이팔 결제 시:
```typescript
// 1. 결제 완료 확인
// 2. KRW/USD → CHOCO 계산
const chocoAmount = await calculateChocoFromKRW(paymentAmount);
// 3. 온체인 CHOCO 발행 (서비스 계정에서 사용자 계정으로 전송)
await sendChocoToken(user.nearAccountId, chocoAmount);
// 4. DB 업데이트
await db.update(schema.user)
    .set({ chocoBalance: sql`${schema.user.chocoBalance} + ${chocoAmount}` })
    .where(eq(schema.user.id, userId));
```

### 4.3 사용 플로우 변경

#### 채팅 비용 차감:
```typescript
// 기존: credits 차감
// 변경: chocoBalance 차감
const chocoCost = calculateChocoFromCredits(creditCost); // 1 Credit = 1 CHOCO (초기)
await db.update(schema.user)
    .set({ chocoBalance: sql`${schema.user.chocoBalance} - ${chocoCost}` })
    .where(eq(schema.user.id, userId));
```

### 4.4 아이템 가격 변경

```typescript
// app/lib/items.ts
export const ITEMS = {
    HEART: {
        id: "heart",
        name: "하트",
        priceChoco: 1500, // 기존 priceCredits → priceChoco
        // 또는 priceUSD, priceKRW 유지하고 런타임에 CHOCO 계산
    },
};
```

---

## 5. 마이그레이션 계획

### 5.1 데이터 마이그레이션 스크립트

```typescript
// scripts/migrate-credits-to-choco.ts
async function migrateCreditsToChoco() {
    const users = await db.query.user.findMany({
        where: gt(schema.user.credits, 0),
    });

    for (const user of users) {
        const chocoToAdd = user.credits; // 1:1 환율 (또는 실제 환율 적용)
        const newChocoBalance = new BigNumber(user.chocoBalance || "0")
            .plus(chocoToAdd)
            .toString();

        // 온체인 발행 (서비스 계정에서 사용자 계정으로)
        await sendChocoToken(user.nearAccountId, chocoToAdd);

        // DB 업데이트
        await db.update(schema.user)
            .set({
                chocoBalance: newChocoBalance,
                credits: 0, // Credits 제거
            })
            .where(eq(schema.user.id, user.id));
    }
}
```

### 5.2 롤백 계획

1. **백업**: 마이그레이션 전 전체 DB 백업
2. **검증**: 마이그레이션 후 잔액 합계 검증
3. **롤백**: 문제 발생 시 백업 복원

---

## 6. 리스크 및 대응 방안

### 6.1 리스크

1. **환율 변동**: USD/KRW 환율 변동 시 CHOCO 가치 변동
   - **대응**: 고정 환율 사용 또는 정기 업데이트

2. **온체인 트랜잭션 실패**: CHOCO 발행 실패 시
   - **대응**: 재시도 로직 및 알림 시스템

3. **기존 사용자 혼란**: Credits → CHOCO 전환 시
   - **대응**: 공지 및 가이드 제공

4. **가스비**: 모든 충전/사용 시 온체인 트랜잭션 필요
   - **대응**: Relayer 시스템 활용 (이미 구현됨)

### 6.2 모니터링

- 환율 모니터링 대시보드 (`/api/admin/monitoring/near` 확장)
- CHOCO 발행/사용 통계
- 결제 실패율 모니터링

---

## 7. 결론 및 권장사항

### 7.1 최종 권장사항

**CHOCO 완전 통합 (방안 A)**을 권장합니다.

**이유**:
1. Zero-Friction UX 철학과 완벽히 일치
2. 블록체인 기반 투명성 및 확장성
3. 단일 자산 시스템으로 운영 복잡도 감소
4. 이미 NEAR 인프라 구축 완료

### 7.2 다음 단계

1. **승인**: 이 제안서 검토 및 승인
2. **세부 설계**: Phase별 상세 설계 문서 작성
3. **개발 시작**: Phase 1부터 순차 진행
4. **테스트**: 각 Phase별 UAT 진행

---

## 8. 참고 문서

- `docs/specs/NEAR_ZERO_FRICTION_UX_VERIFICATION.md`: NEAR 시스템 검증 보고서
- `docs/specs/NEAR_X402_UI_SPEC.md`: X402 결제 UI 스펙
- `app/lib/credit-policy.ts`: 현재 크레딧 정책
- `app/lib/subscription-plans.ts`: 멤버십 플랜 정의
- `app/lib/items.ts`: 아이템 정의
