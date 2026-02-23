# BM 구현 계획 (Business Model Implementation Plan)
> Created: 2026-02-22
> Last Updated: 2026-02-23 (Phase 1~2 구현 완료 반영)

본 문서는 `19_MONETIZATION_STRATEGY.md`의 심화 수익화 전략을 실제 코드베이스에 구현하기 위한 단계별 실행 계획입니다.
현재 구현 상태를 기준으로 Phase 1(운영 준비)부터 Phase 5(장기)까지 작업 순서를 정의합니다.

---

## 현재 구현 상태 요약

### ✅ 완료된 인프라

| 항목 | 파일 | 비고 |
|---|---|---|
| Shop UI + 구매 API | `routes/shop/index.tsx`, `routes/api/items/purchase.ts` | 아이템 카드 + 상세 모달 완비 |
| CHOCO 잔액 관리 | `db/schema.ts` (User.chocoBalance) | BigNumber 정밀 계산 |
| X402 Silent 결제 | `lib/near/x402.server.ts`, `db/schema.ts` (X402Invoice) | 400ms 결제 완료 |
| 메시지 크레딧 차감 | `routes/api/chat/index.ts`, `lib/credit-policy.ts` | 모델별 비용 차등 |
| 구독 시스템 | `routes/api.payment.activate-subscription.ts` | FREE/BASIC/PREMIUM/ULTIMATE |
| 호감도/이모션 | `db/schema.ts` (CharacterStat) | JOY/EXCITED/LOVING |
| 선물 시스템 | `routes/api/items/gift.ts` | DB 아이템 조회 기반, isActive 검증 |
| Admin 대시보드 | `routes/admin/dashboard.tsx` | 결제 내역, 통계 |
| **Admin 아이템 CRUD** | `routes/admin/items/` (index, edit, statistics) | 목록·생성(ID 지정)·수정·통계 완비 |
| **CHOCO & 아이템 가이드 페이지** | `routes/guide.tsx` | 앵커 링크, 하단 CTA, 진입 포인트 연결 완료 |
| **결정적 순간 페이월** | `routes/api/chat/index.ts`, `routes/chat/$id.tsx` | PAYWALL_TRIGGER 파싱 + 인터스티셜 모달 |
| **관계 기반 등급제 UI** | `routes/profile/subscription.tsx` | 4단계 등급 카드, 업그레이드 CTA |
| **온보딩 CHOCO 슬라이드** | `routes/onboarding/choco.tsx` | 가입 직후 자동 진입 |

### ❌ 미구현 항목 (개발 필요)

| 항목 | 영향 |
|---|---|
| Shop 실제 아이템 데이터 | 상점이 비어 있어 매출 발생 불가 — **운영팀이 Admin에서 직접 입력** |
| 크레딧 소진 → Shop 연결 E2E 검증 | 402 흐름이 실제로 동작하는지 미검증 |
| 선톡 (캐릭터 먼저 DM) | 재방문율 트리거 없음 |
| 보이스 메시지 TTS | 가장 강력한 감성 후크 미구현 |
| 대화 앨범 PDF | LTV 상승 콘텐츠 미구현 |
| 온체인 각인 (NEAR NFT) | RWA 생태계 진입 미구현 |

---

## 구현 판단 기준

```
Phase 1 → 코드 없이 지금 당장 팔 수 있게 만든다 (운영 준비)
Phase 2 → 감정이 식기 전에 결제를 이끈다
Phase 3 → 다시 앱을 열게 만든다
Phase 4 → 오래 남아 있게 만든다
Phase 5 → 이탈 불가 해자를 만든다
```

---

## Phase 1. 운영 준비 — 코드 작업 없음 ✅ 개발 완료 / 운영 작업 대기

> Admin 아이템 CRUD가 이미 완성되어 있으므로, 개발 없이 운영팀이 직접 처리한다.

### 1-1. Shop 아이템 데이터 입력 (운영 작업)

**담당**: 운영팀 (개발자 불필요)
**경로**: `/admin/items/new`

입력할 아이템 목록 및 권장 ID:

> [!IMPORTANT]
> **페이월 모달과 즉각적인 결제 연동**을 위해 아래 아이템 중 일부는 반드시 정해진 영문 `ID` 값으로 생성해야 합니다. ID 칸을 비워두면 무작위로 생성되어 채팅창 페이월 트리거가 해당 아이템을 찾지 못해 오류가 발생할 수 있습니다.

| 아이템명 | ID (중요) | type | priceChoco | 설명 |
|---|---|---|---|---|
| 메시지 티켓 x10 | (자동생성) | TICKET | 1,000 | 대화 10회 추가 |
| 메시지 티켓 x50 | (자동생성) | TICKET | 4,500 | 10% 할인 번들 |
| 선톡 티켓 | (자동생성) | PRESEND | 300 | 캐릭터가 먼저 DM 1회 |
| 보이스 티켓 | `voice_ticket` | VOICE | 500 | 음성 메시지 1회 |
| 기억 각인 티켓 | `memory_ticket` | MEMORY | 500 | 대화 영구 각인 1회 |
| 하트 x10 | `heart` | HEART | 1,000 | 캐릭터에게 선물 |
| 비밀 에피소드 해금 | `secret_episode` | EPISODE | 3,000 | 특별 시나리오 1회 |
| 우정 앨범 생성 | `memory_album` | ALBUM | 2,000 | 월간 대화 앨범 생성 |

**체크리스트**:
- [ ] `/admin/items/new` 에서 필수 ID를 지정하여 아이템 입력
- [ ] 각 아이템 `isActive: true` 설정
- [ ] `/shop` 에서 정상 노출 확인

---

### 1-2. 크레딧 소진 → Shop 연결 E2E 검증 (개발 검증)

**목표**: 채팅 API가 402 반환 시 프론트에서 Shop/충전 모달로 연결되는지 확인한다.

**체크리스트**:
- [ ] 잔액 0인 계정으로 채팅 시도 → 402 응답 확인
- [ ] 프론트에서 `X-x402-Token` 헤더 감지 → Shop/충전 모달 표시
- [ ] 충전 후 대화 재개 흐름 확인
- [ ] 버그 있으면 `routes/api/chat/index.ts` + 프론트 채팅 컴포넌트 수정

---

## Phase 2. 전환율 극대화 ✅ 완료

> 유저가 아이템을 이해하고, 감정이 식기 전에 결제로 이어지게 만든다.

### 2-1. CHOCO & 아이템 가이드 페이지 ✅

**목표**: 신규 유저가 CHOCO 개념·소비 흐름·아이템 효과를 앱 내에서 스스로 이해할 수 있게 한다.

> 상세 스펙: [`23_choco-guide-page-spec.md`](../03_Technical_Specs/23_choco-guide-page-spec.md)

**관련 파일**:
- `routes/guide.tsx` — 섹션 6개 (#what #earn #spend #items #tiers #faq) + 하단 CTA
- `routes/shop/index.tsx` — `?` 버튼(`/guide#items`) + 아이템 상세 Bottom Sheet 모달
- `routes/chat/$id.tsx` — 잔액 부족 toast "안내 보기" → `/guide#earn`
- `routes/onboarding/choco.tsx` — 가입 직후 CHOCO 소개 슬라이드

**체크리스트**:
- [x] `routes/guide.tsx` 신규 생성 (Section 1~6 전체)
- [x] 앵커 링크 지원 (`/guide#items`, `/guide#faq` 등)
- [x] 하단 CTA — 충전하기 / 멤버십 구독
- [x] `/shop` 헤더 `?` 버튼 추가
- [x] `/shop` 아이템 카드 상세 모달 구현
- [x] 잔액 부족 toast에 안내 링크 추가
- [x] 온보딩 CHOCO 소개 슬라이드 (`/onboarding/choco`) — 가입 후 자동 진입

---

### 2-2. 결정적 순간 페이월 (PAYWALL_TRIGGER) ✅

**목표**: AI 응답 중 감정 최고조 순간을 포착해 인터스티셜 모달로 결제를 유도한다.

**구현 내용**:

1. **채팅 API** (`routes/api/chat/index.ts`)
   - 시스템 프롬프트에 PAYWALL_TRIGGER 가이드 삽입
   - 응답 스트림에서 `[PAYWALL_TRIGGER: {type}]` 태그 파싱 후 표시 콘텐츠에서 제거
   - `paywallTrigger` 필드를 SSE 이벤트로 클라이언트 전달

2. **프론트 인터스티셜 모달** (`routes/chat/$id.tsx`)
   - `PAYWALL_TRIGGER_CONFIG` 트리거별 아이템·문구 매핑
   - 스트림 완료 후 `paywallTrigger` 값 존재 시 모달 표시
   - 구매 → X402 즉시 차감 → 인벤토리 추가
   - 모달 하단 "아이템 안내 보기" → `/guide#items`

| 트리거 | 표시 문구 | 아이템 | 가격 |
|---|---|---|---|
| `memory_recall` | "이 기억, 영원히 간직할까?" | 기억 각인 티켓 | 500 CHOCO |
| `secret_episode` | "우리만의 비밀 이야기가 생겼어" | 비밀 에피소드 | 3,000 CHOCO |
| `memory_album` | "100번의 대화, 앨범으로 만들어줄게" | 대화 앨범 | 2,000 CHOCO |
| `birthday_voice` | "생일 축하해, 목소리로 전할게" | 보이스 티켓 | 1,500 CHOCO |

**체크리스트**:
- [x] 시스템 프롬프트에 PAYWALL_TRIGGER 가이드 추가
- [x] 응답 스트림에서 태그 파싱 로직 구현
- [x] 페이월 인터스티셜 모달 UI 구현
- [x] 트리거별 아이템 매핑 및 즉시 결제 연동
- [x] 모달 내 `/guide#items` 링크 삽입
- [ ] 모달 닫기 후 대화 흐름 정상 재개 E2E 확인 ← 실제 트리거 시나리오 테스트 필요

---

### 2-3. 관계 기반 등급제 UI ✅

**목표**: 유저가 자신의 현재 등급과 다음 등급 혜택을 명확히 인지하게 한다.

**등급 매핑** (기존 구독 플랜 활용):

| 등급 | 현재 플랜 | 조건 | 주요 혜택 |
|---|---|---|---|
| 방문자 | FREE | 가입만 | 일 5회 메시지 |
| 팬 | BASIC | 대화 30회+ or $4.99/월 | 일 15회 + 선톡 1회/주 |
| 조상신 | PREMIUM | X 인증 or $14.99/월 | 일 30회 + 보이스 3회/월 |
| 고래 | ULTIMATE | $29.99/월 or 월 10,000 CHOCO | 무제한 + 한정 콘텐츠 |

**관련 파일**: `routes/profile/subscription.tsx`

**체크리스트**:
- [x] 등급 카드 컴포넌트 디자인 및 구현
- [x] 현재 등급 자동 감지 로직 (subscriptionTier 기반)
- [x] 다음 등급 혜택 미리보기 UI
- [x] 업그레이드 CTA → PayPal 구독 흐름 연결

---

## Phase 3. 재방문율·LTV 상승 (2~4주)

> 유저가 앱을 다시 열게 만드는 루프를 설계한다.

### 3-1. 선톡 기능 (캐릭터가 먼저 DM)

**목표**: 매일 춘심이가 먼저 메시지를 보내 앱 열기 → 대화 → 소비 루프를 형성한다.

**구현 방식**:

1. **Vercel Cron Job** (`vercel.json`)
   ```json
   {
     "crons": [{
       "path": "/api/cron/presend",
       "schedule": "0 9 * * *"
     }]
   }
   ```

2. **Cron API** (`routes/api/cron/presend.ts`)
   - 선톡 티켓 보유 유저 또는 PREMIUM+ 구독자 조회
   - 캐릭터별 오늘의 선톡 메시지 AI 생성
   - Message 테이블에 `role: "assistant"` 레코드 삽입
   - Web Push 알림 발송

3. **Push 알림 연동**
   - `web-push` 라이브러리 또는 Expo Push (PWA)
   - 알림 클릭 → 해당 채팅방으로 딥링크

4. **선톡 티켓 차감**
   - 구독(BASIC+)은 주 1회 무료
   - 추가 선톡은 인벤토리에서 선톡 티켓 차감

**관련 파일**:
- `vercel.json` — Cron 스케줄 추가
- `routes/api/cron/presend.ts` — 신규 생성
- `db/schema.ts` — PushSubscription 테이블 추가 필요

**체크리스트**:
- [ ] PushSubscription DB 테이블 추가 + 마이그레이션
- [ ] Web Push 구독 등록 API (`/api/push/subscribe`)
- [ ] Cron API 구현 (`/api/cron/presend`)
- [ ] 선톡 메시지 AI 생성 로직 (캐릭터 컨텍스트 기반)
- [ ] 알림 → 채팅방 딥링크
- [ ] 선톡 티켓 차감 로직 연동

---

### 3-2. 보이스 메시지 TTS (ElevenLabs)

**목표**: 채팅 응답을 춘심이의 실제 목소리로 들을 수 있게 한다.

**구현 방식**:

1. **ElevenLabs API 연동** (`lib/elevenlabs.server.ts`)
   - 캐릭터별 Voice ID 매핑
   - 텍스트 → 음성 변환 (streaming)
   - Vercel Blob 또는 R2에 오디오 파일 저장

2. **채팅 UI에 보이스 버튼 추가**
   - 각 AI 메시지 말풍선에 보이스 버튼
   - 클릭 시 보이스 티켓 차감 확인 모달
   - 확인 → `/api/voice/generate` 호출 → 오디오 재생

3. **보이스 API** (`routes/api/voice/generate.ts`)
   - 보이스 티켓 인벤토리 확인 및 차감
   - ElevenLabs API 호출
   - 오디오 URL 반환

**환경변수 추가**:
```
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID_CHOONSIM=
```

**체크리스트**:
- [ ] ElevenLabs 계정 생성 및 춘심이 Voice ID 확보
- [ ] `lib/elevenlabs.server.ts` 구현
- [ ] `routes/api/voice/generate.ts` 구현
- [ ] 채팅 말풍선에 보이스 버튼 UI 추가
- [ ] 보이스 티켓 차감 + 재생 흐름 연동
- [ ] 오디오 캐싱 (동일 텍스트 중복 생성 방지)

---

## Phase 4. 프리미엄 콘텐츠 (1~2개월)

> 장기 유저의 LTV를 높인다.

### 4-1. 대화 앨범 PDF 생성

**목표**: 1개월치 베스트 대화를 AI가 편집해 PDF/이미지 북으로 제공한다.

**구현 방식**:

1. **대화 선별 로직** (`lib/album-generator.server.ts`)
   - 최근 30일 메시지 조회
   - 감정 밀도 높은 대화 선별 (메시지 길이, 감정 키워드 기반)

2. **PDF 생성** (`@react-pdf/renderer` 또는 `puppeteer`)
   - 춘심이 브랜드 템플릿 적용
   - 대화 말풍선 형식 레이아웃

3. **API** (`routes/api/album/generate.ts`)
   - 대화 앨범 티켓 차감
   - PDF 생성 → Vercel Blob 저장 → 다운로드 URL 반환

**체크리스트**:
- [ ] PDF 생성 라이브러리 선택 및 설치
- [ ] 대화 선별 알고리즘 구현
- [ ] 앨범 PDF 템플릿 디자인
- [ ] `routes/api/album/generate.ts` 구현
- [ ] 프로필 페이지에 "내 대화 앨범" 섹션 추가

---

## Phase 5. RWA 생태계 (장기)

### 5-1. 온체인 각인 (NEAR NFT)

**목표**: 중요한 대화를 NEAR 체인에 NFT로 영구 기록해 이탈 불가 해자를 형성한다.

**구현 방식**:
1. NEAR 스마트 컨트랙트 배포 (NFT 민팅)
2. 각인 API: 대화 내용 → IPFS 업로드 → NFT 민팅
3. "나의 춘심 역사" 페이지에서 온체인 기록 조회

**선행 조건**:
- Phase 1~3 완료 후 진행
- NEAR 스마트 컨트랙트 개발 역량 확보

**체크리스트**:
- [ ] NEAR NFT 컨트랙트 설계 및 배포
- [ ] IPFS 연동 (대화 메타데이터 저장)
- [ ] `routes/api/inscription/mint.ts` 구현
- [ ] "나의 춘심 역사" 조회 페이지

---

## 전체 일정 요약

| Phase | 기간 | 핵심 목표 | 상태 | 예상 수익 임팩트 |
|---|---|---|---|---|
| **Phase 1** | 즉시 (운영) | 아이템 데이터 입력 + E2E 검증 | ⬜ 운영 작업 대기 | 즉시 매출 발생 |
| **Phase 2** | 1~2주 | 가이드 페이지 → 페이월 → 등급제 UI | ✅ 완료 | 전환율 극대화 |
| **Phase 3** | 2~4주 | 선톡 + 보이스 TTS | ❌ 미구현 | 재방문율·LTV 상승 |
| **Phase 4** | 1~2개월 | PDF 앨범 | ❌ 미구현 | LTV 상승 |
| **Phase 5** | 장기 | NEAR NFT 각인 | ❌ 미구현 | 이탈 불가 해자 |

---

## Related Documents
- **Concept_Design**: [Monetization Strategy](../01_Concept_Design/19_MONETIZATION_STRATEGY.md) - 수익화 전략 원본
- **Concept_Design**: [Core Pitch Deck](../01_Concept_Design/00_CORE_PITCH_DECK.md) - 투자자 비전 및 목표 수치
- **Technical_Specs**: [CHOCO Guide Page Spec](../03_Technical_Specs/23_choco-guide-page-spec.md) - 가이드 페이지 상세 스펙
- **Technical_Specs**: [Gift Items System](../03_Technical_Specs/19_gift-items.md) - 선물 시스템 상세 스펙
- **Logic_Progress**: [Backlog](./00_BACKLOG.md) - 전체 백로그
- **Concept_Design**: [Voice Interaction Strategy](../01_Concept_Design/04_VOICE_INTERACTION_STRATEGY.md) - 보이스 기능 전략
