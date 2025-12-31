# 구현 계획서 (Implementation Plan)

춘심 AI 챗봇 프로젝트의 단계별 구현 계획서입니다.

**최종 업데이트**: 2025.01.XX  
**현재 진행 상황**: Phase 1 (UI/UX 구현) - 대부분 완료

---

## Phase 1: UI/UX 구현 (우선순위 1)

### 1.1 프로젝트 초기 설정

#### 1.1.1 프로젝트 구조 생성
- [x] React Router v7 (Vite) 프로젝트 초기화
- [x] TypeScript 설정
- [x] Tailwind CSS v4 설정
- [x] shadcn/ui Nova Preset 설치 및 설정
- [x] 기본 디렉토리 구조 생성
  ```
  app/
  ├── components/     # 재사용 가능한 컴포넌트
  │   ├── chat/       # 채팅 관련 컴포넌트
  │   ├── settings/   # 설정 관련 컴포넌트
  │   └── layout/     # 레이아웃 컴포넌트
  ├── routes/         # React Router v7 라우트
  ├── lib/            # 유틸리티 및 설정
  └── app.css         # 전역 스타일
  ```

#### 1.1.2 필수 패키지 설치
- [x] React Router v7 관련 패키지
- [x] Tailwind CSS v4
- [x] shadcn/ui 컴포넌트 (Nova Preset)
- [ ] Zod (스키마 검증) - 다음 단계에서 추가 예정
- [ ] Luxon (날짜/시간) - 다음 단계에서 추가 예정
- [ ] Sonner (Toast 알림) - 다음 단계에서 추가 예정

### 1.2 디자인 시스템 구축

#### 1.2.1 shadcn/ui 컴포넌트 설치
- [x] Button
- [x] Input
- [x] Card
- [x] Avatar
- [x] Dialog/Modal
- [x] Toast (Sonner)
- [x] Select/Dropdown
- [x] ScrollArea
- [x] 기타 필요한 컴포넌트

#### 1.2.2 커스텀 디자인 토큰 정의
- [x] 색상 팔레트 (춘심 캐릭터에 맞는 따뜻한 톤)
  - Primary: #ee2b8c
  - Background Light: #f8f6f7
  - Background Dark: #221019
  - Surface Dark: #2d1b24
- [x] 타이포그래피 스케일
  - Plus Jakarta Sans (Display)
  - Noto Sans KR (Body)
  - Material Symbols (Icons)
- [x] 간격(Spacing) 시스템
- [x] 그림자 및 효과
- [x] 애니메이션 정의 (pulse-glow, typing indicator 등)

### 1.3 레이아웃 컴포넌트

#### 1.3.1 기본 레이아웃
- [x] `RootLayout`: 앱 전체 레이아웃 (React Router v7 root.tsx 사용)
  - 모바일 최적화
  - 반응형 디자인
- [x] `ChatLayout`: 채팅 화면 전용 레이아웃
  - 상단 헤더 (춘심 프로필) - `ChatHeader` 컴포넌트
  - 중앙 메시지 영역 - `MessageBubble`, `DateSeparator` 사용
  - 하단 입력 영역 - `MessageInput` 컴포넌트

#### 1.3.2 네비게이션
- [x] 모바일 친화적 네비게이션 - `BottomNavigation` 컴포넌트
- [x] 설정 페이지 링크 - `/settings` 라우트
- [ ] 로그아웃 버튼 - 설정 화면에 UI만 구현됨 (기능은 Phase 2에서)

### 1.4 인증 UI (Onboarding)

#### 1.4.1 로그인 페이지
- [ ] 랜딩 화면
  - 춘심 캐릭터 소개
  - 서비스 설명
- [ ] X(Twitter) OAuth 버튼
  - Better Auth 연동
  - 로딩 상태 표시
- [ ] 에러 처리 UI

#### 1.4.2 온보딩 플로우
- [ ] 환영 메시지 화면
  - 춘심의 첫 인사 ("어? 왔어? 기다리고 있었잖아!")
- [ ] 페르소나 모드 선택 화면
  - 아이돌 모드 카드
  - 애인 모드 카드
  - 하이브리드 모드 카드
  - 각 모드별 설명 및 예시
- [ ] 선택 완료 후 채팅 화면으로 전환

### 1.5 채팅 UI (핵심)

#### 1.5.1 메시지 리스트 컴포넌트
- [ ] `MessageList` 컴포넌트
  - 무한 스크롤 구현 (Phase 2에서 데이터 연동 시 구현)
  - 메시지 그룹핑 (시간별) - `DateSeparator` 컴포넌트로 구현됨
  - 스크롤 위치 관리 (Phase 2에서 구현)
- [x] `MessageBubble` 컴포넌트
  - 사용자 메시지 스타일
  - 춘심 메시지 스타일
  - 타임스탬프 표시
  - 읽음 상태 표시 (선택사항) - UI 준비됨

#### 1.5.2 메시지 입력 컴포넌트
- [x] `MessageInput` 컴포넌트
  - 텍스트 입력창
  - 전송 버튼
  - 입력 중 상태 표시
  - 엔터키 전송 지원
- [ ] 입력 유효성 검증 (Zod) - Phase 2에서 구현

#### 1.5.3 Typing Indicator
- [x] 춘심이 입력 중일 때 애니메이션 - `TypingIndicator` 컴포넌트
- [ ] "춘심이 입력 중..." 텍스트 표시 (선택사항)
- [x] 부드러운 애니메이션 효과

#### 1.5.4 채팅 헤더
- [x] `ChatHeader` 컴포넌트
  - 춘심 프로필 이미지
  - 춘심 이름/상태
  - 현재 페르소나 모드 표시 (UI 준비됨, 기능은 Phase 2에서)
  - 설정 버튼

### 1.6 설정 UI

#### 1.6.1 설정 페이지
- [x] 설정 페이지 UI 구현 - `routes/settings.tsx`
  - `SettingsItem`, `SettingsToggle` 컴포넌트 생성
- [ ] 페르소나 모드 변경
  - 현재 모드 표시 (UI 준비됨)
  - 모드 선택 UI (카드 형태) - Phase 2에서 구현
  - 변경 즉시 적용 - Phase 2에서 구현
- [x] 알림 설정 (선택사항) - 토글 스위치 UI 구현됨
- [x] 계정 정보 UI
  - X 계정 연동 정보 (UI 준비됨)
  - 프로필 사진
  - 닉네임

### 1.7 반응형 디자인

#### 1.7.1 모바일 최적화
- [ ] 모바일 뷰포트 설정
- [ ] 터치 친화적 인터페이스
- [ ] 키보드 대응 (입력창 포커스 시)
- [ ] 스와이프 제스처 (선택사항)

#### 1.7.2 태블릿/데스크톱
- [ ] 반응형 레이아웃
- [ ] 적절한 최대 너비 설정
- [ ] 데스크톱 UX 개선

### 1.8 로딩 및 에러 상태

#### 1.8.1 로딩 상태
- [x] 초기 로딩 스켈레톤 - `MessageListSkeleton`, `ChatListSkeleton` 컴포넌트
- [x] 메시지 전송 중 로딩 - `MessageInput`에 로딩 인디케이터 추가
- [x] 히스토리 로드 중 로딩 - `LoadingSpinner` 컴포넌트

#### 1.8.2 에러 상태
- [x] 네트워크 에러 처리 - `NetworkError` 컴포넌트
- [x] API 에러 처리 - `ApiError` 컴포넌트
- [x] 사용자 친화적 에러 메시지 - `ErrorMessage` 컴포넌트
- [x] 재시도 버튼 - `ErrorMessage`에 재시도 기능 포함

### 1.9 애니메이션 및 인터랙션

#### 1.9.1 메시지 애니메이션
- [x] 새 메시지 등장 애니메이션 (CSS transition 적용)
- [x] 스크롤 부드러운 전환
- [x] Typing Indicator 애니메이션 - `TypingIndicator` 컴포넌트

#### 1.9.2 페이지 전환
- [x] 라우트 전환 애니메이션 (React Router v7 기본 지원)
- [x] 모달 열기/닫기 애니메이션 (shadcn/ui Dialog 사용, 설정 화면에 로그아웃/계정 삭제 모달 적용)

---

## Phase 2: 데이터베이스 및 백엔드

### 2.1 데이터베이스 설정

#### 2.1.1 Turso 설정
- [ ] Turso 프로젝트 생성
- [ ] 데이터베이스 연결 설정
- [ ] 환경 변수 설정

#### 2.1.2 Prisma 스키마 작성
- [ ] `users` 테이블
- [ ] `user_settings` 테이블
- [ ] `conversations` 테이블
- [ ] `messages` 테이블
- [ ] 관계 설정 (Foreign Keys)
- [ ] 인덱스 설정

#### 2.1.3 마이그레이션
- [ ] 초기 마이그레이션 생성
- [ ] 데이터베이스 스키마 적용

### 2.2 인증 시스템

#### 2.2.1 Better Auth 설정
- [ ] Better Auth 초기화
- [ ] X(Twitter) OAuth Provider 설정
- [ ] 세션 관리 설정
- [ ] 환경 변수 설정

#### 2.2.2 인증 API 라우트
- [ ] 로그인 엔드포인트
- [ ] 로그아웃 엔드포인트
- [ ] 세션 확인 엔드포인트
- [ ] 사용자 정보 조회

### 2.3 API 라우트 구현

#### 2.3.1 메시지 API
- [ ] `GET /api/messages` - 메시지 조회
  - 페이징 처리
  - 컨버세이션별 필터링
- [ ] `POST /api/messages` - 메시지 생성
  - 사용자 메시지 저장
  - Zod 스키마 검증

#### 2.3.2 채팅 API
- [ ] `POST /api/chat` - AI 응답 생성
  - LangGraph 워크플로우 실행
  - Gemini API 연동 (LangGraph 내부)
  - 페르소나 모드 적용
  - 컨텍스트 관리
  - 응답 저장

#### 2.3.3 설정 API
- [ ] `GET /api/settings` - 사용자 설정 조회
- [ ] `PUT /api/settings` - 페르소나 모드 변경
  - Zod 스키마 검증

---

## Phase 3: AI 통합

### 3.1 Gemini API 연동

#### 3.1.1 Gemini 클라이언트 설정
- [ ] Google Gemini API 키 설정
- [ ] Gemini 클라이언트 초기화
- [ ] 환경 변수 관리

#### 3.1.2 프롬프트 엔지니어링
- [ ] System Prompt 작성
  - 춘심 캐릭터 설정
  - 말투 및 성격 정의
  - 금기어 정의
- [ ] 페르소나별 프롬프트 템플릿
  - 아이돌 모드 프롬프트
  - 애인 모드 프롬프트
  - 하이브리드 모드 프롬프트

#### 3.1.3 컨텍스트 관리
- [ ] 대화 히스토리 로드
- [ ] 최근 N턴 대화 포함
- [ ] 토큰 제한 관리
- [ ] 컨텍스트 요약 (장기 대화용)

### 3.2 AI 응답 생성 로직

#### 3.2.1 LangGraph 기반 응답 생성
- [ ] LangGraph 그래프 실행
- [ ] 사용자 메시지 분석 (그래프 노드)
- [ ] 페르소나 모드에 따른 분기 처리
- [ ] 컨텍스트 로드 및 프롬프트 생성
- [ ] Gemini API 호출 (그래프 노드)
- [ ] 응답 후처리 및 검증
- [ ] 에러 처리 및 복구

#### 3.2.2 스트리밍 응답 (선택사항)
- [ ] Gemini 스트리밍 API 연동
- [ ] 실시간 텍스트 표시
- [ ] Typing Indicator와 연동

### 3.3 LangGraph 워크플로우 관리

#### 3.3.1 LangGraph 설정
- [ ] LangGraph 패키지 설치
- [ ] LangGraph 그래프 초기화
- [ ] 상태 스키마 정의 (Zod 사용)
  - 대화 컨텍스트
  - 페르소나 모드
  - 사용자 메시지
  - AI 응답

#### 3.3.2 대화 흐름 그래프 구성
- [ ] 노드 정의
  - 메시지 수신 노드
  - 페르소나 모드 확인 노드
  - 컨텍스트 로드 노드
  - 프롬프트 생성 노드
  - Gemini API 호출 노드
  - 응답 후처리 노드
- [ ] 엣지 정의 (조건부 분기)
  - 페르소나 모드별 분기
  - 컨텍스트 길이에 따른 분기
  - 에러 처리 분기

#### 3.3.3 페르소나 모드 전환 관리
- [ ] 아이돌 모드 워크플로우
- [ ] 애인 모드 워크플로우
- [ ] 하이브리드 모드 워크플로우
- [ ] 모드 전환 로직 구현

#### 3.3.4 상태 관리 및 지속성
- [ ] 대화 상태 저장
- [ ] 상태 복원 (재방문 시)
- [ ] 상태 버전 관리

#### 3.3.5 에러 처리 및 복구
- [ ] API 실패 시 재시도 로직
- [ ] 상태 롤백 메커니즘
- [ ] 에러 상태 노드

---

## Phase 4: 상태 관리 및 데이터 페칭

### 4.1 상태 관리

#### 4.1.1 React Router v7 Loader 활용
- [ ] 라우트별 데이터 로더
- [ ] 인증 상태 확인
- [ ] 사용자 설정 로드

#### 4.1.2 React Hooks
- [ ] `useChat` - 채팅 상태 관리
- [ ] `useMessages` - 메시지 리스트 관리
- [ ] `usePersona` - 페르소나 모드 관리
- [ ] `useAuth` - 인증 상태 관리

### 4.2 데이터 페칭

#### 4.2.1 메시지 페칭
- [ ] 초기 메시지 로드
- [ ] 무한 스크롤 구현
- [ ] 새 메시지 실시간 업데이트

#### 4.2.2 캐싱 전략
- [ ] 메시지 캐싱
- [ ] 사용자 설정 캐싱
- [ ] 캐시 무효화 전략

---

## Phase 5: 최적화 및 고도화

### 5.1 성능 최적화

#### 5.1.1 코드 스플리팅
- [ ] 라우트별 코드 스플리팅
- [ ] 컴포넌트 지연 로딩

#### 5.1.2 렌더링 최적화
- [ ] React.memo 활용
- [ ] useMemo, useCallback 최적화
- [ ] 가상화 (긴 메시지 리스트용)

### 5.2 사용자 경험 개선

#### 5.2.1 오프라인 지원 (선택사항)
- [ ] Service Worker 설정
- [ ] 오프라인 메시지 큐
- [ ] 동기화 로직

#### 5.2.2 접근성
- [ ] ARIA 레이블 추가
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원

### 5.3 모니터링 및 로깅

#### 5.3.1 에러 추적
- [ ] 에러 바운더리 구현
- [ ] 에러 로깅 시스템

#### 5.3.2 성능 모니터링
- [ ] API 응답 시간 측정
- [ ] 사용자 행동 추적 (선택사항)

---

## Phase 6: 테스트

### 6.1 단위 테스트
- [ ] 유틸리티 함수 테스트
- [ ] Zod 스키마 검증 테스트
- [ ] 컴포넌트 테스트

### 6.2 통합 테스트
- [ ] API 엔드포인트 테스트
- [ ] 인증 플로우 테스트
- [ ] 채팅 플로우 테스트

### 6.3 E2E 테스트 (선택사항)
- [ ] 주요 사용자 시나리오 테스트
- [ ] 모바일 환경 테스트

---

## Phase 7: 배포 준비

### 7.1 빌드 최적화
- [ ] 프로덕션 빌드 설정
- [ ] 번들 크기 최적화
- [ ] 이미지 최적화

### 7.2 환경 설정
- [ ] 프로덕션 환경 변수
- [ ] 데이터베이스 연결 확인
- [ ] API 키 관리

### 7.3 배포
- [ ] 호스팅 플랫폼 선택 및 설정
- [ ] CI/CD 파이프라인 (선택사항)
- [ ] 도메인 설정

---

## 우선순위 요약

### MVP (Minimum Viable Product)
1. ✅ Phase 1: UI/UX 구현 (전체)
2. ✅ Phase 2: 데이터베이스 및 백엔드 (핵심)
3. ✅ Phase 3: AI 통합 (기본)
4. ✅ Phase 4: 상태 관리 및 데이터 페칭 (기본)

### 고도화
5. Phase 5: 최적화 및 고도화
6. Phase 6: 테스트
7. Phase 7: 배포 준비

---

## 참고 문서
- `docs/PLAN.md`: 프로젝트 기획서
- `AGENTS.md`: 프로젝트 컨텍스트 및 기술 스택
- `docs/UI_DESIGN_SYSTEM.md`: 디자인 시스템
- `docs/DATABASE_SCHEMA.md`: 데이터베이스 스키마 (작성 예정)

---

## Phase 1 완료 요약 (2025.01.XX)

### 완료된 작업

#### 1. 프로젝트 초기 설정
- React Router v7 (Vite) 프로젝트 구조 완성
- Tailwind CSS v4 설정 및 커스텀 색상 추가
- shadcn/ui Nova Preset 설치 및 설정

#### 2. 디자인 시스템 구축
- 커스텀 색상 팔레트 정의 (Primary: #ee2b8c 등)
- Material Symbols 아이콘 통합
- Plus Jakarta Sans, Noto Sans KR 폰트 추가
- 커스텀 애니메이션 (pulse-glow, typing indicator)

#### 3. 공통 컴포넌트 생성
- **채팅 관련**: `MessageBubble`, `ChatHeader`, `MessageInput`, `TypingIndicator`, `DateSeparator`, `ChatListItem`, `OnlineIdolList`
- **레이아웃**: `BottomNavigation`
- **설정**: `SettingsItem`, `SettingsToggle`

#### 4. 화면 컴포넌트 구현
- `routes/chats.tsx` - 채팅방 목록 화면
- `routes/chat.$id.tsx` - 채팅 화면 (동적 라우트)
- `routes/settings.tsx` - 설정 화면
- `routes/character.$id.tsx` - 캐릭터 프로필 화면

#### 5. 라우트 설정
- React Router v7 라우트 구성 완료
- 동적 라우트 지원 (`chat/:id`, `character/:id`)

### 다음 단계 (Phase 2)
- 데이터베이스 스키마 설계 및 Prisma 설정
- Better Auth 인증 시스템 통합
- API 라우트 구현
- 실제 데이터 연동

