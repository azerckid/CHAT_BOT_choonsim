import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "춘심 AI 챗봇" },
    { name: "description", content: "춘심과의 특별한 일상 대화" },
  ];
}

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // 홈 화면 접근 시 로그인 화면으로 리다이렉트
    // TODO: 인증 상태 확인 후 조건부 리다이렉트 (Phase 2)
    navigate("/login", { replace: true });
  }, [navigate]);

  return null;
}
