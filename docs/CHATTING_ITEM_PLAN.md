# CHATTING_ITEM_PLAN: 가상 아이템 및 선물 시스템 (Hearts & Beyond)

본 문서는 사용자가 캐릭터(아이돌/페르소나)에게 "하트" 등의 아이템을 선물하여 애정을 표현하고, 이를 통해 서비스의 상호작용과 수익 모델을 강화하기 위한 **채팅 아이템 시스템**의 구현 계획을 정의합니다.

**프로젝트 컨텍스트:**
- **Framework**: React Router v7 (Vite)
- **Database**: Turso (libSQL) with Prisma ORM
- **Authentication**: Better Auth (session-based)
- **AI Integration**: Google Gemini API with LangGraph
- **Payment Systems**: PayPal, Toss Payments (이미 구현 완료)
- **Current Status**: 계획 단계 (구현 전)
- **Character Data**: `app/lib/characters.ts`에 하드코딩된 CHARACTERS 객체 사용 (별도 Character 테이블 없음)

---

## 1. 개요 (Objective)
- **심리적 보상**: 사용자가 좋아하는 캐릭터에게 구체적인 보상(하트 등)을 제공함으로써 유대감 강화.
- **게임화 요소 (Gamification)**: 캐릭터별 '받은 하트 수' 랭킹 등을 통해 커뮤니티 활성화 유도.
- **수익 모델 확장**: 정기 구독 및 크레딧 충전 외에, 특정 용도의 가상 아이템 판매를 통한 매출 증대.
- **확장성**: 하트 외에도 향후 '꽃', '곰인형', '편지' 등 다양한 상호작용 아이템을 쉽게 추가할 수 있는 구조 설계.

---

## 2. 아이템 정의: "하트 (Heart)"
- **목적**: 캐릭터에 대한 호감도 표현 및 응원.
- **획득 방법**: 상점(Store)에서 패키지로 구매.
- **사용처**: 채팅방 내부에서 캐릭터에게 직접 발송.
- **효과**: 
    - 캐릭터 프로필/채팅창 상단에 누적 하트 수 표시.
    - 캐릭터가 선물을 받았을 때 특별한 감사 반응 (AI 응답) 트리거 가능.

---

## 3. 데이터베이스 스키마 설계 (Database Schema)

기존 `User` 모델과 연동되는 아이템 관련 테이블을 추가합니다.

**참고**: 현재 프로젝트에는 별도의 `Character` 테이블이 없으며, `app/lib/characters.ts`에 하드코딩된 CHARACTERS 객체를 사용합니다. 따라서 `characterId`는 문자열 ID로 저장됩니다.

### 3.1 `Item` (아이템 정의)
아이템의 종류와 정보를 관리합니다. 초기에는 하드코딩된 상수로 관리 가능하지만, 향후 관리자 페이지에서 동적으로 관리하려면 DB 모델 추가 고려.

```prisma
model Item {
  id          String   @id @default(uuid())
  name        String   // "하트", "장미", "편지" 등
  type        String   // "GIFT", "CONSUMABLE"
  priceCredits Int?   // 크레딧 가격 (null이면 직접 결제만 가능)
  priceUSD    Float?  // USD 가격 (직접 결제)
  priceKRW    Float?  // KRW 가격 (직접 결제)
  iconUrl     String?  // 아이템 이미지/아이콘 경로
  description String?  // 아이템 설명
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  UserInventory UserInventory[]
  GiftLog       GiftLog[]
  
  @@index([isActive])
}
```

**초기 구현**: TypeScript 상수로 관리 (`app/lib/items.ts`)
```typescript
export const ITEMS = {
  HEART: {
    id: "heart",
    name: "하트",
    type: "GIFT",
    priceCredits: 100, // 100 크레딧 = 1 하트
    iconUrl: "/icons/heart.svg",
  },
  // ...
} as const;
```

### 3.2 `UserInventory` (사용자 보유 현황)
사용자가 현재 보유 중인 아이템 수량을 관리합니다.

```prisma
model UserInventory {
  id        String   @id @default(uuid())
  userId    String
  itemId    String
  quantity  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  User User @relation(fields: [userId], references: [id], onDelete: Cascade)
  Item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  
  @@unique([userId, itemId])
  @@index([userId])
}
```

### 3.3 `CharacterStat` (캐릭터 통계)
캐릭터가 받은 총 선물 수량 등을 관리합니다. `characterId`는 문자열 ID (CHARACTERS 객체의 키).

```prisma
model CharacterStat {
  id                String   @id @default(uuid())
  characterId       String   // "chunsim", "character2" 등
  totalHearts       Int      @default(0)
  totalUniqueGivers Int      @default(0)
  lastGiftAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  GiftLog GiftLog[]
  
  @@unique([characterId])
  @@index([totalHearts]) // 랭킹 조회용
}
```

### 3.4 `GiftLog` (선물 기록)
선물 발생 히스토리를 추적합니다. (누가, 누구에게, 언제, 무엇을)

```prisma
model GiftLog {
  id            String   @id @default(uuid())
  fromUserId    String
  toCharacterId String   // CHARACTERS 객체의 키
  itemId        String
  amount        Int      // 보낸 수량
  message       String?  // 선물과 함께 보낸 짧은 메시지
  createdAt     DateTime @default(now())
  
  User          User     @relation(fields: [fromUserId], references: [id], onDelete: Cascade)
  Item          Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  CharacterStat CharacterStat @relation(fields: [toCharacterId], references: [characterId], onDelete: Cascade)
  
  @@index([fromUserId, createdAt])
  @@index([toCharacterId, createdAt])
  @@index([createdAt]) // 시간대별 통계용
}
```

### 3.5 `Payment` 모델 확장
기존 `Payment` 모델의 `type` 필드에 `ITEM_PURCHASE` 추가:

```prisma
// Payment.type에 추가할 값:
// "SUBSCRIPTION", "TOPUP", "SUBSCRIPTION_RENEWAL", "ITEM_PURCHASE"

// 아이템 구매 시 Payment 레코드 예시:
{
  type: "ITEM_PURCHASE",
  provider: "PAYPAL" | "TOSS" | "CREDITS",
  description: "하트 패키지 (10개)",
  metadata: JSON.stringify({ itemId: "heart", quantity: 10 })
}
```

### 3.6 `User` 모델 관계 추가
기존 `User` 모델에 다음 관계 추가:

```prisma
model User {
  // ... 기존 필드들
  UserInventory UserInventory[]
  GiftLog       GiftLog[]
}
```

---

## 4. 주요 기능 및 API 구현 계획

### Phase 1: 시스템 기초 및 구매 (Store)

#### 1.1 아이템 상수 파일 생성
- `app/lib/items.ts`: 아이템 정의 및 패키지 상수 파일 생성
- 하트 패키지 정의 (예: 10개, 50개, 100개 패키지)

#### 1.2 아이템 상점 UI 구현
- `app/components/payment/ItemStoreModal.tsx` 생성
- 하트(Heart) 패키지 목록 노출
- 구매 방식 선택:
  - **크레딧 구매**: 보유 크레딧으로 교환 (예: 100 크레딧 = 1 하트)
  - **직접 결제**: PayPal/Toss Payments를 통한 현금 구매
- 기존 `TokenTopUpModal.tsx`와 유사한 구조 (탭 시스템: 크레딧/Toss/PayPal)

#### 1.3 구매 API 구현 (React Router v7 파일 기반 라우팅)
- `app/routes/api.items.purchase.ts`: 
  - `POST /api/items/purchase`
  - 요청 스키마 (Zod):
    ```typescript
    {
      itemId: string,
      quantity: number,
      paymentMethod: "CREDITS" | "PAYPAL" | "TOSS",
      packageId?: string // 패키지 ID (직접 결제 시)
    }
    ```
  - 처리 로직:
    - 크레딧 구매: `User.credits` 차감 → `UserInventory` 업데이트 → `Payment` 레코드 생성 (type: "ITEM_PURCHASE", provider: "CREDITS")
    - 직접 결제: PayPal/Toss 결제 플로우와 유사하게 처리 (기존 `api.payment.*` 참고)

#### 1.4 결제 성공 후 처리
- `app/routes/payment.toss.success.tsx` 확장: `type=ITEM_PURCHASE` 케이스 추가
- PayPal `onApprove` 핸들러에서 아이템 구매 케이스 처리

### Phase 2: 선물하기 (Gifting)

#### 2.1 채팅방 선물 UI
- 채팅 입력창 옆에 `+` 또는 `하트` 버튼 추가 (`app/components/chat/MessageInput.tsx` 수정)
- 버튼 클릭 시 보유 아이템 레이어 팝업 (`app/components/chat/GiftSelector.tsx` 생성)
- 보유 아이템 수량 표시 및 선택 UI

#### 2.2 선물 발송 API
- `app/routes/api.items.gift.ts`:
  - `POST /api/items/gift`
  - 요청 스키마:
    ```typescript
    {
      characterId: string,
      itemId: string,
      amount: number,
      message?: string
    }
    ```
  - 처리 로직 (트랜잭션):
    1. `UserInventory`에서 수량 확인 및 차감
    2. `CharacterStat` 업데이트 (totalHearts 증가, totalUniqueGivers 업데이트)
    3. `GiftLog` 레코드 생성
    4. 실패 시 롤백

#### 2.3 AI 연동 (Advanced)
- `app/lib/ai.server.ts` 또는 LangGraph 워크플로우에서 선물 이벤트 감지
- 선물을 받으면 캐릭터가 "와! 하트 고마워요!"와 같은 즉각적인 반응을 보이도록 프롬프트 가중치 부여
- `GiftLog`를 기반으로 최근 선물 이력을 컨텍스트에 포함

### Phase 3: 표시 및 통계 (Display)

#### 3.1 캐릭터 프로필 업데이트
- `app/routes/character/$id.tsx` 수정:
  - `CharacterStat` 조회하여 누적 하트 수 표시
  - `누적 하트 💖 1.2k` 형태의 뱃지 표시
- `app/components/chat/ChatListItem.tsx` 수정:
  - 채팅 리스트에서도 하트 수 표시 (선택사항)

#### 3.2 리더보드 (Fandom 페이지)
- `app/routes/fandom.tsx` 수정:
  - 이번 주/이번 달 가장 많은 하트를 받은 캐릭터 순위 표시
  - `CharacterStat` 테이블에서 `totalHearts` 기준 정렬
  - 시간대별 필터링 (이번 주, 이번 달, 전체)

#### 3.3 사용자 인벤토리 조회 API
- `app/routes/api.items.inventory.ts`:
  - `GET /api/items/inventory`
  - 현재 사용자의 보유 아이템 목록 반환

---

## 5. UI/UX 디자인 가이드

### 5.1 디자인 시스템 통합
- 기존 프로젝트의 디자인 시스템 활용:
  - Tailwind CSS v4, shadcn/ui Nova Preset
  - 기존 `TokenTopUpModal.tsx`, `pricing.tsx`와 일관된 스타일
  - Toast 알림: Sonner (shadcn/ui) 사용

### 5.2 감성적 연출
- 하트를 보낼 때 화면에 작은 하트 입자들이 솟아오르는 이펙트 (Lottie 또는 Canvas 애니메이션)
- 선물 전송 성공 시 Toast 알림: `toast.success("하트를 보냈습니다! 💖")`

### 5.3 프리미엄 느낌
- 하트 개수에 따라 아이콘의 형태가 변하거나(작은 하트 -> 큰 하트 -> 날개 달린 하트) 빛나는 효과 추가
- 캐릭터 프로필의 하트 뱃지에 애니메이션 효과 (선택사항)

### 5.4 접근성
- 채팅 중 끊김 없이 선물을 줄 수 있도록 최소한의 클릭으로 전송 가능케 설계
- 모바일 최적화: 터치 영역 충분히 확보

---

## 6. 향후 확장 아이템 아이디어
- **편지 (Letter)**: 캐릭터에게 긴 메시지를 전달할 때 사용.
- **미스터리 박스 (Mystery Box)**: 랜덤한 크레딧이나 아이템이 들어있는 박스.
- **코스튬/액세서리**: 캐릭터의 프로필 이미지를 일시적으로 꾸밀 수 있는 아이템.

---

## 7. 구현 우선 순위 및 단계

### Phase 1: 데이터베이스 스키마 및 기초 (최우선)
1. Prisma 스키마에 `Item`, `UserInventory`, `CharacterStat`, `GiftLog` 모델 추가
2. 마이그레이션 실행: `npx prisma migrate dev --name add_item_system`
3. `app/lib/items.ts` 파일 생성 (아이템 상수 정의)

### Phase 2: 구매 시스템
1. 아이템 상점 UI (`ItemStoreModal.tsx`)
2. 크레딧 기반 구매 API (`api.items.purchase.ts`)
3. 직접 결제 연동 (PayPal/Toss) - 기존 결제 시스템 재사용

### Phase 3: 선물 시스템
1. 채팅방 선물 UI (`GiftSelector.tsx`, `MessageInput.tsx` 수정)
2. 선물 발송 API (`api.items.gift.ts`)
3. AI 연동 (선물 받은 반응)

### Phase 4: 표시 및 통계
1. 캐릭터 프로필 하트 수 표시
2. 팬덤 페이지 리더보드
3. 사용자 인벤토리 조회

### Phase 5: 고급 기능 (선택사항)
1. 선물 전송 애니메이션
2. 하트 뱃지 애니메이션 효과
3. 시간대별 통계 (이번 주, 이번 달)

---

## 8. 결제 시스템 통합 방안

### 8.1 크레딧 기반 구매
- 사용자가 보유한 크레딧(`User.credits`)으로 아이템 구매
- `Payment` 레코드 생성: `type: "ITEM_PURCHASE"`, `provider: "CREDITS"`
- 크레딧 부족 시 Toast 알림 및 크레딧 충전 모달 표시

### 8.2 직접 결제 (PayPal/Toss)
- 기존 `TokenTopUpModal.tsx`와 유사한 구조
- PayPal: `PayPalButtons` 컴포넌트 재사용
- Toss Payments: `@tosspayments/payment-sdk` 재사용
- 결제 성공 후 `Payment` 레코드 생성 및 `UserInventory` 업데이트

### 8.3 가격 정책 예시
- 하트 패키지:
  - 소형: 10개 = 1,000 크레딧 또는 $1.00 (KRW 1,400원)
  - 중형: 50개 = 4,500 크레딧 또는 $4.50 (KRW 6,300원) - 10% 할인
  - 대형: 100개 = 8,000 크레딧 또는 $8.00 (KRW 11,200원) - 20% 할인

---

## 9. 보안 고려사항

1. **서버 사이드 검증**: 모든 구매 및 선물 발송은 서버에서 검증
2. **트랜잭션 관리**: Prisma 트랜잭션으로 데이터 정합성 보장
3. **중복 방지**: `Payment.transactionId` 또는 `GiftLog`의 고유성 보장
4. **크레딧 부족 방지**: 구매 전 크레딧 잔액 확인

---

## 10. 테스트 전략

1. **단위 테스트**: 아이템 구매 로직, 선물 발송 로직
2. **통합 테스트**: 전체 플로우 (구매 → 인벤토리 업데이트 → 선물 발송 → 통계 업데이트)
3. **결제 테스트**: PayPal Sandbox, Toss Payments 테스트 모드

---

본 계획을 바탕으로 첫 번째 단계인 **'하트 시스템 DB 스키마 수정 및 구매 UI'**부터 착수할 준비가 되었습니다. 진행하시겠습니까?
