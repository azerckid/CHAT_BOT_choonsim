# 미구현 UI 기능 구현 및 고도화 스펙 (Missing UI Features Spec)

> Created: 2026-02-22
> Updated: 2026-02-22
> Related Backlog: `docs/04_Logic_Progress/00_BACKLOG.md` (UI 정리 및 기능 세분화)

## 1. 개요 (Overview)

현재 어플리케이션(UI) 상에 버튼, 링크, 탭 등의 형태로 노출되어 있으나 실제 페이지 컴포넌트나 백엔드 로직이 연결되지 않은(Dead Link 또는 Placeholder 화면) 6개의 핵심 기능을 식별했습니다. 이 문서는 해당 기능들을 "어떻게 구현(How)"할 것인지에 대한 데이터·API 스키마 및 클라이언트 렌더링 명세서입니다.

해당 기능들은 3가지 Phase로 나누어 점진적으로 도입되어야 합니다.

---

## 2. Phase 1: 프로필 기능 고도화 (Profile Enhancement)

### 2.1 프로필 수정 (`/profile/edit`) ✅ 구현 완료 (2026-02-22)

> **커밋**: `31ec998 feat(profile): 프로필 수정 페이지 구현`

- **UI/UX**:
  - 본인의 아바타 미리보기 및 변경 (이미지 업로더 탑재, FileReader 로컬 preview → Cloudinary 업로드).
  - 닉네임 입력 폼(`user.name`) 및 상태 메시지(`user.bio`) 조작.
  - 저장 버튼: `useNavigation().state` 기반 "저장 중..." 로딩 표시 (Optimistic UI 미적용 → 서버 응답 후 리다이렉트 방식으로 대체).
  - `profile/index.tsx` 아바타 편집 버튼 onClick 연결 (`/profile/edit`).
- **실제 구현 방식** (원안 API Spec과 상이):
  - 별도 `PATCH /api/user/profile` 엔드포인트 대신, **React Router v7 route action** 패턴 사용.
  - Form 제출 → `action()` → Zod 검증 → `db.update(schema.user)` → `redirect("/profile")`.
  - 아바타 이미지는 기존 `/api/upload` 엔드포인트(Cloudinary) 재사용. 기존 이미지 교체 시 `deleteImage()` 호출.
- **Zod 검증 규칙**:
  - `name`: 필수, 1~20자
  - `bio`: 선택, 최대 100자
  - `avatarUrl`: 선택, URL 형식 또는 빈 문자열
- **DB Schema**:
  - `user.bio`, `user.avatarUrl`, `user.name` 모두 기존 스키마에 존재 → 마이그레이션 불필요.

### 2.2 저장된 순간들 (`/profile/saved`)
- **UI/UX**: 
  - 유저의 하트(북마크) 상호작용이 일어난 특정 메시지나 이미지 에셋들을 타임라인 또는 갤러리 뷰로 모아보는 페이지.
  - 무한 스크롤 또는 오프셋 페이지네이션이 필수 (트래픽 경감).
- **API Spec**: 
  - `GET /api/user/saved-moments?limit=20&cursor=xxx`
  - Response: `Array<{ messageOriginalId, content, mediaType, timestamp }>`
- **DB Schema**:
  - 기존 `message` 테이블의 `isLiked` boolean 필드 활용. 최단 쿼리 로직을 위해 `characterId` 조인 활용.

---

## 3. Phase 2: 코어 상점 및 시스템 알림 (Commerce & Notifications)

### 3.1 인앱 상점 (Shop)
- **UI/UX**: 
  - `home.tsx` 내 `Shop` 버튼과 연결될 `route("shop", "routes/shop/index.tsx")`.
  - 결제된 오프체인 재화(CHOCO)를 사용하여 구매할 수 있는 아이템의 리스트 제공.
  - 아이템 썸네일, 설명, 가격(CHOCO), 구매 확정 다이얼로그(Double-check 모달) 지원.
- **API Spec**:
  - 카탈로그 패치: `GET /api/shop/items`
  - 구매 트랜잭션: `POST /api/shop/purchase` -> `token.server.ts`의 `transferChocoToken` 메서드를 통해 토큰 차감 후 `userInventory` 반영.
- **DB Schema**:
  - `item` 테이블 (카탈로그 기본 정보)
  - `userInventory` 테이블 (구매 획득 로그 및 잔여 아이템 처리)

### 3.2 알림함 (Notifications)
- **UI/UX**: 
  - `home.tsx` 톱-오른쪽 `notifications` 버튼과 연결될 `route("notifications", "routes/notifications/index.tsx")` 또는 하프-모달(Drawer).
  - 알림 종류별 고유 색상(System, Character, Payment) 아이콘 표출.
  - "모두 읽음 처리" 일괄 액션 지원.
- **API Spec**:
  - 리스트 로드: `GET /api/notifications`
  - 마크 애즈 리드: `PATCH /api/notifications/read-all`
- **DB Schema**:
  - `notification` 테이블 신설 필요
    - `id` (uuid)
    - `userId` (fk)
    - `type` (enum: SYSTEM, CHAT, PAYMENT, PROMO)
    - `title` (string), `body` (string)
    - `isRead` (boolean, default: false)
    - `createdAt` (timestamp)

---

## 4. Phase 3: 캐릭터 미디어 확장 (Character Ambience)

### 4.1 캐릭터 보이스 탭 (Voice Tab)
- **UI/UX**: 
  - `character/$id.tsx` 내 Placeholder 영역을 실제 탭으로 승격.
  - 리스트 형태의 오디오 플레이어 (HTML5 Custom Audio Control).
  - 현재 재생 중인 클립에 대한 애니메이션 인디케이터.
- **Data Flow**:
  - 서버 측 `loader`에서 `db.query.characterMedia` 중 `type === "VOICE"` 인 레코드셋을 가져와서 Props 주입.

### 4.2 캐릭터 갤러리 탭 (Gallery Tab)
- **UI/UX**: 
  - `character/$id.tsx` 내 주석(`{/* Gallery Placeholders */}`)을 해제하고 그리드 레이아웃(Masonry 권장) 구축.
  - 썸네일 클릭 시 확대(Lightbox) 모달 출력 기능 지원.
- **Data Flow**:
  - 서버 측 `loader`에서 `db.query.characterMedia` 중 `type === "IMAGE"`(커버 외 스팟 이미지) 인셋을 로딩.

---

## 5. 단계별 검증 및 완료 조건 (DoD: Definition of Done)

해당 3단계 작업을 수행할 때 반드시 다음 조건을 모두 불식시켜야 해당 Phase가 완료(Done) 처리됩니다.

1. **라우트 안정성**: `routes.ts`와 연결된 모든 메뉴가 페이지 이탈/404/새로고침 현상이 없어야 합니다.
2. **에러 핸들링**: 백엔드 API 요청 시 Zod 검증을 통과해야 하며 실패 시 UI 하단(Sonner Toast)에 명확한 한글 에러가 표시되어야 합니다.
3. **DB 트랜잭션 보장**: 특히 Phase 2의 상점(Shop) 기능 구현 및 포인트 차감 시에는 원자성(ACID)이 철저하게 보장되어야 합니다.
4. **End-to-End QA**: 로컬 개발이 완료된 이후, 프로덕션 URL과 클라우드 배포 상태에서 전체 프로세싱 시나리오가 끊어짐 없이 진행되어야 합니다.
