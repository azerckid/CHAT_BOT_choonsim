# Mock 유저 50명 구현 계획

> Created: 2026-03-05
> Last Updated: 2026-02-11

**목적**: 50명 Mock 유저 생성, 매일 초코 지급, 차등 소비 시뮬레이션을 통해 30일간 BondBase 수익 현황 검증.

**관련 문서**:
- [21_MOCK_USER_SIMULATION_PLAN.md](../01_Concept_Design/21_MOCK_USER_SIMULATION_PLAN.md) — 기획
- [24_mock-user-simulation-spec.md](../03_Technical_Specs/24_mock-user-simulation-spec.md) — 기술 명세

---

## 사전 조건

기획문서 [0. 점검 사항 및 선행조치](../01_Concept_Design/21_MOCK_USER_SIMULATION_PLAN.md#0-점검-사항-및-선행조치) 완료 후 진행.

---

## 구현 단계

### Phase 1. Mock 유저 생성 스크립트

| 항목 | 내용 |
| :--- | :--- |
| **파일** | `apps/web/scripts/seed-mock-users.ts` |
| **기능** | User, account, session 50명 삽입 |
| **식별** | `provider: "local"`, `email: "mock-{uuid}@test.local"` |
| **초기 지급** | chocoBalance = 5000~10000 CHOCO (조정 가능) |

### Phase 2. 초코 일일 지급 스크립트

| 항목 | 내용 |
| :--- | :--- |
| **파일** | `apps/web/scripts/grant-mock-users-choco.ts` |
| **기능** | Mock 유저 50명 chocoBalance 업데이트 |
| **실행** | 30일 테스트 기간 동안 매일 cron 또는 수동 실행 |

### Phase 3. 소비 시뮬레이션 스크립트

| 항목 | 내용 |
| :--- | :--- |
| **파일** | `apps/web/scripts/run-mock-activity.ts` |
| **기능** | 채팅(deductChocoForTokens), 선물(gift 로직) 차등 소비 |
| **차등** | 유저별 소비량 랜덤/가중치 적용 — 춘심·리나 귀속 |
| **실행** | 30일간 주기 실행 |

### Phase 4. 실행 자동화

| 항목 | 내용 |
| :--- | :--- |
| **방식** | GitHub Actions |
| **스케줄** | 초코 지급: 매일 00:00 UTC (`mock-grant.yml`), 소비 시뮬레이션: 매시간 (`mock-activity.yml`) |
| **Cron API** | `api/cron/mock-grant`, `api/cron/mock-activity` (CRON_SECRET 인증) |
| **서버 로직** | `app/lib/mock-users.server.ts` (grantMockUsersChoco, runMockActivity) |

---

## 완료 기준

- [x] seed-mock-users.ts 실행 → 50명 생성 (`npm run mock:seed`)
- [x] grant-mock-users-choco.ts 실행 → 초코 지급 확인 (`npm run mock:grant`)
- [x] run-mock-activity.ts 실행 → ChocoConsumptionLog 적재 (`npm run mock:activity`)
- [ ] bondbase-sync 동작 → BondBase Revenue 전송 확인
- [x] 30일간 주기 실행 설정 (GitHub Actions: mock-grant.yml, mock-activity.yml)

## 실행 예시

```bash
cd apps/web
npm run mock:seed       # 50명 생성
npm run mock:grant      # 일일 초코 지급 (CHOCO_PER_USER=3000 기본)
npm run mock:activity   # 채팅 소비 시뮬레이션 (ROUNDS=5 등)
```
