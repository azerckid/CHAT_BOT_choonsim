# X402 CHOCO 차감 및 NEAR 환전 후 반환 문제 분석

**작성일**: 2026-01-14  
**분석 목적**: X402 결제 시 CHOCO 차감 문제 및 NEAR 환전 후 서비스 계정 반환 문제 원인 분석

---

## 1. 문제 요약

### 1.1 문제 1: X402 결제 시 지갑에서 CHOCO가 감소하지 않는 문제

**현상**:
- X402 결제가 완료되었지만, 사용자 지갑의 CHOCO 잔액이 실제로 감소하지 않는 것으로 보임
- DB의 `chocoBalance`는 차감되지만, 온체인 잔액과 동기화되지 않을 수 있음

### 1.2 문제 2: NEAR 환전 후 서비스 계정으로 반환되지 않는 문제

**현상**:
- 사용자가 NEAR를 입금하여 CHOCO로 환전한 후, NEAR가 서비스 계정(Treasury)으로 자동 반환되지 않음
- `ExchangeLog`의 `status`가 `PENDING_SWEEP`으로 남아있을 수 있음

---

## 2. X402 CHOCO 차감 문제 상세 분석

### 2.1 현재 구현 플로우

**클라이언트 사이드** (`app/components/payment/PaymentSheet.tsx`):
```typescript
// 1. 잔액 확인
const currentBalance = parseFloat(balance);
const requiredAmount = parseFloat(invoice.amount);

// 2. CHOCO 토큰 전송 (가스비 대납 또는 일반)
if (useRelayer) {
    txHashResult = await transferChocoTokenGasless(
        accountId,
        invoice.recipient,  // 서비스 계정
        invoice.amount,
        invoice.tokenContract
    );
} else {
    txHashResult = await transferChocoToken(...);
}

// 3. 서버에 결제 검증 요청
const res = await fetch("/api/x402/verify", {
    method: "POST",
    body: JSON.stringify({ token, txHash: txHashResult })
});
```

**서버 사이드** (`app/lib/near/x402.server.ts` - `verifyX402Payment()`):
```typescript
// 1. 인보이스 조회
const invoice = await db.query.x402Invoice.findFirst({
    where: eq(schema.x402Invoice.token, token),
});

// 2. 온체인 트랜잭션 검증
const transfer = await verifyTokenTransfer(txHash, invoice.recipientAddress);

// 3. DB 업데이트: 인보이스 완료 및 CHOCO 잔액 차감
const chocoToDeduct = new BigNumber(transfer.amount)
    .dividedBy(new BigNumber(10).pow(18))
    .toString();

await db.transaction(async (tx) => {
    // 인보이스 상태 변경
    await tx.update(schema.x402Invoice).set({
        status: "PAID",
        txHash,
        paidAt: new Date(),
    });

    // TokenTransfer 기록
    await tx.insert(schema.tokenTransfer).values({...});

    // 유저 CHOCO 잔액 차감 (DB만 업데이트)
    const currentChocoBalance = user?.chocoBalance ? parseFloat(user.chocoBalance) : 0;
    const newChocoBalance = new BigNumber(currentChocoBalance)
        .minus(chocoToDeduct)
        .toString();

    await tx.update(schema.user).set({
        chocoBalance: newChocoBalance,
    });
});
```

### 2.2 문제점 분석

#### 문제점 1: 온체인 전송과 DB 차감의 불일치

**현재 로직**:
1. 클라이언트가 사용자 계정 → 서비스 계정으로 CHOCO 전송 (온체인)
2. 서버가 트랜잭션 검증 후 DB의 `chocoBalance`만 차감

**문제**:
- ✅ 온체인에서 CHOCO가 이미 전송되었으므로, DB 차감은 정상
- ❌ 하지만 **온체인 잔액과 DB 잔액이 동기화되지 않을 수 있음**
- ❌ 클라이언트 전송이 실패했는데 서버가 검증을 통과시킬 수 있음 (네트워크 오류, 타임아웃 등)
- ❌ 클라이언트 전송이 성공했지만 서버 검증이 실패한 경우, 온체인에서는 CHOCO가 전송되었지만 DB는 차감되지 않음

#### 문제점 2: 클라이언트 전송 실패 시 처리 부재

**시나리오**:
1. 사용자가 결제 버튼 클릭
2. `transferChocoTokenGasless()` 호출
3. 네트워크 오류 또는 지갑 연결 실패로 전송 실패
4. 하지만 클라이언트가 에러를 제대로 처리하지 않아 서버 검증 요청이 전송되지 않음
5. 또는 전송은 성공했지만 `txHash`를 받지 못한 경우

**현재 코드의 문제**:
```typescript
// app/components/payment/PaymentSheet.tsx:142
catch (e: any) {
    console.error("Payment error:", e);
    setError(e.message || "결제 중 오류가 발생했습니다.");
    setIsProcessing(false);
}
```
- 에러 발생 시 단순히 에러 메시지만 표시
- 서버에 실패 알림을 보내지 않음
- 인보이스가 `PENDING` 상태로 남아있을 수 있음

#### 문제점 3: 온체인 잔액과 DB 잔액 동기화 부재

**현재 상태**:
- X402 결제 후 온체인 잔액과 DB 잔액을 비교하는 로직이 없음
- `app/lib/near/wallet.server.ts`의 `ensureNearWallet()`에는 동기화 로직이 있지만, X402 결제 후에는 호출되지 않음

**영향**:
- 사용자가 온체인에서 CHOCO를 확인하면 실제로 차감되었지만, DB에는 반영되지 않았거나 그 반대일 수 있음
- 채팅에서 CHOCO 잔액을 확인할 때 DB 기준으로만 표시되므로, 온체인과 불일치 가능

### 2.3 근본 원인

1. **클라이언트-서버 간 비동기 처리 불일치**
   - 클라이언트가 온체인 전송을 수행하고, 서버가 검증만 수행
   - 전송 실패 시 서버에 알림이 가지 않음

2. **온체인-오프체인 동기화 메커니즘 부재**
   - X402 결제 후 온체인 잔액을 확인하여 DB와 동기화하는 로직이 없음
   - `chocoLastSyncAt` 필드가 있지만 업데이트되지 않음

3. **에러 처리 및 롤백 메커니즘 부재**
   - 클라이언트 전송 실패 시 인보이스를 취소하는 로직이 없음
   - 서버 검증 실패 시 클라이언트에 명확한 피드백이 없음

---

## 3. NEAR 환전 후 서비스 계정 반환 문제 상세 분석

### 3.1 현재 구현 플로우

**NEAR 입금 감지 및 환전** (`app/lib/near/deposit-engine.server.ts`):
```typescript
// 1. 입금 감지
if (new BigNumber(currentBalance).gt(new BigNumber(lastBalance))) {
    const depositAmountYocto = new BigNumber(currentBalance)
        .minus(new BigNumber(lastBalance));
    
    // 최소 입금 금액 체크
    if (depositAmountYocto.lt(new BigNumber(utils.format.parseNearAmount("0.01")!))) {
        continue;
    }
    
    // 환전 및 스윕 처리
    await processExchangeAndSweep(user, depositNear, depositAmountYocto.toString(), currentBalance);
}
```

**환전 및 스윕 처리** (`processExchangeAndSweep()`):
```typescript
// 1. CHOCO 토큰 전송 (서비스 계정 → 사용자 계정)
const sendResult = await sendChocoToken(user.nearAccountId, chocoAmountRaw);
const chocoTxHash = (sendResult as any).transaction.hash;

// 2. DB 업데이트
await db.transaction(async (tx) => {
    // CHOCO 잔액 증가
    await tx.update(userTable).set({
        chocoBalance: newChocoBalance.toString(),
        nearLastBalance: currentTotalBalance,
    });
    
    // ExchangeLog 기록 (status: "PENDING_SWEEP")
    await tx.insert(exchangeLogTable).values({
        status: "PENDING_SWEEP",
        ...
    });
});

// 3. 자산 회수 (Sweep) 실행
if (user.isSweepEnabled !== false) {
    await executeSweep(user, currentTotalBalance, exchangeId);
}
```

**스윕 실행** (`executeSweep()`):
```typescript
async function executeSweep(user: any, balanceToSweep: string, exchangeLogId: string) {
    const treasuryAccountId = process.env.NEAR_TREASURY_ACCOUNT_ID || "rogulus.testnet";
    
    // 1. 사용자 개인키 확인
    if (!user.nearPrivateKey) {
        throw new Error("User private key not found");
    }
    
    // 2. 실제 잔액 확인
    const state = await account.getState();
    const actualAvailableBalance = state.amount?.toString() || "0";
    
    // 3. 안전 마진 계산 (0.02 NEAR 남김)
    const safetyMargin = new BigNumber(utils.format.parseNearAmount("0.02")!);
    const sweepAmount = new BigNumber(actualAvailableBalance).minus(safetyMargin);
    
    if (sweepAmount.lte(0)) {
        logger.info("Available balance too low for sweep");
        return;
    }
    
    // 4. NEAR 전송 (사용자 계정 → Treasury 계정)
    const result = await account.sendMoney(treasuryAccountId, sweepAmountRaw);
    
    // 5. 상태 업데이트
    await db.update(exchangeLogTable).set({
        sweepTxHash: result.transaction.hash,
        status: "COMPLETED"
    });
}
```

### 3.2 문제점 분석

#### 문제점 1: `isSweepEnabled` 조건 체크

**현재 로직** (`deposit-engine.server.ts:199`):
```typescript
if (user.isSweepEnabled !== false) {
    await executeSweep(user, currentTotalBalance, exchangeId);
}
```

**문제**:
- ✅ `isSweepEnabled`가 `true` 또는 `null`(기본값)인 경우 스윕 실행
- ❌ 하지만 **`isSweepEnabled`가 명시적으로 `false`로 설정된 경우에만 스윕이 실행되지 않음**
- ❌ DB 스키마에서 `isSweepEnabled`의 기본값이 `true`이지만, 실제로는 `null`일 수 있음
- ❌ 사용자가 스윕을 비활성화한 경우, NEAR가 계정에 남아있게 됨

**영향**:
- 사용자가 스윕을 비활성화하면 NEAR가 서비스 계정으로 반환되지 않음
- 하지만 이는 의도된 동작일 수 있음 (사용자가 NEAR를 보유하고 싶은 경우)

#### 문제점 2: 스윕 실패 시 재시도 로직의 한계

**재시도 로직** (`deposit-engine.server.ts:76-108`):
```typescript
// 실패한 스윕 재시도
const failedLogs = await db.select().from(exchangeLogTable).where(
    and(
        eq(exchangeLogTable.fromChain, "NEAR"),
        sql`${exchangeLogTable.status} IN ('FAILED', 'PENDING_SWEEP')`
    )
);

for (const log of failedLogs) {
    const currentUser = users.find(u => u.id === log.userId);
    if (currentUser && currentUser.nearAccountId) {
        await executeSweep(currentUser, balance, log.id);
    }
}
```

**문제**:
- ✅ `PENDING_SWEEP` 상태의 로그를 재시도
- ❌ 하지만 **재시도 시에도 동일한 실패 원인이 발생할 수 있음**
- ❌ 재시도 로직이 매분 실행되지만, 실패 원인을 해결하지 못하면 계속 실패

#### 문제점 3: 스윕 실패 원인

**가능한 실패 원인** (`executeSweep()` 내부):
1. **개인키 없음**: `user.nearPrivateKey`가 없으면 스윕 불가능
   ```typescript
   if (!user.nearPrivateKey) {
       throw new Error("User private key not found");
   }
   ```

2. **잔액 부족**: 안전 마진(0.02 NEAR)을 제외한 잔액이 0 이하
   ```typescript
   if (sweepAmount.lte(0)) {
       return; // 스윕하지 않고 종료
   }
   ```

3. **키 불일치**: `AccessKeyDoesNotExist` 또는 `invalid signature` 에러
   ```typescript
   const isKeyMismatch = errorMessage.includes("AccessKeyDoesNotExist") ||
       errorMessage.includes("invalid signature");
   ```

4. **네트워크 오류**: NEAR 네트워크 연결 실패

**현재 에러 처리**:
```typescript
catch (error: any) {
    // 에러 로깅
    logger.error({...});
    
    // ExchangeLog 상태를 "FAILED"로 업데이트
    await db.update(exchangeLogTable).set({
        status: "FAILED"
    });
}
```

**문제**:
- ❌ 실패 원인에 따른 구분된 처리가 없음
- ❌ 키 불일치인 경우와 잔액 부족인 경우를 구분하지 않음
- ❌ 키 불일치인 경우 수동 개입이 필요하지만, 자동으로 재시도만 시도함

#### 문제점 4: 스윕 타이밍 문제

**현재 플로우**:
1. NEAR 입금 감지
2. CHOCO 전송 (서비스 계정 → 사용자 계정)
3. DB 업데이트 (CHOCO 잔액 증가, ExchangeLog 생성)
4. **즉시 스윕 실행**

**문제**:
- ✅ 스윕이 즉시 실행되므로 일반적으로 문제없음
- ❌ 하지만 **CHOCO 전송 과정에서 스토리지 예치금 등이 발생했을 수 있음**
- ❌ `executeSweep()` 내부에서 실제 잔액을 다시 확인하지만, 타이밍 이슈가 있을 수 있음

**코드 확인** (`executeSweep()` 내부):
```typescript
// 중요: 환전(CHOCO 전송) 과정에서 스토리지 예치금 등이 발생했을 수 있으므로 
// 전송 직전의 실제 잔액을 다시 확인합니다.
const state = await account.getState();
const actualAvailableBalance = state.amount?.toString() || "0";
```
- ✅ 실제 잔액을 다시 확인하므로 타이밍 문제는 해결됨
- ❌ 하지만 스토리지 예치금이 발생한 경우, 스윕 가능한 금액이 줄어들 수 있음

### 3.3 근본 원인

1. **스윕 조건 체크의 모호함**
   - `isSweepEnabled !== false` 조건이 명확하지 않음
   - 사용자가 스윕을 비활성화한 경우와 활성화한 경우를 구분해야 함

2. **스윕 실패 원인에 따른 구분된 처리 부재**
   - 키 불일치, 잔액 부족, 네트워크 오류 등을 구분하지 않음
   - 모든 실패를 동일하게 처리하여 재시도만 시도

3. **스윕 재시도 로직의 한계**
   - 재시도 로직이 있지만, 근본 원인을 해결하지 못하면 계속 실패
   - 키 불일치인 경우 수동 개입이 필요하지만, 자동으로 재시도만 시도

4. **스토리지 예치금 고려 부족**
   - CHOCO 전송 시 스토리지 예치금이 발생할 수 있음
   - 스윕 가능한 금액이 줄어들 수 있음

---

## 4. 문제 해결 방안 제안

### 4.1 X402 CHOCO 차감 문제 해결 방안

#### 방안 1: 온체인 잔액과 DB 잔액 동기화

**구현 위치**: `app/lib/near/x402.server.ts` - `verifyX402Payment()` 내부

**로직**:
1. 트랜잭션 검증 후 온체인 CHOCO 잔액 조회
2. DB `chocoBalance`와 비교
3. 불일치 시 온체인 잔액을 기준으로 DB 업데이트

**코드 예시**:
```typescript
// verifyX402Payment() 내부
const { getChocoBalance } = await import("./token.server");

// 온체인 잔액 조회
const onChainBalanceRaw = await getChocoBalance(invoice.userId);
const onChainBalanceBN = new BigNumber(onChainBalanceRaw)
    .dividedBy(new BigNumber(10).pow(18));

// DB 잔액과 비교
const dbBalanceBN = new BigNumber(currentChocoBalance);
if (!onChainBalanceBN.isEqualTo(dbBalanceBN)) {
    // 온체인 잔액을 기준으로 DB 업데이트
    await tx.update(schema.user).set({
        chocoBalance: onChainBalanceBN.toString(),
        chocoLastSyncAt: new Date(),
    });
}
```

#### 방안 2: 클라이언트 전송 실패 시 인보이스 취소

**구현 위치**: `app/components/payment/PaymentSheet.tsx`

**로직**:
1. 전송 실패 시 서버에 인보이스 취소 요청
2. 서버에서 인보이스 상태를 `CANCELLED`로 변경

**코드 예시**:
```typescript
try {
    txHashResult = await transferChocoTokenGasless(...);
} catch (error) {
    // 인보이스 취소 요청
    await fetch("/api/x402/cancel", {
        method: "POST",
        body: JSON.stringify({ token }),
    });
    throw error;
}
```

#### 방안 3: 서버 사이드에서 온체인 전송 수행 (대안)

**현재**: 클라이언트가 온체인 전송 → 서버가 검증

**제안**: 서버가 온체인 전송 → 클라이언트는 승인만

**장점**:
- 서버가 전송을 제어하므로 실패 시 처리 가능
- 온체인-오프체인 동기화가 쉬움

**단점**:
- 사용자 개인키가 서버에 있어야 함 (현재는 있음)
- 가스비 대납 로직이 복잡해질 수 있음

### 4.2 NEAR 환전 후 서비스 계정 반환 문제 해결 방안

#### 방안 1: 스윕 조건 명확화

**현재**:
```typescript
if (user.isSweepEnabled !== false) {
    await executeSweep(...);
}
```

**제안**:
```typescript
// 명시적으로 true인 경우에만 스윕 실행
if (user.isSweepEnabled === true) {
    await executeSweep(...);
} else {
    logger.info({
        message: `Sweep disabled for user ${user.id}`,
        metadata: { isSweepEnabled: user.isSweepEnabled }
    });
}
```

#### 방안 2: 스윕 실패 원인에 따른 구분된 처리

**구현 위치**: `app/lib/near/deposit-engine.server.ts` - `executeSweep()`

**로직**:
1. 키 불일치: `status`를 `FAILED_KEY_MISMATCH`로 설정, 재시도하지 않음
2. 잔액 부족: `status`를 `FAILED_INSUFFICIENT_BALANCE`로 설정, 재시도하지 않음
3. 네트워크 오류: `status`를 `FAILED_NETWORK_ERROR`로 설정, 재시도 가능

**코드 예시**:
```typescript
catch (error: any) {
    const errorMessage = error.message || String(error);
    const isKeyMismatch = errorMessage.includes("AccessKeyDoesNotExist") ||
        errorMessage.includes("invalid signature");
    const isInsufficientBalance = errorMessage.includes("insufficient balance");
    
    let status = "FAILED";
    if (isKeyMismatch) {
        status = "FAILED_KEY_MISMATCH";
        // 재시도하지 않음
    } else if (isInsufficientBalance) {
        status = "FAILED_INSUFFICIENT_BALANCE";
        // 재시도하지 않음
    } else {
        status = "FAILED_NETWORK_ERROR";
        // 재시도 가능
    }
    
    await db.update(exchangeLogTable).set({ status });
}
```

#### 방안 3: 스토리지 예치금 고려

**현재**: 안전 마진 0.02 NEAR

**제안**: 스토리지 예치금을 추가로 고려

**코드 예시**:
```typescript
// 스토리지 예치금 계산 (대략 0.01 NEAR)
const storageDeposit = new BigNumber(utils.format.parseNearAmount("0.01")!);
const safetyMargin = new BigNumber(utils.format.parseNearAmount("0.02")!);
const totalReserved = safetyMargin.plus(storageDeposit);

const sweepAmount = new BigNumber(actualAvailableBalance).minus(totalReserved);
```

#### 방안 4: 스윕 재시도 로직 개선

**현재**: 모든 `PENDING_SWEEP` 상태를 재시도

**제안**: 실패 원인에 따라 재시도 여부 결정

**코드 예시**:
```typescript
// 재시도 가능한 상태만 필터링
const retryableLogs = await db.select().from(exchangeLogTable).where(
    and(
        eq(exchangeLogTable.fromChain, "NEAR"),
        sql`${exchangeLogTable.status} IN ('PENDING_SWEEP', 'FAILED_NETWORK_ERROR')`
    )
);
```

---

## 5. 우선순위 및 권장 사항

### 5.1 X402 CHOCO 차감 문제

**우선순위: 높음**

**즉시 조치**:
1. ✅ 온체인 잔액과 DB 잔액 동기화 로직 추가
2. ✅ 클라이언트 전송 실패 시 인보이스 취소 로직 추가
3. ✅ `chocoLastSyncAt` 필드 업데이트

**장기 개선**:
1. 서버 사이드에서 온체인 전송 수행 검토
2. 실시간 잔액 동기화 메커니즘 구축

### 5.2 NEAR 환전 후 서비스 계정 반환 문제

**우선순위: 중간**

**즉시 조치**:
1. ✅ 스윕 조건 명확화 (`isSweepEnabled === true`)
2. ✅ 스윕 실패 원인에 따른 구분된 처리
3. ✅ 스토리지 예치금 고려

**장기 개선**:
1. 스윕 재시도 로직 개선
2. 관리자 대시보드에서 스윕 실패 로그 확인 기능

---

## 6. 결론

### 6.1 X402 CHOCO 차감 문제

**근본 원인**:
- 클라이언트-서버 간 비동기 처리 불일치
- 온체인-오프체인 동기화 메커니즘 부재

**해결 방안**:
- 온체인 잔액과 DB 잔액 동기화 로직 추가
- 클라이언트 전송 실패 시 인보이스 취소 로직 추가

### 6.2 NEAR 환전 후 서비스 계정 반환 문제

**근본 원인**:
- 스윕 조건 체크의 모호함
- 스윕 실패 원인에 따른 구분된 처리 부재
- 스토리지 예치금 고려 부족

**해결 방안**:
- 스윕 조건 명확화
- 스윕 실패 원인에 따른 구분된 처리
- 스토리지 예치금 고려

### 1.3 문제 3: 지갑 생성 시 프라이빗 키 저장 문제

**현상**:
- 지갑 생성 시 프라이빗 키가 제대로 저장되지 않아, 사용자의 지갑에서 CHOCO와 NEAR를 가져올 수 없음
- 복호화 실패로 인해 스윕, CHOCO 반환 등이 불가능

---

## 7. 지갑 생성 시 프라이빗 키 저장 문제 상세 분석

### 7.1 현재 구현 플로우

**지갑 생성** (`app/lib/near/wallet.server.ts` - `ensureNearWallet()`):
```typescript
// 1. 키 페어 생성
const keyPair = KeyPair.fromRandom("ed25519");
publicKey = keyPair.getPublicKey().toString();
const privateKey = keyPair.toString(); // TODO: 실제 운영 시 암호화 라이브러리 연동 권장

// 2. 온체인 계정 생성
// ... (계정 생성 로직)

// 3. 개인키 암호화
const { encrypt } = await import("./key-encryption.server");
const encryptedPrivateKey = encrypt(privateKey);

// 4. DB 업데이트 (지갑 정보 저장)
await db.update(schema.user).set({
    nearAccountId: newAccountId,
    nearPublicKey: publicKey,
    nearPrivateKey: encryptedPrivateKey,
    chocoBalance: "0",
    updatedAt: new Date(),
});
```

**암호화 함수** (`app/lib/near/key-encryption.server.ts`):
```typescript
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}
```

**복호화 함수** (`app/lib/near/key-encryption.server.ts`):
```typescript
export function decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== "string") {
        throw new Error("Encrypted text is required and must be a string");
    }
    
    // 암호화 형식 검증: 'iv:authTag:encryptedContent' 형식이어야 함
    const parts = encryptedText.split(":");
    
    if (parts.length !== 3) {
        throw new Error(
            `Invalid encrypted text format. Expected format: 'iv:authTag:encryptedContent', ` +
            `but got ${parts.length} parts. This may indicate the private key was not encrypted properly.`
        );
    }
    
    // ... (복호화 로직)
}
```

### 7.2 문제점 분석

#### 문제점 1: 암호화 실패 시 에러 처리 부재

**현재 로직** (`wallet.server.ts:110-111`):
```typescript
const { encrypt } = await import("./key-encryption.server");
const encryptedPrivateKey = encrypt(privateKey);
```

**문제**:
- ❌ `encrypt()` 함수가 에러를 throw할 수 있지만, try-catch로 감싸지 않음
- ❌ 암호화 실패 시 지갑 생성이 실패하지만, 에러 메시지가 명확하지 않음
- ❌ 암호화 실패 시 DB에 잘못된 값이 저장될 수 있음

**가능한 암호화 실패 원인**:
1. `ENCRYPTION_KEY` 환경 변수가 없거나 잘못된 형식
2. `getEncryptionKey()` 함수에서 에러 발생
3. `crypto.createCipheriv()` 실패

#### 문제점 2: DB 저장 실패 시 롤백 부재

**현재 로직** (`wallet.server.ts:114-122`):
```typescript
await db.update(schema.user).set({
    nearAccountId: newAccountId,
    nearPublicKey: publicKey,
    nearPrivateKey: encryptedPrivateKey,
    chocoBalance: "0",
    updatedAt: new Date(),
});
```

**문제**:
- ❌ DB 업데이트가 실패해도 온체인 계정은 이미 생성됨
- ❌ 트랜잭션으로 감싸지 않아 부분 실패 가능
- ❌ `nearAccountId`는 저장되었지만 `nearPrivateKey`가 저장되지 않은 경우 발생 가능

#### 문제점 3: 프라이빗 키 형식 불일치

**현재 로직** (`wallet.server.ts:38`):
```typescript
const privateKey = keyPair.toString(); // TODO: 실제 운영 시 암호화 라이브러리 연동 권장
```

**문제**:
- ❌ `KeyPair.toString()`의 반환 형식이 예상과 다를 수 있음
- ❌ NEAR의 `KeyPair.toString()`은 `ed25519:...` 형식으로 반환
- ❌ 이 형식이 암호화 함수에 전달되어 저장됨
- ❌ 복호화 후 `KeyPair.fromString()`에 전달할 때 형식이 맞지 않을 수 있음

**예상되는 형식**:
- `KeyPair.toString()`: `ed25519:Base58EncodedPrivateKey`
- 암호화 후: `iv:authTag:encryptedContent`
- 복호화 후: `ed25519:Base58EncodedPrivateKey` (원래 형식)

**실제 사용** (`token.server.ts:99`):
```typescript
const userKeyPair = KeyPair.fromString(userPrivateKey as any);
```

**잠재적 문제**:
- 복호화된 키가 `ed25519:` 접두사 없이 저장된 경우 `KeyPair.fromString()` 실패 가능
- 암호화 전후 형식이 일치하지 않을 수 있음

#### 문제점 4: 복호화 실패 시 에러 처리 부족

**현재 사용 예시** (`deposit-engine.server.ts:225`):
```typescript
const privateKey = decrypt(user.nearPrivateKey);
const keyPair = KeyPair.fromString(privateKey as any);
```

**문제**:
- ❌ `decrypt()` 실패 시 명확한 에러 메시지 없음
- ❌ 복호화 실패 원인을 구분하지 않음
- ❌ 복호화 실패 시 스윕이 불가능하지만, 에러만 로깅하고 종료

**복호화 실패 원인**:
1. **암호화 형식 불일치**: `parts.length !== 3`
   - 프라이빗 키가 암호화되지 않은 상태로 저장됨
   - 암호화 과정에서 에러가 발생했지만 저장됨

2. **암호화 키 변경**: `bad decrypt` 에러
   - `ENCRYPTION_KEY` 환경 변수가 변경됨
   - 프로덕션과 개발 환경 간 키 불일치

3. **데이터 손상**: 복호화 과정에서 에러
   - DB 저장 과정에서 데이터 손상
   - 네트워크 전송 중 데이터 손상

#### 문제점 5: 프라이빗 키 검증 부재

**현재 상태**:
- ❌ 지갑 생성 후 프라이빗 키가 올바르게 저장되었는지 검증하지 않음
- ❌ 복호화 테스트를 수행하지 않음
- ❌ 온체인 계정과 프라이빗 키의 일치 여부를 확인하지 않음

**영향**:
- 지갑 생성은 성공했지만, 나중에 프라이빗 키를 사용할 수 없음
- 사용자가 CHOCO나 NEAR를 입금했지만, 서비스에서 가져올 수 없음

### 7.3 근본 원인

1. **암호화/복호화 에러 처리 부재**
   - 암호화 실패 시 명확한 에러 처리 없음
   - 복호화 실패 시 구분된 처리 없음

2. **프라이빗 키 형식 검증 부재**
   - `KeyPair.toString()`의 반환 형식이 예상과 다를 수 있음
   - 복호화 후 형식 검증 없음

3. **지갑 생성 후 검증 부재**
   - 프라이빗 키가 올바르게 저장되었는지 확인하지 않음
   - 복호화 테스트를 수행하지 않음

4. **DB 저장 실패 시 롤백 부재**
   - 온체인 계정 생성과 DB 저장이 원자적으로 처리되지 않음
   - 부분 실패 시 복구 불가능

---

## 8. 프라이빗 키 저장 문제 해결 방안

### 8.1 방안 1: 암호화/복호화 에러 처리 강화

**구현 위치**: `app/lib/near/wallet.server.ts` - `ensureNearWallet()`

**로직**:
1. 암호화 시 try-catch로 감싸기
2. 암호화 실패 시 명확한 에러 메시지
3. DB 저장 전 암호화 성공 확인

**코드 예시**:
```typescript
// 6. 개인키 암호화
let encryptedPrivateKey: string;
try {
    const { encrypt } = await import("./key-encryption.server");
    encryptedPrivateKey = encrypt(privateKey);
    
    // 암호화 검증: 복호화 테스트
    const { decrypt } = await import("./key-encryption.server");
    const decryptedTest = decrypt(encryptedPrivateKey);
    if (decryptedTest !== privateKey) {
        throw new Error("Encryption/decryption verification failed");
    }
} catch (encryptError: any) {
    logger.error({
        category: "WALLET",
        message: `Failed to encrypt private key for user ${userId}`,
        stackTrace: encryptError.stack,
        metadata: { userId, nearAccountId: newAccountId }
    });
    throw new Error(`Failed to encrypt private key: ${encryptError.message}`);
}
```

### 8.2 방안 2: 프라이빗 키 형식 검증

**구현 위치**: `app/lib/near/wallet.server.ts` - `ensureNearWallet()`

**로직**:
1. `KeyPair.toString()`의 반환 형식 확인
2. `ed25519:` 접두사 포함 여부 확인
3. 복호화 후 `KeyPair.fromString()` 테스트

**코드 예시**:
```typescript
// 2. 새 키 페어 생성
const keyPair = KeyPair.fromRandom("ed25519");
publicKey = keyPair.getPublicKey().toString();
const privateKey = keyPair.toString();

// 프라이빗 키 형식 검증
if (!privateKey.startsWith("ed25519:")) {
    throw new Error(`Invalid private key format: ${privateKey.substring(0, 20)}...`);
}

// KeyPair.fromString() 테스트
try {
    const testKeyPair = KeyPair.fromString(privateKey as any);
    if (testKeyPair.getPublicKey().toString() !== publicKey) {
        throw new Error("Private key format verification failed");
    }
} catch (formatError) {
    throw new Error(`Invalid private key format: ${formatError.message}`);
}
```

### 8.3 방안 3: 지갑 생성 후 검증

**구현 위치**: `app/lib/near/wallet.server.ts` - `ensureNearWallet()`

**로직**:
1. DB 저장 후 프라이빗 키 복호화 테스트
2. 온체인 계정과 프라이빗 키 일치 확인
3. 검증 실패 시 롤백 또는 재시도

**코드 예시**:
```typescript
// 7. DB 업데이트 후 검증
await db.update(schema.user).set({...});

// 프라이빗 키 검증: 복호화 및 KeyPair 생성 테스트
try {
    const { decrypt } = await import("./key-encryption.server");
    const { getChocoBalance } = await import("./token.server");
    const { KeyPair } = await import("near-api-js");
    
    const decryptedKey = decrypt(encryptedPrivateKey);
    const testKeyPair = KeyPair.fromString(decryptedKey as any);
    
    // 온체인 계정과 일치하는지 확인 (선택적)
    // const onChainBalance = await getChocoBalance(newAccountId);
    
    logger.info({
        category: "WALLET",
        message: `Private key verification successful for user ${userId}`,
        metadata: { userId, nearAccountId: newAccountId }
    });
} catch (verifyError: any) {
    logger.error({
        category: "WALLET",
        message: `Private key verification failed for user ${userId}`,
        stackTrace: verifyError.stack,
        metadata: { userId, nearAccountId: newAccountId }
    });
    // 검증 실패 시 롤백 고려 (하지만 온체인 계정은 이미 생성됨)
    throw new Error(`Private key verification failed: ${verifyError.message}`);
}
```

### 8.4 방안 4: 복호화 실패 시 구분된 처리

**구현 위치**: 모든 `decrypt()` 호출 위치

**로직**:
1. 복호화 실패 원인 구분
2. 원인에 따른 적절한 처리
3. 복구 가능한 경우 재시도

**코드 예시** (`deposit-engine.server.ts`):
```typescript
let privateKey: string;
try {
    privateKey = decrypt(user.nearPrivateKey);
} catch (decryptError: any) {
    const errorMessage = decryptError.message || String(decryptError);
    
    if (errorMessage.includes("Invalid encrypted text format")) {
        // 암호화 형식 불일치: 프라이빗 키가 올바르게 저장되지 않음
        logger.error({
            category: "PAYMENT",
            message: `CRITICAL: Private key format invalid for ${user.nearAccountId}. Sweep impossible.`,
            metadata: { userId: user.id, nearAccountId: user.nearAccountId }
        });
        throw new Error("Private key format invalid. Manual intervention required.");
    } else if (errorMessage.includes("encryption key")) {
        // 암호화 키 문제: 환경 변수 불일치
        logger.error({
            category: "PAYMENT",
            message: `CRITICAL: Encryption key mismatch for ${user.nearAccountId}. Sweep impossible.`,
            metadata: { userId: user.id, nearAccountId: user.nearAccountId }
        });
        throw new Error("Encryption key mismatch. Check ENCRYPTION_KEY environment variable.");
    } else {
        // 기타 복호화 에러
        logger.error({
            category: "PAYMENT",
            message: `Decryption failed for ${user.nearAccountId}`,
            stackTrace: decryptError.stack,
            metadata: { userId: user.id, nearAccountId: user.nearAccountId }
        });
        throw decryptError;
    }
}
```

### 8.5 방안 5: DB 저장 트랜잭션 처리

**구현 위치**: `app/lib/near/wallet.server.ts` - `ensureNearWallet()`

**로직**:
1. 온체인 계정 생성과 DB 저장을 트랜잭션으로 처리
2. 부분 실패 시 롤백
3. 하지만 온체인 계정은 이미 생성되므로 완전한 롤백은 불가능

**코드 예시**:
```typescript
// 온체인 계정 생성
await serviceAccount.functionCall({...});

// DB 저장 (트랜잭션)
await db.transaction(async (tx) => {
    await tx.update(schema.user).set({
        nearAccountId: newAccountId,
        nearPublicKey: publicKey,
        nearPrivateKey: encryptedPrivateKey,
        chocoBalance: "0",
        updatedAt: new Date(),
    });
    
    // 검증: 저장된 값 확인
    const savedUser = await tx.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: { nearPrivateKey: true }
    });
    
    if (!savedUser?.nearPrivateKey || savedUser.nearPrivateKey !== encryptedPrivateKey) {
        throw new Error("Failed to save private key to database");
    }
});
```

---

## 9. 우선순위 및 권장 사항 (프라이빗 키 저장 문제)

### 9.1 우선순위: 매우 높음

**즉시 조치**:
1. ✅ 암호화/복호화 에러 처리 강화
2. ✅ 프라이빗 키 형식 검증
3. ✅ 지갑 생성 후 검증
4. ✅ 복호화 실패 시 구분된 처리

**장기 개선**:
1. DB 저장 트랜잭션 처리
2. 프라이빗 키 복구 메커니즘 구축
3. 관리자 대시보드에서 프라이빗 키 문제 감지 기능

---

## 10. 결론 (프라이빗 키 저장 문제)

### 10.1 근본 원인

1. **암호화/복호화 에러 처리 부재**
   - 암호화 실패 시 명확한 에러 처리 없음
   - 복호화 실패 시 구분된 처리 없음

2. **프라이빗 키 형식 검증 부재**
   - `KeyPair.toString()`의 반환 형식이 예상과 다를 수 있음
   - 복호화 후 형식 검증 없음

3. **지갑 생성 후 검증 부재**
   - 프라이빗 키가 올바르게 저장되었는지 확인하지 않음
   - 복호화 테스트를 수행하지 않음

### 10.2 해결 방안

- 암호화/복호화 에러 처리 강화
- 프라이빗 키 형식 검증
- 지갑 생성 후 검증
- 복호화 실패 시 구분된 처리

---

**상태**: 📋 분석 완료  
**다음 단계**: 코드 수정 (사용자 승인 후)
