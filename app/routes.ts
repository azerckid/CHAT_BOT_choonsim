import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("home", "routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("onboarding/persona", "routes/onboarding.persona.tsx"),
  route("chats", "routes/chats.tsx"),
  route("chat/:id", "routes/chat.$id.tsx"),
  route("fandom", "routes/fandom.tsx"),
  route("profile", "routes/profile.tsx"),
  route("settings", "routes/settings.tsx"),
  route("character/:id", "routes/character.$id.tsx"),

  // API Routes
  route("auth/google/callback", "routes/auth/google/callback.ts"),
  route("auth/kakao/callback", "routes/auth/kakao/callback.ts"),
  route("auth/twitter/callback", "routes/auth/twitter/callback.ts"),
  route("auth/*", "routes/api/auth/$.ts"),
  route("api/chat", "routes/api/chat/index.ts"),
  route("api/chat/create", "routes/api/chat/create.ts"),
  route("api/chat/delete", "routes/api/chat/delete.ts"),
  route("api/messages", "routes/api/messages/index.ts"),
  route("api/messages/:id/like", "routes/api/messages/$id.like.ts"),
  route("api/upload", "routes/api/upload.ts"),
  route("api/test-cron", "routes/api/test-cron.ts"),
  route("api/push-subscription", "routes/api/push-subscription.ts"),
] satisfies RouteConfig;
