# NEAR Deposit Engine 후속 작업

NEAR 입금·스윕 모니터링 및 deposit-engine 관련 로그에서 확인된 후속 작업 목록.  
터미널 로그 기준 (deprecation 경고, sweep 실패, 모니터링 오류).

---

## 1. NEAR JS SDK Deprecation 대응

| 현재 API (deprecated) | 대체 API | 비고 |
|----------------------|----------|------|
| `Account.sendMoney()` | `Account.transfer()` | 다음 메이저 버전에서 제거 예정 |
| `Account.signAndSendTransactionLegacy()` | `Account.signAndSendTransaction()` | 동일 |
| `Account.signTransaction()` | `Account.createSignedTransaction()` | `@near-js/providers` 내부 사용 |

**대상 파일**: `app/lib/near/deposit-engine.server.ts` (라인 225 근처)

**작업 내용**  
- 위 deprecated 메서드를 대체 API로 교체.
- 교체 후 로컬/테스트넷에서 스윕·입금 모니터링 동작 검증.

---

## 2. Sweep 실패(transient error) 조사

**현상**  
- 동일 스윕(예: 0.07818 NEAR → treasury `rogulus.testnet`)이 반복 실패.
- 로그: `Sweep failed for user <userId> due to transient error`
- `Found 26 failed or pending sweeps. Retrying...` 로 재시도 루프 동작.

**조사 항목**  
- Transient error의 구체 원인 (RPC 지연, 가스 부족, 네트워크/테스트넷 상태 등).
- 재시도 정책(횟수, 간격, 백오프)이 적절한지 검토.
- 26건 failed/pending이 계속 쌓이는지, 일부는 성공으로 정리되는지 확인.

**산출**  
- 원인 정리 및 필요 시 재시도/로깅/알림 개선.

---

## 3. 특정 유저 NEAR 입금 모니터링 오류 조사

**현상**  
- 로그: `Error monitoring user VVJ9cxAELl5zO0yhUTDiMvIuJxEXvCuZ for NEAR deposits`
- 해당 유저에 대해 입금 모니터링 단계에서 오류 발생.

**조사 항목**  
- 오류 메시지/스택 전체 확인 (모니터링 로직 내 catch·로그 위치).
- RPC 조회 실패, 계정/키 권한, 계정 상태(삭제/병합 등) 여부.
- 동일 오류가 다른 유저에게도 발생하는지 패턴 확인.

**산출**  
- 원인 문서화 및 필요 시 예외 처리·재시도 또는 스킵 정책 정리.

---

## 참조

- NEAR deposit/sweep 관련 코드: `app/lib/near/deposit-engine.server.ts` 등
- 터미널 로그에서 deprecation 경고·sweep 실패·모니터링 오류 메시지로 검색 가능

---

**작성일**: 2026-02-05
