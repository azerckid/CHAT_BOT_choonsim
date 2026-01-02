# AGENTS.md

Welcome! your AI coding agent. This file follows the [AGENTS.md](https://agents.md/) standard to provide me with the context and instructions I need to work on the **CHAT-BOT** project effectively.

## Project Overview
The project aims to provide an interactive experience that goes beyond simple content consumption by leveraging the IP of the character 'Chunsim', who currently boasts a fandom of 32,000 people. The primary objective is to strengthen emotional bonds and secure fandom loyalty by establishing a dedicated 1:1 conversation channel between users and Chunsim. At its core, the service offers seamless emotional conversations with a "special existence"—acting as both an idol and a lover—with whom users can share their daily lives.

The ultimate vision is to position the service as a 'Daily Companion'. In this role, followers are encouraged to log in every day to share their daily routines and receive comfort, fostering a deep, ongoing relationship.

The core target audience consists of the 32,000 X (Twitter) users who currently follow the 'Chunsim' account. These users are characterized by their familiarity with mobile environments and a desire to communicate with the character through text-based interactions, driven by feelings of 'simulated romance' or strong fandom loyalty.

## Setup Commands
- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build production bundle: `npm run build`
- Database migration: `npx prisma migrate dev`
- Database studio: `npx prisma studio`

## Authentication & Routing Setup

### 소셜 로그인 콜백 경로 구조 (React Router v7 + Better Auth)

Better Auth는 기본적으로 `/auth/callback/{provider}` 형식의 내부 경로를 사용하지만, OAuth 제공자(Google, Twitter, Kakao 등)의 리다이렉트 URL은 `/auth/{provider}/callback` 형식으로 설정해야 할 수 있습니다.

이를 해결하기 위해 React Router v7의 `routes.ts` 파일과 `routes` 폴더 구조를 다음과 같이 설정합니다:

1. **`app/routes.ts`에 콜백 라우트 등록:**
   ```typescript
   route("auth/google/callback", "routes/auth/google/callback.ts"),
   route("auth/kakao/callback", "routes/auth/kakao/callback.ts"),
   route("auth/twitter/callback", "routes/auth/twitter/callback.ts"),
   route("auth/*", "routes/api/auth/$.ts"), // Better Auth의 다른 경로들
   ```

2. **`app/routes/auth/{provider}/callback.ts` 파일 생성:**
   각 콜백 파일은 외부 경로(`/auth/{provider}/callback`)를 Better Auth의 내부 경로(`/auth/callback/{provider}`)로 매핑합니다:
   ```typescript
   export async function loader({ request }: LoaderFunctionArgs) {
       const url = new URL(request.url);
       url.pathname = "/auth/callback/{provider}"; // Better Auth 내부 경로로 변환
       const libRequest = new Request(url.toString(), {
           method: request.method,
           headers: request.headers,
       });
       return auth.handler(libRequest);
   }
   ```

3. **환경 변수 설정:**
   OAuth 제공자의 리다이렉트 URL을 `/auth/{provider}/callback` 형식으로 설정:
   ```
   TWITTER_REDIRECT_URL=http://localhost:5173/auth/twitter/callback
   GOOGLE_REDIRECT_URL=http://localhost:5173/auth/google/callback
   KAKAO_REDIRECT_URL=http://localhost:5173/auth/kakao/callback
   ```

**참고**: 이 구조는 React Router v7과 Better Auth를 함께 사용할 때 필요한 패턴이며, 다른 프로젝트에서도 동일한 방식으로 구현할 수 있습니다.

## Tech Stack
- **Framework**: React Router v7 (Vite)
- **Styling**: Tailwind CSS v4, shadcn/ui (Nova Preset)
- **Database**: Turso (libSQL) with Prisma ORM
- **Authentication**: Better Auth (session-based authentication)
- **Validation**: Zod (schema validation)
- **Date/Time**: Luxon (date and time handling)
- **Media Storage**: Cloudinary (for image and video uploads)
- **Mobile**: Capacitor (iOS, Android native apps, PWA support)
- **AI**: Google Gemini API (for chatbot responses)
- **AI Workflow**: LangGraph (for managing complex conversation flows and persona state transitions)
- **Search (Optional)**: RAG system with Vector DB (Pinecone, Weaviate, or FAISS) and Embedding models (OpenAI or open-source)
- **Maps (Travel Blog)**: Google Maps API, Naver Maps API, or Mapbox (for location visualization and travel route mapping)

## Code Style & Conventions
- Use **TypeScript** for all files.
- Stick to functional components and React Hooks.
- Follow the shadcn/ui Nova design system for UI consistency.
- Use **Zod** for all schema validations and type-safe parsing.
- Use **Luxon** for date and time handling.
- For React Router v7 route functions (`meta`, `loader`, `action`), import types from `react-router` (e.g., `LoaderFunctionArgs`, `ActionFunctionArgs`, `MetaFunction`).
- Use **Toast notifications** (Sonner - shadcn/ui를 통해 설치하는 Toast 컴포넌트) for user feedback on important actions:
  - Success: Login, logout, signup, tweet creation/update/delete, comment creation, etc.
  - Error: Failed actions, validation errors, etc.
  - Info: General information messages
  - Warning: Cautionary messages
- **Error Handling**: Always implement comprehensive error handling:
  - Check for `error` field in all fetcher responses (`fetcher.data?.error`)
  - Display errors using `toast.error()` instead of showing raw error messages on the UI
  - Remove optimistic updates when errors occur (e.g., remove optimistic messages on send failure)
  - Handle API errors gracefully in all `useEffect` hooks that process fetcher data
  - Never leave error handling as an afterthought - it must be included from the initial implementation
- Git commit messages must follow Conventional Commits in Korean (e.g., `feat(ui): 로그인 기능 추가`).

## Workflow & Safety
- **[Safe Checkpoint Strategy]** 새로운 작업이나 중요한 변경(새 파일 생성, DB 스키마 수정, 패키지 설치 등)을 시작하기 전에, 반드시 현재 상태를 git commit하거나 작업 디렉토리가 깨끗한지 확인을 요청해야 합니다.

## Communication Rules
- **[No Emojis]** 사용자와의 모든 채팅 대화에서 이모지(Emoji) 및 이모티콘(Emoticon) 사용을 전면 금지합니다. 텍스트와 코드만으로 명확하게 정보를 전달하십시오.

## Testing Instructions
- Currently, tests are being integrated as part of the development phase (Phase 9).
- Run available tests using: `npm test`

## Key Documentation
- `docs/IMPLEMENTATION_PLAN.md`: The roadmap for project completion.
- `docs/UI_DESIGN_SYSTEM.md`: Design tokens and visual guidelines.
- `docs/DATABASE_SCHEMA.md`: Prisma schema and storage logic.
- `docs/PLAN.md`: Project specification and requirements.
