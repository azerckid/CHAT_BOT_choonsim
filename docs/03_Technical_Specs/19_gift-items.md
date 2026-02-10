# CHATTING_ITEM_PLAN: 가상 아이템 및 선물 시스템 (Hearts & Beyond)
> Created: 2026-02-08
> Last Updated: 2026-02-08

본 문서는 사용자가 캐릭터(아이돌/페르소나)에게 "하트" 등의 아이템을 선물하여 애정을 표현하고, 이를 통해 서비스의 상호작용과 수익 모델을 강화하기 위한 **채팅 아이템 시스템**의 구현 계획을 정의합니다.

**프로젝트 컨텍스트:**
- **Framework**: React Router v7 (Vite)
- **Database**: Turso (libSQL) with Prisma ORM
- **Authentication**: Better Auth (session-based)
- **AI Integration**: Google Gemini API with LangGraph
- **Current Status**: **Phase 1-3 부분 완료 및 Phase 4 진행 중**

---

## 1. 개요 (Objective)
- **심리적 보상**: 사용자가 좋아하는 캐릭터에게 구체적인 보상(하트 등)을 제공함으로써 유대감 강화.
- **게임화 요소 (Gamification)**: 캐릭터별 '받은 하트 수' 랭킹 등을 통해 커뮤니티 활성화 유도.
- **수익 모델 확장**: '하트' 등 가치가 고정된 **패키지형 아이템** 판매를 통한 매출 증대.

---

## 2. 구현 로드맵 (Implementation Roadmap)

### **Phase 1: 데이터베이스 스키마 및 기초 (Foundation)**
- [x] Prisma 모델 설계 (`Item`, `UserInventory`, `CharacterStat`, `GiftLog`)
- [x] DB 마이그레이션 실행 및 스키마 반영
- [x] 아이템 상수 정의 파일 생성 (`app/lib/items.ts`)
- [x] 초기 아이템 데이터 시딩 (Seeding)

### **Phase 2: 아이템 구매 시스템 (Store System)**
- [x] 아이템 상점 UI 구현 (`ItemStoreModal.tsx`)
- [x] 아이템 구매 API 구현 (`api.payment.item.create-order.ts`, `api.payment.item.capture-order.ts`)
- [x] PayPal/Toss Payments 아이템 구매 결제 연동 (Capture & Verify)
- [x] 구매 성공 시 인벤토리 자동 지급 로직

### **Phase 3: 선물하기 및 인터랙션 (Gifting Interaction)**
- [x] 채팅방 선물 발송 UI (`GiftSelector`, `MessageInput` 수정)
- [x] 선물 발송 API 구현 (`api.items.gift.ts`)
- [x] 차감 및 통계 반영 트랜잭션 처리 (UserInventory -> CharacterStat -> GiftLog)
- [x] 선물 발송 후 채팅창 시스템 메시지 낙관적 업데이트 적용

### **Phase 4: AI 리액션 및 감정 제어 (AI & Emotions)**
- [x] 선물 금액별 AI 리액션 프롬프트 세분화 구현
- [x] AI 감정 상태 마커 시스템 도입 (`[EMOTION:JOY]` 등)
- [x] 실시간 감정 파싱 및 프론트엔드 시각적 피드백 (네온 오라, 상태 텍스트)
- [x] 감정 상태 데이터베이스 영속화 (`CharacterStat.currentEmotion`)

### **Phase 5: 표시 및 통계 (Display & Stats)**
- [x] 캐릭터 프로필 내 누적 하트(💖) 뱃지 및 게이지 표시
- [x] 팬덤 페이지(Fandom) 실시간 리더보드 연동 (누적 하트 기준)
- [x] 사용자 인벤토리 조회 및 마이 프로필 연동
- [ ] 하트 발송 시 파티클/애니메이션 이펙트 적용 (사용자 피드백으로 제거)

---

## 3. 데이터베이스 스키마 상세 (Schema Detail)

```prisma
model Item {
  id          String   @id @default(uuid())
  name        String   // "하트" 등
  type        String   // "GIFT"
  priceCredits Int?
  priceUSD    Float?
  priceKRW    Float?
  iconUrl     String?
  isActive    Boolean  @default(true)
  UserInventory UserInventory[]
  GiftLog       GiftLog[]
}

model UserInventory {
  id        String   @id @default(uuid())
  userId    String
  itemId    String
  quantity  Int      @default(0)
  User User @relation(fields: [userId], references: [id], onDelete: Cascade)
  Item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@unique([userId, itemId])
}

model CharacterStat {
  id                String   @id @default(uuid())
  characterId       String   @unique
  totalHearts       Int      @default(0)
  totalUniqueGivers Int      @default(0)
  lastGiftAt        DateTime?
}

model GiftLog {
  id            String   @id @default(uuid())
  fromUserId    String
  toCharacterId String
  itemId        String
  amount        Int
  message       String?
  createdAt     DateTime @default(now())
  User User @relation(fields: [fromUserId], references: [id], onDelete: Cascade)
  Item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
}
```

---

## 4. UI/UX 디자인 및 감성 가이드

### 4.1 시각적 피드백
- **네온 오라(Neon Aura)**: 캐릭터의 감정에 따라 상단바 네온 색상 변화.
- **축하 이펙트**: 하트 선물 성공 시 화면에 흩날리는 하트 파티클.
- **실시간 기분**: 이름 옆에 "행복해하는 중.. 💖"과 같은 상태 메시지 노출.

### 4.2 일관성 유지
- 모든 수량 표시 옆에는 충전용 `+` 버튼 배치.
- 클릭 시 다른 페이지 이동 없이 전용 구매 모달(Layer Popup) 호출.

---

---

## **12. 다이내믹 감정 감쇄 시스템 (Gambia Formula)**
선물의 가치에 따라 감정의 여운(시각적 효과)이 유지되는 시간을 차등 적용합니다.

### **감비아(Gambia) 지속 시간 공식**
| 선물 규모 | 하트 개수 | 지속 시간 (Duration) | 시각적 효과 강도 |
| :--- | :--- | :--- | :--- |
| **Small** | 1 - 9개 | 1분 | 기본 오라 |
| **Medium** | 10 - 49개 | 5분 | 기본 오라 |
| **Large** | 50 - 99개 | 15분 | 강한 오라 + 글로우 |
| **Mega** | 100개 이상 | 30분 | 강한 오라 + 맥박(Pulse) 효과 |

### **기술적 구현**
1.  **데이터베이스**: `CharacterStat.emotionExpiresAt` 필드에 만료 시각 저장.
2.  **서버**: 선물 발송(`api/items/gift`) 및 AI 응답 시 만료 시각 계산 및 업데이트.
3.  **프론트엔드**: 
    - `useEffect` 타이머를 통해 만료 시 `currentEmotion`을 `JOY`(기본값)로 리셋.
    - 만료 10초 전부터 오라의 투명도를 서서히 낮추는 Fade-out 효과 적용.
    - 페이지 진입 시 현재 시각과 `emotionExpiresAt`을 비교하여 상태 복구.

---

## 5. 보안 및 성능 고려사항
- 모든 아이템 소모 및 지급은 DB 트랜잭션 내에서 처리.
- AI 리액션 생성 시 최근 선물 이력을 컨텍스트에 포함하여 지능형 대화 유도.
- 랭킹 및 통계 데이터는 필요 시 캐싱(Redis 등) 고려.



Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate

## Related Documents
- **Specs**: [Document Management Plan](../01_Concept_Design/08_DOCUMENT_MANAGEMENT_PLAN.md) - 문서 관리 규칙 및 구조
