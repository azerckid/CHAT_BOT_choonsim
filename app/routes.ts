import { type RouteConfig, index, route } from "@react-router/dev/routes";

/**
 * React Router v7 라우트 설정
 * 
 * 주의사항:
 * - 더 구체적인 라우트를 일반적인 라우트보다 먼저 등록해야 합니다.
 *   예: `profile/edit`은 `profile`보다 먼저 등록해야 합니다.
 * - OAuth 콜백 라우트는 Better Auth의 내부 경로와 매핑하기 위해 별도 파일이 필요합니다.
 *   (자세한 내용은 AGENTS.md의 "Authentication & Routing Setup" 섹션 참조)
 */
export default [
  // 인덱스 라우트
  index("routes/index.tsx"),

  // 인증 및 온보딩
  route("home", "routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("onboarding/persona", "routes/onboarding/persona.tsx"),
  route("onboarding", "routes/onboarding/index.tsx"),

  // 채팅
  route("chat/:id", "routes/chat/$id.tsx"),
  route("chats", "routes/chat/index.tsx"),

  // 팬덤
  route("fandom", "routes/fandom.tsx"),
  route("missions", "routes/missions.tsx"),
  route("notices", "routes/notices/index.tsx"),
  route("notices/:id", "routes/notices/$id.tsx"),

  // 프로필 (구체적인 라우트를 먼저 등록)
  route("profile/edit", "routes/profile/edit.tsx"),
  route("profile/subscription", "routes/profile/subscription.tsx"),
  route("profile/saved", "routes/profile/saved.tsx"),
  route("profile", "routes/profile/index.tsx"),

  // 설정
  route("settings", "routes/settings.tsx"),

  // 캐릭터
  route("character/:id", "routes/character/$id.tsx"),

  // OAuth 콜백 라우트 (Better Auth와의 경로 매핑을 위한 별도 파일)
  // AGENTS.md의 "Authentication & Routing Setup" 섹션 참조
  route("auth/google/callback", "routes/auth/google/callback.ts"),
  route("auth/kakao/callback", "routes/auth/kakao/callback.ts"),
  route("auth/twitter/callback", "routes/auth/twitter/callback.ts"),
  route("auth/*", "routes/api/auth/$.ts"), // Better Auth의 다른 경로들

  // API 라우트
  route("api/chat", "routes/api/chat/index.ts"),
  route("api/chat/create", "routes/api/chat/create.ts"),
  route("api/chat/delete", "routes/api/chat/delete.ts"),
  route("api/messages", "routes/api/messages/index.ts"),
  route("api/messages/:id/like", "routes/api/messages/$id.like.ts"),
  route("api/upload", "routes/api/upload.ts"),
  route("api/test-cron", "routes/api/test-cron.ts"),
  route("api/push-subscription", "routes/api/push-subscription.ts"),
  route("api/stats/usage", "routes/api/stats/usage.ts"),
  route("api/items/gift", "routes/api/items/gift.ts"),
  route("api/payment/create-order", "routes/api.payment.create-order.ts"),
  route("api/payment/capture-order", "routes/api.payment.capture-order.ts"),
  route("pricing", "routes/pricing.tsx"),
  route("api/payment/activate-subscription", "routes/api.payment.activate-subscription.ts"),
  route("api/webhooks/paypal", "routes/api.webhooks.paypal.ts"),
  route("api/payment/cancel-subscription", "routes/api.payment.cancel-subscription.ts"),
  route("api/payment/toss-confirm", "routes/api.payment.toss.confirm.ts"),
  route("payment/toss/success", "routes/payment.toss.success.tsx"),
  route("payment/toss/fail", "routes/payment.toss.fail.tsx"),
  route("api/items/purchase", "routes/api/items/purchase.ts"),

  // Admin Routes
  route("admin/dashboard", "routes/admin/dashboard.tsx"),
  route("admin/characters", "routes/admin/characters/index.tsx"),
  route("admin/characters/new", "routes/admin/characters/edit.tsx", { id: "admin-character-new" }),
  route("admin/characters/:id", "routes/admin/characters/edit.tsx", { id: "admin-character-edit" }),
  route("admin/items", "routes/admin/items/index.tsx"),
  route("admin/items/new", "routes/admin/items/edit.tsx", { id: "admin-item-new" }),
  route("admin/items/:id", "routes/admin/items/edit.tsx", { id: "admin-item-edit" }),
  route("admin/items/statistics", "routes/admin/items/statistics.tsx"),
  route("admin/users", "routes/admin/users/index.tsx"),
  route("admin/users/:id", "routes/admin/users/detail.tsx"),
  route("admin/payments", "routes/admin/payments/index.tsx"),
  route("admin/content", "routes/admin/content/index.tsx"),
  route("admin/content/feed", "routes/admin/content/feed.tsx"),
  route("admin/content/notices", "routes/admin/notices/index.tsx"),
  route("admin/content/notices/new", "routes/admin/notices/edit.tsx", { id: "admin-notice-new" }),
  route("admin/content/notices/:id", "routes/admin/notices/edit.tsx", { id: "admin-notice-edit" }),
  route("admin/content/missions", "routes/admin/missions/index.tsx"),
  route("admin/content/missions/new", "routes/admin/missions/edit.tsx", { id: "admin-mission-new" }),
  route("admin/content/missions/:id", "routes/admin/missions/edit.tsx", { id: "admin-mission-edit" }),
  route("admin/system", "routes/admin/system.tsx"),
  route("admin/*", "routes/admin/$.tsx"),

] satisfies RouteConfig;


