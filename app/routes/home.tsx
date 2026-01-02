import { useNavigate } from "react-router";
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs } from "react-router";
import type { Route } from "./+types/home";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "춘심 AI 챗봇" },
    { name: "description", content: "춘심과의 특별한 일상 대화" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  // 인증된 사용자는 채팅 목록으로, 미인증 사용자는 로그인으로 리다이렉트
  if (session) {
    throw new Response(null, { status: 302, headers: { Location: "/chats" } });
  } else {
    throw new Response(null, { status: 302, headers: { Location: "/login" } });
  }
}

export default function Home() {
  // Loader에서 리다이렉트하므로 이 컴포넌트는 렌더링되지 않음
  return null;
}
