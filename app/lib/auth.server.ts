import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db.server";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
        // TODO: Kakao OAuth 지원 추가 (Better Auth 공식 지원 여부 확인 필요)
    },
    modelNames: {
        user: "User",
        account: "account",
        session: "session",
        verification: "verification",
    },
    // 테이블 매핑 (기존 스키마 기반)
    user: {
        additionalFields: {
            avatarUrl: { type: "string" },
            status: { type: "string" },
            bio: { type: "string" },
            snsId: { type: "string" },
            provider: { type: "string" },
        },
    },
});
