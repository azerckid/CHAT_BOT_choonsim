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
