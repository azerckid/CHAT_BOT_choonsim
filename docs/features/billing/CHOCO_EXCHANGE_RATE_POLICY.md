# CHOCO 환율 계산 정책 사양서

**작성일**: 2026-01-11  
**목적**: CHOCO 환율 계산 기준 및 정책 정의  
**상태**: 📋 설계 완료

---

## 1. 기본 원칙

### 1.1 USD 기준 통일 정책

**핵심 원칙**: USD를 스테이블 코인과 동일하게 간주하고, USD를 기준으로 모든 통화를 CHOCO로 변환합니다.

**이유**:
1. **일관성**: 모든 통화가 동일한 기준(USD)으로 계산되어 일관성 유지
2. **공정성**: 각 통화의 실제 가치를 반영한 공정한 환율 제공
3. **유지보수성**: 하나의 기준(USD)만 관리하면 되므로 유지보수 용이
4. **자동 반영**: 환율 변동 시 자동으로 반영됨

### 1.2 CHOCO 가격 고정

**CHOCO 가격**: `CHOCO_PRICE_USD = 0.0001`
- 1 CHOCO = $0.0001
- $1 = 10,000 CHOCO

**특징**:
- CHOCO 가격은 USD 기준으로 고정
- 다른 통화는 USD를 거쳐 CHOCO로 변환

---

## 2. 환율 계산 방식

### 2.1 USD → CHOCO

**공식**: `CHOCO = USD / CHOCO_PRICE_USD`

**예시**:
- $1 = 1 / 0.0001 = 10,000 CHOCO
- $5 = 5 / 0.0001 = 50,000 CHOCO
- $10 = 10 / 0.0001 = 100,000 CHOCO

**구현**:
```typescript
export async function calculateChocoFromUSD(usdAmount: number): Promise<string> {
    const chocoAmount = new BigNumber(usdAmount).dividedBy(CHOCO_PRICE_USD);
    return chocoAmount.toString();
}
```

**특징**:
- ✅ 실시간 계산 (환율 변동 없음)
- ✅ 정확한 계산 (BigNumber 사용)

---

### 2.2 KRW → CHOCO

**공식**: `CHOCO = (KRW / USD_KRW_RATE) / CHOCO_PRICE_USD`

**단계**:
1. KRW → USD 변환 (USD/KRW 환율 사용)
2. USD → CHOCO 변환 (CHOCO_PRICE_USD 사용)

**예시** (USD/KRW = 1,350 가정):
- ₩6,900 = (6,900 / 1,350) / 0.0001 = $5.11 / 0.0001 = 51,111 CHOCO
- ₩13,900 = (13,900 / 1,350) / 0.0001 = $10.30 / 0.0001 = 103,000 CHOCO

**구현**:
```typescript
export async function calculateChocoFromKRW(krwAmount: number): Promise<string> {
    // 1. USD/KRW 환율 조회 (실시간)
    const usdKrwRate = await getUSDKRWRate();
    
    // 2. KRW → USD 변환
    const usdAmount = new BigNumber(krwAmount).dividedBy(usdKrwRate);
    
    // 3. USD → CHOCO 변환
    const chocoAmount = await calculateChocoFromUSD(usdAmount.toNumber());
    
    return chocoAmount;
}
```

**특징**:
- ✅ 실시간 USD/KRW 환율 사용
- ✅ USD 기준으로 통일된 계산
- ✅ 환율 변동 자동 반영

**환율 소스**: ExchangeRate-API (`https://api.exchangerate-api.com/v4/latest/USD`)
- 캐시: 5분
- 폴백: 1,350 KRW (기본값)

---

### 2.3 NEAR → CHOCO

**공식**: `CHOCO = (NEAR × NEAR_PRICE_USD) / CHOCO_PRICE_USD`

**단계**:
1. NEAR → USD 변환 (NEAR/USD 환율 사용)
2. USD → CHOCO 변환 (CHOCO_PRICE_USD 사용)

**예시** (NEAR/USD = $5 가정):
- 1 NEAR = (1 × 5) / 0.0001 = $5 / 0.0001 = 50,000 CHOCO
- 2 NEAR = (2 × 5) / 0.0001 = $10 / 0.0001 = 100,000 CHOCO

**예시** (NEAR/USD = $10 가정):
- 1 NEAR = (1 × 10) / 0.0001 = $10 / 0.0001 = 100,000 CHOCO
- 2 NEAR = (2 × 10) / 0.0001 = $20 / 0.0001 = 200,000 CHOCO

**구현** (권장):
```typescript
export async function calculateChocoFromNear(nearAmount: string | number): Promise<string> {
    // 1. NEAR 가격 조회 (USD, 실시간)
    const nearPriceUSD = await getNearPriceUSD();
    
    // 2. NEAR → USD 변환
    const amount = typeof nearAmount === "string" ? parseFloat(nearAmount) : nearAmount;
    const usdAmount = new BigNumber(amount).multipliedBy(nearPriceUSD);
    
    // 3. USD → CHOCO 변환
    const chocoAmount = await calculateChocoFromUSD(usdAmount.toNumber());
    
    return chocoAmount.toString();
}
```

**현재 상태**: ⚠️ 고정비율 사용 중 (1 NEAR = 5,000 CHOCO)
- **문제점**: NEAR 가격 변동을 반영하지 못함
- **권장**: USD 기준으로 변경 필요

**환율 소스**: CoinGecko API (`https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd`)
- 캐시: 5분
- 폴백: $5 (기본값)

---

## 3. 환율 계산 흐름도

```
[KRW] ──USD/KRW 환율──> [USD] ──CHOCO_PRICE_USD──> [CHOCO]
                                                      ↑
[NEAR] ──NEAR/USD 환율──> [USD] ────────────────────┘
                                                      ↑
[USD] ──────────────────────────────────────────────┘
```

**핵심**: 모든 통화는 USD를 거쳐 CHOCO로 변환됩니다.

---

## 4. 환율 소스 및 캐싱

### 4.1 환율 소스

| 통화 페어 | 소스 | API 엔드포인트 | 기본값 |
|---------|------|--------------|--------|
| USD/KRW | ExchangeRate-API | `https://api.exchangerate-api.com/v4/latest/USD` | 1,350 |
| NEAR/USD | CoinGecko | `https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd` | $5 |

### 4.2 캐싱 전략

**3단계 캐싱**:
1. **메모리 캐시**: 서버 메모리 (5분)
2. **DB 캐시**: ExchangeRate 테이블 (5분)
3. **API 호출**: 실시간 환율 조회

**캐시 우선순위**:
```
메모리 캐시 → DB 캐시 → API 호출
```

**캐시 만료 시간**: 5분 (300,000ms)

**이유**:
- API 호출 비용 절감
- 응답 속도 향상
- 환율 변동성 고려 (5분 내 큰 변동 없음)

---

## 5. 구현 상태

### 5.1 완료된 구현

#### ✅ USD → CHOCO
- **파일**: `app/lib/near/exchange-rate.server.ts`
- **함수**: `calculateChocoFromUSD()`
- **상태**: 완료, 정확한 계산

#### ✅ KRW → CHOCO
- **파일**: `app/lib/near/exchange-rate.server.ts`
- **함수**: `calculateChocoFromKRW()`
- **상태**: 완료, USD 기준으로 계산

#### ✅ USD/KRW 환율 조회
- **파일**: `app/lib/near/exchange-rate.server.ts`
- **함수**: `getUSDKRWRate()`
- **상태**: 완료, 실시간 환율 사용

#### ✅ NEAR/USD 환율 조회
- **파일**: `app/lib/near/exchange-rate.server.ts`
- **함수**: `getNearPriceUSD()`
- **상태**: 완료, 실시간 환율 사용

### 5.2 개선 필요

#### ⚠️ NEAR → CHOCO
- **파일**: `app/lib/near/exchange-rate.server.ts`
- **함수**: `calculateChocoFromNear()`
- **현재 상태**: 고정비율 사용 (1 NEAR = 5,000 CHOCO)
- **문제점**: NEAR 가격 변동 미반영
- **권장 변경**: USD 기준으로 계산하도록 변경

**현재 구현**:
```typescript
export async function calculateChocoFromNear(nearAmount: string | number): Promise<string> {
    // MVP: 고정비율 1 NEAR = 5,000 CHOCO
    const fixedRate = 5000;
    const amount = typeof nearAmount === "string" ? parseFloat(nearAmount) : nearAmount;
    return new BigNumber(amount).multipliedBy(fixedRate).toString();
}
```

**권장 구현**:
```typescript
export async function calculateChocoFromNear(nearAmount: string | number): Promise<string> {
    // 1. NEAR 가격 조회 (USD, 실시간)
    const nearPriceUSD = await getNearPriceUSD();
    
    // 2. NEAR → USD 변환
    const amount = typeof nearAmount === "string" ? parseFloat(nearAmount) : nearAmount;
    const usdAmount = new BigNumber(amount).multipliedBy(nearPriceUSD);
    
    // 3. USD → CHOCO 변환
    const chocoAmount = await calculateChocoFromUSD(usdAmount.toNumber());
    
    logger.info({
        category: "PAYMENT",
        message: `Calculated CHOCO from NEAR: ${amount} NEAR = ${chocoAmount} CHOCO (NEAR Price: $${nearPriceUSD})`,
        metadata: { nearAmount: amount, nearPriceUSD, usdAmount: usdAmount.toString(), chocoAmount }
    });
    
    return chocoAmount.toString();
}
```

---

## 6. 환율 계산 예시

### 6.1 시나리오 1: USD 결제

**입력**: $10
**계산**: 10 / 0.0001 = 100,000 CHOCO
**결과**: 100,000 CHOCO

### 6.2 시나리오 2: KRW 결제

**입력**: ₩13,900
**환율**: USD/KRW = 1,350
**계산**:
1. KRW → USD: 13,900 / 1,350 = $10.30
2. USD → CHOCO: 10.30 / 0.0001 = 103,000 CHOCO
**결과**: 103,000 CHOCO

### 6.3 시나리오 3: NEAR 입금 (현재 - 고정비율)

**입력**: 1 NEAR
**계산**: 1 × 5,000 = 5,000 CHOCO
**결과**: 5,000 CHOCO

### 6.4 시나리오 4: NEAR 입금 (권장 - USD 기준)

**입력**: 1 NEAR
**환율**: NEAR/USD = $5
**계산**:
1. NEAR → USD: 1 × 5 = $5
2. USD → CHOCO: 5 / 0.0001 = 50,000 CHOCO
**결과**: 50,000 CHOCO

**입력**: 1 NEAR (NEAR 가격 상승 시)
**환율**: NEAR/USD = $10
**계산**:
1. NEAR → USD: 1 × 10 = $10
2. USD → CHOCO: 10 / 0.0001 = 100,000 CHOCO
**결과**: 100,000 CHOCO

---

## 7. 패키지 가격 정책

### 7.1 현재 패키지

| 패키지 | USD 가격 | KRW 가격 | CHOCO 양 | 이론상 CHOCO (USD 기준) |
|--------|---------|---------|---------|----------------------|
| Starter Pack | $5 | ₩6,900 | 5,000 | 50,000 |
| Value Pack | $10 | ₩13,900 | 14,000 | 100,000 |
| Pro Pack | $20 | ₩27,900 | 32,000 | 200,000 |
| Mega Pack | $50 | ₩69,000 | 90,000 | 500,000 |

### 7.2 분석

**현재 CHOCO 양 < 이론상 CHOCO 양**

**가능한 이유**:
1. **보너스/할인 정책**: 초기 가입자에게 할인 제공
2. **마케팅 전략**: 낮은 가격으로 유입 유도
3. **패키지 가격 정책**: 패키지별로 다른 CHOCO 양 제공

**권장 사항**:
- 패키지 가격 정책을 명확히 문서화
- 사용자에게 보너스/할인 정책을 명시
- 또는 패키지 CHOCO 양을 USD 기준으로 조정

---

## 8. 구현 체크리스트

### Phase 1: NEAR → CHOCO USD 기준 변경
- [ ] `calculateChocoFromNear()` 함수 수정
- [ ] 고정비율 제거
- [ ] USD 기준 계산 로직 추가
- [ ] 로깅 추가
- [ ] 테스트 작성

### Phase 2: 패키지 가격 정책 검토
- [ ] 현재 패키지 CHOCO 양 검토
- [ ] 보너스/할인 정책 명확화
- [ ] 문서화

### Phase 3: 테스트 및 검증
- [ ] USD → CHOCO 계산 테스트
- [ ] KRW → CHOCO 계산 테스트
- [ ] NEAR → CHOCO 계산 테스트 (USD 기준)
- [ ] 환율 변동 시나리오 테스트
- [ ] 캐싱 동작 테스트

---

## 9. 참고 사항

### 9.1 CHOCO 가격 고정

CHOCO 가격(`CHOCO_PRICE_USD = 0.0001`)은 고정되어 있습니다:
- USD 가격 변동 없음
- 다른 통화만 USD를 거쳐 CHOCO로 변환

### 9.2 환율 변동성

**USD/KRW**: 상대적으로 안정적 (일일 변동 1-2%)
- 캐시 시간: 5분 적절

**NEAR/USD**: 변동성이 높음 (일일 변동 5-10% 가능)
- 캐시 시간: 5분 적절
- 실시간 반영 중요

### 9.3 정확도

**BigNumber 사용**: 모든 계산에서 BigNumber 사용하여 정확도 보장
- 소수점 처리 정확
- 큰 숫자 처리 가능

---

## 10. 향후 개선 사항

### 10.1 추가 통화 지원

향후 다른 통화를 지원할 때:
- USD 기준으로 계산
- 환율 소스 추가
- 캐싱 전략 동일하게 적용

### 10.2 환율 알림

- 환율 변동이 클 때 관리자 알림
- 사용자에게 환율 변동 안내 (선택적)

### 10.3 환율 히스토리

- ExchangeRate 테이블에 히스토리 저장
- 과거 환율 조회 기능
- 환율 변동 추이 분석

---

**문서 버전**: 1.0  
**최종 수정일**: 2026-01-11
