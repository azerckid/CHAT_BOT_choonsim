# 프로젝트 백로그 (Project Backlog)
> Created: 2026-02-08 17:59
> Last Updated: 2026-02-11 01:50

본 문서는 프로젝트의 현재 진행 상황과 향후 계획을 칸반 형태로 관리하는 실행 로직 문서입니다.

---

## 🏃 In Progress (진행 중)

_(현재 진행 중인 작업 없음)_

---

## 📅 Upcoming (예정)

### 1. AI 응답 속도 최적화 (Vercel AI SDK 적용)
- **목표**: 스트리밍 응답 가독성 및 서버 부하 개선.
- **관련 문서**: `../01_Concept_Design/15_VERCEL_AI_SDK_ADOPTION.md`

---

## ✅ Completed (완료됨)

### 0. 안티그래비티 글로벌 표준 적용 및 문서 미세 조정 (2026-02-11)
- **목표**: AGENTS.md 및 최신 스킬 주입, 문서 5-Layer 표준화 정밀 교정.
- **작업 내용**:
    - [x] AGENTS.md 및 .agent/skills 글로벌 표준 업데이트
    - [x] docs/archive 보관함 단일화 (04_Logic_Progress/00_ARCHIVE/)
    - [x] 주요 문서 내 레이어 명칭 및 경로 최신화
    - [x] 전체 문서 상호 참조 가치 검증

### 1. 문서 체계 5계층 표준화 도입 (2026-02-08)
- [x] 디렉토리 구조 재편 (Concept_Design, UI_Screens, Technical_Specs, Logic_Progress, QA_Validation)
- [x] 레거시 폴더 정리 및 `08_DOCUMENT_MANAGEMENT_PLAN.md` 업데이트.

### 2. NEAR 지갑 비동기 생성 구현 (2026-02-08)
- **목표**: 회원가입 시 지갑 생성을 백그라운드 작업으로 전환하여 대기 시간 제거.
- **관련 문서**: `../01_Concept_Design/14_NEAR_WALLET_ASYNC_CREATION_PLAN.md`

### 3. 사용자 컨텍스트 레이어 시스템 구축
- [x] Phase 1~10 시스템 아키텍처 및 API 구현 완료.

---

## Related Documents
- **Concept_Design**: [Roadmap](../01_Concept_Design/05_ROADMAP.md) - 중장기 프로젝트 목표
- **Concept_Design**: [Document Management Plan](../01_Concept_Design/08_DOCUMENT_MANAGEMENT_PLAN.md) - 문서 관리 표준
- **QA_Validation**: [Verification Reports](../05_QA_Validation/08_PHASE_1_TO_5_COMPLETE_VERIFICATION.md) - 이전 단계 완료 검증서
- **QA_Validation**: [Cross-Reference Verification](../05_QA_Validation/24_CROSS_REFERENCE_VERIFICATION.md) - 문서 상호 참조 검증 보고서
