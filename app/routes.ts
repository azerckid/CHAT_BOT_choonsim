import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chats", "routes/chats.tsx"),
  route("chat/:id", "routes/chat.$id.tsx"),
  route("settings", "routes/settings.tsx"),
  route("character/:id", "routes/character.$id.tsx"),
] satisfies RouteConfig;
