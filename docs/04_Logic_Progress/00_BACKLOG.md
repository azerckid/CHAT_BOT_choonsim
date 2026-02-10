# 프로젝트 백로그 (Project Backlog)
> Created: 2026-02-08 17:59
> Last Updated: 2026-02-08 17:59

본 문서는 프로젝트의 현재 진행 상황과 향후 계획을 칸반 형태로 관리하는 실행 로직 문서입니다.

---

## 🏃 In Progress (진행 중)

---

## 📅 Upcoming (예정)

### 1. AI 응답 속도 최적화 (Vercel AI SDK 적용)
- **목표**: 스트리밍 응답 가독성 및 서버 부하 개선.
- **관련 문서**: `../01_Concept_Design/15_VERCEL_AI_SDK_ADOPTION.md`

### 2. 캐릭터 멀티 페르소나 강화
- **목표**: 상황별 톤앤매너 전환 로직 정교화.

---

## ✅ Completed (완료됨)

### 3. NEAR 지갑 비동기 생성 구현 (2026-02-08)
- **목표**: 회원가입 시 지갑 생성을 백그라운드 작업으로 전환하여 대기 시간 제거.
- **관련 문서**: `../01_Concept_Design/14_NEAR_WALLET_ASYNC_CREATION_PLAN.md`
- **검증 항목**:
    - [x] Phase 1: DB 스키마 변경 (`walletStatus`, `retryCount` 등 추가)
    - [x] Phase 2: 백엔드 리팩토링 (`ensureNearWalletAsync`, `ensureNearWalletOnChain` 분리)
    - [x] Phase 3: 백그라운드 큐 구현 (`wallet-queue.server.ts` 및 Cron 연동)
    - [x] Phase 4: API 추가 (`/api/wallet/status`)
    - [x] Phase 5: UI 연동 (즉시 리다이렉션 및 대기 제거)

### 1. 문서 체계 5계층 표준화 도입 (2026-02-08)
- [x] 디렉토리 구조 재편 (Foundation, Prototype, Specs, Logic, Test)
- [x] 레거시 폴더 정리 및 `08_DOCUMENT_MANAGEMENT_PLAN.md` 업데이트.

### 2. 사용자 컨텍스트 레이어 시스템 구축
- [x] Phase 1~10 시스템 아키텍처 및 API 구현 완료.

---

## Related Documents
- **Foundation**: [Roadmap](../01_Foundation/05_ROADMAP.md) - 중장기 프로젝트 목표
- **Foundation**: [Document Management Plan](../01_Foundation/08_DOCUMENT_MANAGEMENT_PLAN.md) - 문서 관리 표준
- **Test**: [Verification Reports](../05_Test/08_PHASE_1_TO_5_COMPLETE_VERIFICATION.md) - 이전 단계 완료 검증서
