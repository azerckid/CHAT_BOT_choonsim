# CHATTING_ITEM_PLAN: 가상 아이템 및 선물 시스템 (Hearts & Beyond)
> Created: 2026-02-08
> Last Updated: 2026-02-23

본 문서는 사용자가 캐릭터(아이돌/페르소나)에게 "하트" 등의 아이템을 선물하여 애정을 표현하고, 이를 통해 서비스의 상호작용과 수익 모델을 강화하기 위한 **채팅 아이템 시스템**의 구현 계획을 정의합니다.

**프로젝트 컨텍스트:**
- **Framework**: React Router v7 (Vite)
- **Database**: Turso (libSQL) with Drizzle ORM
- **Authentication**: Better Auth (session-based)
- **AI Integration**: Google Gemini API with LangGraph
- **Current Status**: **Phase 1~5 완료 / Phase 6(멀티 아이템 선물 UI) 미구현**

---

## 1. 개요 (Objective)
- **심리적 보상**: 사용자가 좋아하는 캐릭터에게 구체적인 보상(하트 등)을 제공함으로써 유대감 강화.
- **게임화 요소 (Gamification)**: 캐릭터별 '받은 하트 수' 랭킹 등을 통해 커뮤니티 활성화 유도.
- **수익 모델 확장**: '하트' 등 가치가 고정된 **패키지형 아이템** 판매를 통한 매출 증대.

---

## 2. 구현 로드맵 (Implementation Roadmap)

### **Phase 1: 데이터베이스 스키마 및 기초 (Foundation)**
- [x] Drizzle 모델 설계 (`Item`, `UserInventory`, `CharacterStat`, `GiftLog`)
- [x] DB 마이그레이션 실행 및 스키마 반영
- [x] 아이템 상수 정의 파일 생성 (`app/lib/items.ts`)
- [x] 초기 아이템 데이터 시딩 (Seeding)

### **Phase 2: 아이템 구매 시스템 (Store System)**
- [x] 아이템 상점 UI 구현 (`routes/shop/index.tsx` — 아이템 카드 + 상세 모달)
- [x] CHOCO 기반 구매 API (`routes/api/items/purchase.ts` — DB 아이템 조회, 온체인 차감)
- [x] PayPal/Toss Payments 직접 결제 연동 (`api.payment.item.create-order.ts`, `capture-order.ts`)
- [x] 구매 성공 시 인벤토리 자동 지급 로직

### **Phase 3: 선물하기 및 인터랙션 (Gifting Interaction)**
- [x] 채팅방 선물 발송 UI (`components/chat/GiftSelector.tsx`)
- [x] 선물 발송 API (`routes/api/items/gift.ts` — DB 아이템 조회 기반)
- [x] 차감 및 통계 반영 트랜잭션 처리 (UserInventory → CharacterStat → GiftLog)
- [x] 선물 발송 후 채팅창 시스템 메시지 낙관적 업데이트 적용
- [x] `isActive` 비활성 아이템 선물 차단

### **Phase 4: AI 리액션 및 감정 제어 (AI & Emotions)**
- [x] 선물 금액별 AI 리액션 프롬프트 세분화 구현
- [x] AI 감정 상태 마커 시스템 도입 (`[EMOTION:JOY]` 등)
- [x] 실시간 감정 파싱 및 프론트엔드 시각적 피드백 (네온 오라, 상태 텍스트)
- [x] 감정 상태 데이터베이스 영속화 (`CharacterStat.currentEmotion`)

### **Phase 5: 표시 및 통계 (Display & Stats)**
- [x] 캐릭터 프로필 내 누적 하트(💖) 뱃지 및 게이지 표시
- [x] 팬덤 페이지(Fandom) 실시간 리더보드 연동 (누적 하트 기준)
- [x] 사용자 인벤토리 조회 및 마이 프로필 연동
- [x] 하트 발송 시 파티클/애니메이션 이펙트 — 사용자 피드백으로 제거 확정

### **Phase 6: 멀티 아이템 선물 UI (미구현)**
- [ ] GiftSelector를 Swiper 구조로 고도화 (현재 하트 단일 아이템만 지원)
- [ ] 채팅방 로더에서 UserInventory 전체 + Item 정보 조인 조회
- [ ] 스와이퍼 탭 선택 → 아이템 미리보기 전환 UI
- [ ] 미보유 아이템 자물쇠 표시 + 상점으로 가기 버튼

---

## 3. 데이터베이스 스키마 상세 (Schema Detail)

> 실제 구현: `apps/web/app/db/schema.ts` (Drizzle ORM)

```ts
// Item 테이블
export const item = sqliteTable("Item", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),           // GIFT | TICKET | MEMORY | VOICE | EPISODE | ALBUM | HEART 등
    priceCredits: integer("priceCredits"),  // Deprecated: 호환성 유지용
    priceChoco: integer("priceChoco"),      // 신규: CHOCO 가격
    priceUSD: real("priceUSD"),
    priceKRW: real("priceKRW"),
    iconUrl: text("iconUrl"),
    description: text("description"),
    isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("createdAt", { mode: "timestamp" }),
    updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// UserInventory 테이블
export const userInventory = sqliteTable("UserInventory", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    itemId: text("itemId").notNull(),
    quantity: integer("quantity").notNull().default(0),
    updatedAt: integer("updatedAt", { mode: "timestamp" }),
    // @@unique([userId, itemId])
});

// CharacterStat 테이블
export const characterStat = sqliteTable("CharacterStat", {
    id: text("id").primaryKey(),
    characterId: text("characterId").notNull().unique(),
    totalHearts: integer("totalHearts").notNull().default(0),
    totalUniqueGivers: integer("totalUniqueGivers").notNull().default(0),
    currentEmotion: text("currentEmotion").default("JOY"),   // JOY | EXCITED | LOVING
    emotionExpiresAt: integer("emotionExpiresAt", { mode: "timestamp" }),
    lastGiftAt: integer("lastGiftAt", { mode: "timestamp" }),
    updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// GiftLog 테이블
export const giftLog = sqliteTable("GiftLog", {
    id: text("id").primaryKey(),
    fromUserId: text("fromUserId").notNull(),
    toCharacterId: text("toCharacterId").notNull(),
    itemId: text("itemId").notNull(),
    amount: integer("amount").notNull(),
    message: text("message"),
    createdAt: integer("createdAt", { mode: "timestamp" }),
});
```

---

## 4. UI/UX 디자인 및 감성 가이드

### 4.1 시각적 피드백
- **네온 오라(Neon Aura)**: 캐릭터의 감정에 따라 상단바 네온 색상 변화.
- **축하 이펙트**: 파티클 애니메이션은 사용자 피드백으로 제거 확정.
- **실시간 기분**: 이름 옆에 "행복해하는 중.. 💖"과 같은 상태 메시지 노출.

### 4.2 감정 상태 매핑 (EMOTION_MAP)

| 감정 | 트리거 조건 | 상태 텍스트 | 오라 스타일 |
|---|---|---|---|
| `JOY` | 기본 / 만료 후 리셋 | 행복해하는 중.. 💖 | 기본 ring |
| `EXCITED` | 하트 50개 이상 | 설레는 중.. 💫 | 강한 오라 + 글로우 |
| `LOVING` | 하트 100개 이상 | 사랑받는 중.. 💕 | 강한 오라 + Pulse |

### 4.3 일관성 유지
- 모든 수량 표시 옆에는 충전용 `+` 버튼 배치.
- 클릭 시 다른 페이지 이동 없이 전용 구매 모달(Layer Popup) 호출.

---

## 5. 다이내믹 감정 감쇄 시스템 (Gambia Formula)

선물의 가치에 따라 감정의 여운(시각적 효과)이 유지되는 시간을 차등 적용합니다.

### 감비아(Gambia) 지속 시간 공식

| 선물 규모 | 하트 개수 | 지속 시간 | 시각적 효과 강도 |
|:---|:---|:---|:---|
| **Small** | 1 - 9개 | 1분 | 기본 오라 |
| **Medium** | 10 - 49개 | 5분 | 기본 오라 |
| **Large** | 50 - 99개 | 15분 | 강한 오라 + 글로우 |
| **Mega** | 100개 이상 | 30분 | 강한 오라 + 맥박(Pulse) 효과 |

### 기술적 구현

1. **데이터베이스**: `CharacterStat.emotionExpiresAt` 필드에 만료 시각 저장.
2. **서버**: 선물 발송(`api/items/gift.ts`) 시 Gambia 공식으로 만료 시각 계산 후 저장.
3. **프론트엔드** (`routes/chat/$id.tsx`):
   - 1초 인터벌 `useEffect`로 만료 시 `currentEmotion`을 `JOY`로 리셋.
   - 만료 10초 전부터 `auraOpacity`를 `diff / 10`으로 서서히 감소 (Fade-out).
   - 페이지 진입 시 `characterStat.emotionExpiresAt`과 현재 시각 비교하여 상태 복구.

---

## 6. 보안 및 성능 고려사항

- 모든 아이템 소모 및 지급은 DB 트랜잭션 내에서 처리.
- Gift API에서 `isActive` 검증으로 비활성 아이템 선물 차단.
- AI 리액션 생성 시 최근 선물 이력을 컨텍스트에 포함하여 지능형 대화 유도.
- 랭킹 및 통계 데이터는 필요 시 캐싱(Redis 등) 고려.

---

## 7. 멀티 아이템 선물 UI 설계 (Phase 6 — 미구현)

현재 단일 아이템(하트) 중심의 `GiftSelector`를 다양한 BM 아이템(보이스 티켓 등)을 수용할 수 있는 **가로 스와이퍼(Swiper) 형 인벤토리 뷰**로 고도화합니다.

### 7.1 UI/UX 컨셉
- **진입점**: 채팅창 입력바 좌측의 하트(`♡`) 버튼 클릭.
- **레이아웃**: Bottom Sheet에 유저 보유 아이템 전체가 가로 스크롤 탭으로 배열.
- **인터랙션**:
  1. 아이템 탭 터치 → 메인 화면에 해당 아이템 큰 이미지·이름·보유 수량 전환.
  2. 전송 개수(x1, x10 등) 선택 후 [선물 보내기].
- **Upsell**: 맨 끝에 미보유 아이템(자물쇠 아이콘) 또는 `[상점으로 가기]` 버튼 고정.

### 7.2 데이터 연동 설계
- **보유 아이템 로드**: `$id.tsx` 로더에서 `UserInventory`와 `Item` 정보를 조인하여 배열 전체 조회.
- **상태 관리**: `GiftSelector` 내 `selectedItemId` State로 활성 아이템 관리.
- **Fallback**: 인벤토리가 비어 있어도 기본 하트 탭은 항상 첫 번째에 고정 노출.

---

## Related Documents
- **Specs**: [BM Implementation Plan](../04_Logic_Progress/03_BM_IMPLEMENTATION_PLAN.md) - BM 전체 구현 계획
- **Specs**: [Document Management Plan](../01_Concept_Design/09_DOCUMENT_MANAGEMENT_PLAN.md) - 문서 관리 규칙 및 구조
