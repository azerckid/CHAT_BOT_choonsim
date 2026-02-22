# 프로젝트 백로그 (Project Backlog)
> Created: 2026-02-08 17:59
> Last Updated: 2026-02-11

본 문서는 프로젝트의 현재 진행 상황과 향후 계획을 칸반 형태로 관리하는 실행 로직 문서입니다.

---

## 🏃 In Progress (진행 중)

_(현재 진행 중인 작업 없음)_

---

## 📅 Upcoming (예정)

### 1. 나만의 춘심 (유료 아이템)
- **목표**: 유저가 구매한 아이템을 통해 Identity, Soul, Heartbeat를 직접 설정하고, 캐릭터 이름 변경 가능.
- **예정 내용**:
    - 유료 아이템 "나만의 춘심" 구매 시 Identity/Soul/Heartbeat 편집 기능 해금
    - 캐릭터 이름 변경 기능 포함
    - 작업 시점: 추후 진행

### 2. 목소리로 대화하는 기능
- **목표**: AI 캐릭터와 실시간 음성 대화 가능.
- **관련 문서**: `../01_Concept_Design/04_VOICE_INTERACTION_STRATEGY.md`

### 3. UI 정리 (준비 중/불필요 메뉴 처리)
- **목표**: ComingSoon 화면 및 placeholder 탭 정리, 미등록 라우트/미구현 기능 보완.
- **관련 문서**: [01_UI_CLEANUP_LIST.md](./01_UI_CLEANUP_LIST.md)
- **예정 내용**:
    - 프로필 수정(`/profile/edit`), 저장된 순간들(`/profile/saved`) 구현 또는 일시 제거
    - 캐릭터 상세 Voice/Gallery 탭 placeholder 구현 또는 탭 숨김
    - `/search` 라우트 등록 또는 링크 제거
    - 계정 탈퇴 로직 구현 또는 UI 비활성화

### 4. 유료 아이템 및 경제 시스템 설계
- **목표**: 서비스 지속성을 위한 5대 유료 아이템 카테고리 구체화 및 NEAR 기반 결제 UX 설계.
- **관련 문서**: `../01_Concept_Design/19_MONETIZATION_STRATEGY.md`
- **예정 내용**:
    - [ ] 5대 카테고리(소통, 콘텐츠, 커뮤니티, 관계, 구독)별 데이터 스키마 정의
    - [ ] NEAR Protocol 기반의 마이크로 결제(Action-to-Transaction) 프로토콜 설계
    - [ ] '기억 각인' 및 '나만의 춘심' 에디터 구현 계획 수립

### 5. 데이터베이스 리셋 및 스키마 클린업
- **목표**: 신규 유저 컨텍스트 5계층 아키텍처 및 수익화 모델을 위한 클린 슬레이트 확보.
- **예정 내용**:
    - [ ] 현재 DB 데이터 전체 백업 (Dump) 수행
    - [ ] Local 환경 여부 재학인 및 파괴적 리셋(Reset/Migrate) 실행
    - [ ] 신규 스키마 기준 테스트 유저 데이터 재생성 및 E2E 플로우 검증

---

## ✅ Completed (완료됨)

### 0. AI 응답 속도 최적화 (Vercel AI SDK 적용) (2026-02-11)
- **목표**: 스트리밍 응답 가독성 및 서버 부하 개선.
- **완료 내용**:
    - [x] Phase 1: ai, @ai-sdk/google 설치, ai-v2.server.ts 프로토타입
    - [x] Phase 2: USE_VERCEL_AI_SDK=true 시 streamAIResponseV2 사용, buildStreamSystemInstruction 공유
    - [x] Phase 3: 수동 타이핑 지연 제거 (문자 단위 setTimeout 제거)
- **활성화**: `.env`에 `USE_VERCEL_AI_SDK=true` 설정 시 V2 경로 사용 (이미지 첨부 시에는 기존 LangChain 경로 유지)

### 1. 안티그래비티 글로벌 표준 적용 및 문서 미세 조정 (2026-02-11)
- **목표**: AGENTS.md 및 최신 스킬 주입, 문서 5-Layer 표준화 정밀 교정.
- **작업 내용**:
    - [x] AGENTS.md 및 .agent/skills 글로벌 표준 업데이트
    - [x] docs/archive 보관함 단일화 (04_Logic_Progress/00_ARCHIVE/)
    - [x] 주요 문서 내 레이어 명칭 및 경로 최신화
    - [x] 전체 문서 상호 참조 가치 검증

### 2. 문서 체계 5계층 표준화 도입 (2026-02-08)
- [x] 디렉토리 구조 재편 (Concept_Design, UI_Screens, Technical_Specs, Logic_Progress, QA_Validation)
- [x] 레거시 폴더 정리 및 `09_DOCUMENT_MANAGEMENT_PLAN.md` 업데이트.

### 3. NEAR 지갑 비동기 생성 구현 (2026-02-08)
- **목표**: 회원가입 시 지갑 생성을 백그라운드 작업으로 전환하여 대기 시간 제거.
- **관련 문서**: `../01_Concept_Design/03_NEAR_WALLET_ASYNC_CREATION_PLAN.md`

### 4. 사용자 컨텍스트 레이어 시스템 구축
- [x] Phase 1~10 시스템 아키텍처 및 API 구현 완료.

---

## Related Documents
- **Concept_Design**: [Roadmap](../01_Concept_Design/02_ROADMAP.md) - 중장기 프로젝트 목표
- **Concept_Design**: [Document Management Plan](../01_Concept_Design/09_DOCUMENT_MANAGEMENT_PLAN.md) - 문서 관리 표준
- **QA_Validation**: [Verification Reports](../05_QA_Validation/00_ARCHIVE/08_PHASE_1_TO_5_COMPLETE_VERIFICATION.md) - 이전 단계 완료 검증서
- **QA_Validation**: [Cross-Reference Verification](../05_QA_Validation/00_ARCHIVE/24_CROSS_REFERENCE_VERIFICATION.md) - 문서 상호 참조 검증 보고서
