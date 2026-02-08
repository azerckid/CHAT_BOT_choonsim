# Documentation Management

5-Layer Documentation Standard에 따라 프로젝트 문서를 생성하고 관리합니다.
상세 스킬 명세는 `.agent/skills/manage-docs/SKILL.md`를 참조하세요.

## 문서 구조

| Layer | Directory | Purpose |
| :--- | :--- | :--- |
| **Foundation** | `docs/01_Foundation/` | 비전, 전략, UI 디자인 |
| **Prototype** | `docs/02_Prototype/` | UI 프로토타입 리뷰 |
| **Specs** | `docs/03_Specs/` | 기술 명세, API, DB 스키마 |
| **Logic** | `docs/04_Logic/` | 비즈니스 로직, 상태 관리 |
| **Test** | `docs/05_Test/` | 테스트 시나리오, QA |

## 작업 절차

1. **계층 식별**: 문서가 어느 계층에 속하는지 판단
2. **기존 문서 확인**: 대상 디렉토리에 관련 파일이 있는지 확인하고, 있으면 먼저 읽기
3. **대화형 확인**: 가정으로 문서를 생성하지 말고, 핵심 질문을 먼저 할 것
   - Foundation: Why/Who/What/How/Distribution/Layout/Success 질문
   - Specs: Tech Stack/Data Models/API Strategy/Edge Cases 질문
   - Logic: Project Init/UI Theme/Folder Structure 질문
4. **파일 생성/수정**:
   - 파일명: `01_` 형식의 2자리 숫자 접두사 필수
   - 메타데이터 헤더 필수:
     ```
     # [Document Title]
     > Created: [YYYY-MM-DD HH:mm]
     > Last Updated: [YYYY-MM-DD HH:mm]
     ```
   - **Related Documents 섹션 필수**: 계층 간 문맥 연속성 유지

## Context Flow

```
Foundation → Prototype → Specs → Logic → Test
    ↓            ↓          ↓        ↓       ↑
    └────────────┴──────────┴────────┴───────┘
```

- Foundation: 디자인 가이드라인 → Prototype, 기능 명세 → Specs
- Prototype: UI 요구사항 → Specs
- Specs: 데이터 모델/API → Logic
- Logic: 테스트 시나리오 기반 → Test
- Test: 모든 상위 레이어 참조

## Related Documents 링크 규칙

- 상대 경로 사용: `./`, `../01_Foundation/`
- 관계 설명 포함: `- **Layer**: [Title](path) - 설명`
- 섹션 참조 포함 (해당 시): `(Section 3.A.1)`

## Best Practices

- 간결하게, 불필요한 내용 없이
- 문서 수정 시 `Last Updated` 갱신
- 기존 파일은 덮어쓰지 말고 업데이트
- 주요 문서 추가 시 Roadmap이나 중앙 인덱스도 갱신 고려

사용자의 요청에 따라 위 규칙을 적용하여 문서를 생성하거나 관리하세요. $ARGUMENTS
