# AI Idol Chat - 춘심 AI 챗봇

AI 아이돌과의 특별한 일상 대화 서비스. 사용자와 AI 캐릭터(춘심, 소라, 유나, 미나 등) 간의 1:1 대화를 통해 정서적 유대감을 형성하는 플랫폼입니다.

## 프로젝트 개요

이 프로젝트는 '춘심'이라는 캐릭터의 IP를 활용하여, 팬들과의 감정적 연결을 강화하고 팬덤 충성도를 확보하는 것을 목표로 합니다. 사용자는 AI 캐릭터와 일상적인 대화를 나누며, 아이돌이자 연인과 같은 특별한 존재와의 관계를 경험할 수 있습니다.

### 핵심 가치

- **Daily Companion**: 매일 로그인하여 일상을 공유하고 위로를 받는 깊은 관계 형성
- **1:1 대화 채널**: 전용 대화 채널을 통한 개인화된 경험
- **다양한 캐릭터**: 춘심, 소라, 유나, 미나 등 다양한 AI 아이돌 캐릭터

## 주요 기능

### 인증 및 사용자 관리
- 이메일/비밀번호 로그인
- 소셜 로그인 (Google, Twitter/X, Kakao)
- 사용자 프로필 관리
- 구독 등급 시스템 (FREE, BASIC, PREMIUM, ULTIMATE)

### 채팅 기능
- AI 캐릭터와의 실시간 대화
- 스트리밍 응답
- 이미지 공유 (사용자 → AI, AI → 사용자)
- 메시지 좋아요 기능
- 대화 기록 관리

### 홈 화면
- Today's Pick 캐릭터 소개
- 빠른 액세스 버튼 (New Chat, Daily Gift, Gallery, Shop)
- Continue Chatting (최근 대화)
- Trending Idols (인기 캐릭터)
- News & Events

### 캐릭터 프로필
- 캐릭터 정보 및 갤러리
- 음성 설정
- 캐릭터별 특성 및 페르소나

### 팬덤 기능
- 미션 시스템
- 뉴스/이벤트
- 리더보드
- 팬 피드

## 기술 스택

### Frontend
- **Framework**: React Router v7 (Vite)
- **UI Library**: shadcn/ui (Nova Preset)
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks
- **Form Validation**: Zod
- **Date/Time**: Luxon

### Backend
- **Runtime**: Node.js
- **Server Framework**: React Router v7 (Server-side)
- **Authentication**: Better Auth
- **Database**: Turso (libSQL) with Prisma ORM

### AI & Media
- **AI Model**: Google Gemini API
- **AI Framework**: LangChain / LangGraph
- **Media Storage**: Cloudinary

### Mobile
- **Framework**: Capacitor (iOS, Android, PWA 지원)

## 시작하기

### 사전 요구사항

- Node.js 20 이상
- npm 또는 yarn
- Turso 데이터베이스 계정
- Google Gemini API 키
- Cloudinary 계정 (이미지 업로드용)
- Better Auth를 위한 환경 변수

### 설치

1. 저장소 클론:
```bash
git clone <repository-url>
cd CHAT-BOTS
```

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
`.env` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```env
# Database
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Authentication
BETTER_AUTH_SECRET=your_random_secret_min_32_chars
BETTER_AUTH_URL=http://localhost:5173

# AI
GEMINI_API_KEY=your_gemini_api_key
# 또는
GOOGLE_API_KEY=your_google_api_key

# Media Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# OAuth (선택사항)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:5173/auth/callback/google

TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URL=http://localhost:5173/auth/callback/twitter

KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
KAKAO_REDIRECT_URL=http://localhost:5173/auth/callback/kakao
```

4. 데이터베이스 설정:
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 (개발 환경)
npx prisma migrate dev

# 데이터베이스 스키마 확인
npx prisma studio
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물:
```
build/
├── client/    # 정적 자산
└── server/    # 서버 측 코드
```

### 프로덕션 서버 실행

```bash
npm start
```

## 배포

### Vercel 배포 (권장)

1. Vercel에 프로젝트 연결
2. 환경 변수 설정 (Vercel 대시보드 → Settings → Environment Variables)
3. OAuth 콜백 URL 설정:
   - Google: `https://your-domain.vercel.app/auth/callback/google`
   - Twitter: `https://your-domain.vercel.app/auth/callback/twitter`
   - Kakao: `https://your-domain.vercel.app/auth/callback/kakao`
4. 배포

자세한 배포 가이드는 [`docs/VERCEL_DEPLOYMENT_CHECKLIST.md`](./docs/VERCEL_DEPLOYMENT_CHECKLIST.md)를 참고하세요.

### Docker 배포

```bash
docker build -t chat-bots .

# 컨테이너 실행
docker run -p 3000:3000 chat-bots
```

Docker 이미지는 다음 플랫폼에 배포할 수 있습니다:
- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

## 프로젝트 구조

```
.
├── app/
│   ├── routes/           # 라우트 파일들
│   ├── components/       # React 컴포넌트
│   ├── lib/             # 유틸리티 및 서버 로직
│   └── root.tsx         # 앱 진입점
├── prisma/
│   └── schema.prisma    # 데이터베이스 스키마
├── docs/                # 문서
└── scripts/             # 유틸리티 스크립트
```

## 주요 문서

- [`docs/03_IMPLEMENTATION_PLAN.md`](./docs/03_IMPLEMENTATION_PLAN.md) - 구현 계획 및 로드맵
- [`docs/VERCEL_DEPLOYMENT_CHECKLIST.md`](./docs/VERCEL_DEPLOYMENT_CHECKLIST.md) - Vercel 배포 체크리스트
- [`docs/ADMIN_PAGE_REQUIREMENTS.md`](./docs/ADMIN_PAGE_REQUIREMENTS.md) - Admin 페이지 요구사항
- [`docs/ADMIN_PAGE_DESIGN_SPEC.md`](./docs/ADMIN_PAGE_DESIGN_SPEC.md) - Admin 페이지 디자인 스펙
- [`AGENTS.md`](./AGENTS.md) - AI 에이전트 가이드

## 라이선스

Private

---

Built with ❤️ using React Router v7
