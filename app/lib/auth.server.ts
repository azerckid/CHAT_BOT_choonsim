import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db.server";

export const auth = betterAuth({
    basePath: "/auth",
    database: prismaAdapter(prisma, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true,
    },
    account: {
        accountLinking: {
            updateUserInfoOnLink: true, // 새로 연결된 소셜 계정의 정보로 사용자 정보 업데이트
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            redirectURI: process.env.GOOGLE_REDIRECT_URL,
            overrideUserInfoOnSignIn: true, // 로그인할 때마다 사용자 정보 업데이트
            mapProfileToUser: (profile) => {
                return {
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    emailVerified: profile.verified_email,
                    provider: "google",
                    avatarUrl: profile.picture,
                };
            },
        },
        twitter: {
            clientId: process.env.TWITTER_CLIENT_ID || "",
            clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
            redirectURI: process.env.TWITTER_REDIRECT_URL,
            overrideUserInfoOnSignIn: true, // 로그인할 때마다 사용자 정보 업데이트
            // Twitter API v2를 사용하여 사용자 정보 직접 가져오기
            getUserInfo: async (token) => {
                try {
                    // Twitter API v2 /2/users/me 엔드포인트 사용
                    const response = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name", {
                        headers: {
                            Authorization: `Bearer ${token.accessToken}`,
                        },
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Twitter API error: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    const profile = data.data; // Twitter API v2는 data 필드에 사용자 정보를 반환
                    
                    // Twitter는 이메일을 기본적으로 제공하지 않으므로, username 기반으로 생성
                    const email = profile.email || `${profile.username || profile.id}@twitter.local`;
                    
                    // 프로필 이미지를 더 큰 해상도로 변환
                    const highResImageUrl = profile.profile_image_url
                        ? profile.profile_image_url.replace(/_normal|_bigger|_mini|_400x400/g, "_400x400")
                        : null;
                    
                    return {
                        user: {
                            id: profile.id,
                            name: profile.name || profile.username || "Twitter User",
                            email: email,
                            image: highResImageUrl,
                            emailVerified: false,
                        },
                        data: profile,
                    };
                } catch (error) {
                    console.error("Error fetching Twitter user info:", error);
                    // Fallback: 기본값 반환
                    return {
                        user: {
                            id: "unknown",
                            name: "Twitter User",
                            email: "unknown@twitter.local",
                            image: null,
                            emailVerified: false,
                        },
                        data: {},
                    };
                }
            },
            mapProfileToUser: (profile) => {
                // 프로필 이미지를 더 큰 해상도로 변환
                const highResImageUrl = profile.profile_image_url
                    ? profile.profile_image_url.replace(/_normal|_bigger|_mini|_400x400/g, "_400x400")
                    : null;
                
                // getUserInfo에서 이미 변환된 user 객체를 받지만,
                // 추가 필드(provider, avatarUrl, snsId)를 매핑
                return {
                    name: profile.name || profile.username || "Twitter User",
                    email: profile.email || `${profile.username || profile.id}@twitter.local`,
                    image: highResImageUrl,
                    emailVerified: false,
                    provider: "twitter",
                    avatarUrl: highResImageUrl,
                    snsId: profile.id?.toString() || profile.username,
                };
            },
        },
        kakao: {
            clientId: process.env.KAKAO_CLIENT_ID || "",
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
            redirectURI: process.env.KAKAO_REDIRECT_URL,
            overrideUserInfoOnSignIn: true, // 로그인할 때마다 사용자 정보 업데이트
            mapProfileToUser: (profile) => {
                return {
                    name: profile.kakao_account?.profile?.nickname || profile.kakao_account?.email || "Kakao User",
                    email: profile.kakao_account?.email || `${profile.id}@kakao.local`,
                    image: profile.kakao_account?.profile?.profile_image_url,
                    emailVerified: profile.kakao_account?.is_email_verified || false,
                    provider: "kakao",
                    avatarUrl: profile.kakao_account?.profile?.profile_image_url,
                    snsId: profile.id?.toString(),
                };
            },
        },
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
    // Database hooks: account가 업데이트될 때 User 테이블도 업데이트
    databaseHooks: {
        account: {
            create: {
                after: async (account) => {
                    // 새 account가 생성될 때 (소셜 로그인 시)
                    // 해당 provider의 정보로 User 테이블 업데이트
                    try {
                        const user = await prisma.user.findUnique({
                            where: { id: account.userId },
                        });
                        
                        if (user && account.providerId) {
                            // provider에 따라 다른 처리
                            const updateData: any = {
                                provider: account.providerId,
                            };
                            
                            // image 필드가 있고, provider와 일치하는 경우에만 avatarUrl 업데이트
                            // Twitter인 경우 image가 Twitter 이미지여야 함
                            if (user.image && account.providerId === "twitter") {
                                // image가 Twitter 이미지인지 확인 (Twitter 이미지 URL 패턴)
                                if (user.image.includes("pbs.twimg.com") || user.image.includes("twitter.com")) {
                                    updateData.avatarUrl = user.image;
                                }
                            } else if (user.image && account.providerId === "google") {
                                // Google 이미지인 경우
                                if (user.image.includes("googleusercontent.com") || user.image.includes("google.com")) {
                                    updateData.avatarUrl = user.image;
                                }
                            } else if (user.image) {
                                // 다른 provider인 경우 그대로 사용
                                updateData.avatarUrl = user.image;
                            }
                            
                            await prisma.user.update({
                                where: { id: account.userId },
                                data: updateData,
                            });
                        }
                    } catch (error) {
                        console.error("Error updating user in account create hook:", error);
                    }
                },
            },
            update: {
                after: async (account) => {
                    // account가 업데이트될 때 (재로그인 시)
                    // 해당 provider의 정보로 User 테이블 업데이트
                    try {
                        const user = await prisma.user.findUnique({
                            where: { id: account.userId },
                        });
                        
                        if (user && account.providerId) {
                            // provider에 따라 다른 처리
                            const updateData: any = {
                                provider: account.providerId,
                            };
                            
                            // image 필드가 있고, provider와 일치하는 경우에만 avatarUrl 업데이트
                            if (user.image && account.providerId === "twitter") {
                                // image가 Twitter 이미지인지 확인
                                if (user.image.includes("pbs.twimg.com") || user.image.includes("twitter.com")) {
                                    updateData.avatarUrl = user.image;
                                }
                            } else if (user.image && account.providerId === "google") {
                                // Google 이미지인 경우
                                if (user.image.includes("googleusercontent.com") || user.image.includes("google.com")) {
                                    updateData.avatarUrl = user.image;
                                }
                            } else if (user.image) {
                                // 다른 provider인 경우 그대로 사용
                                updateData.avatarUrl = user.image;
                            }
                            
                            await prisma.user.update({
                                where: { id: account.userId },
                                data: updateData,
                            });
                        }
                    } catch (error) {
                        console.error("Error updating user in account update hook:", error);
                    }
                },
            },
        },
    },
});
