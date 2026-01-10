import type { LoaderFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "~/lib/near/key-encryption.server";

/**
 * GET /api/wallet/export-private-key
 * 사용자의 NEAR 지갑 프라이빗 키를 복호화하여 반환합니다.
 * 보안: 세션 인증 필수, 프라이빗 키는 매우 민감한 정보입니다.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 사용자 정보 조회
        const user = await db.query.user.findFirst({
            where: eq(schema.user.id, userId),
            columns: {
                nearAccountId: true,
                nearPrivateKey: true,
            },
        });

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.nearAccountId) {
            return Response.json({
                error: "No wallet found",
                message: "지갑이 생성되지 않았습니다. 먼저 로그인하여 지갑을 생성해주세요.",
            }, { status: 400 });
        }

        // 프라이빗 키가 없거나 빈 문자열인 경우, 키 재생성
        if (!user.nearPrivateKey || user.nearPrivateKey.trim() === "") {
            console.log(`[Export Private Key] No private key found for user ${userId}, regenerating keys...`);
            
            const { regenerateWalletKeys } = await import("~/lib/near/wallet.server");
            const keyResult = await regenerateWalletKeys(userId);
            
            if (!keyResult) {
                return Response.json({
                    error: "Key regeneration failed",
                    message: "프라이빗 키 재생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
                }, { status: 500 });
            }
            
            console.log(`[Export Private Key] Successfully regenerated keys for user ${userId}`);
            
            // 재생성한 프라이빗 키 반환
            return Response.json({
                success: true,
                nearAccountId: keyResult.nearAccountId,
                privateKey: keyResult.privateKey,
                warning: "이 프라이빗 키는 극비 정보입니다. 절대 공유하지 마시고, 안전한 곳에 보관하세요. 누군가 이 키를 알게 되면 지갑의 모든 자산을 제어할 수 있습니다.",
                note: "새로운 키 페어가 생성되었습니다. 이 키를 사용하여 지갑을 제어할 수 있습니다.",
            });
        }

        // 암호화 형식 검증 (간단한 사전 체크)
        const parts = user.nearPrivateKey.split(":");
        if (parts.length !== 3) {
            console.log(`[Export Private Key] Invalid private key format for user ${userId}, regenerating keys...`);
            
            // 형식이 잘못된 경우 키 재생성
            const { regenerateWalletKeys } = await import("~/lib/near/wallet.server");
            const keyResult = await regenerateWalletKeys(userId);
            
            if (!keyResult) {
                return Response.json({
                    error: "Key regeneration failed",
                    message: "프라이빗 키 형식이 올바르지 않아 재생성을 시도했지만 실패했습니다. 관리자에게 문의하세요.",
                }, { status: 500 });
            }
            
            console.log(`[Export Private Key] Successfully regenerated keys due to invalid format for user ${userId}`);
            
            // 재생성한 프라이빗 키 반환
            return Response.json({
                success: true,
                nearAccountId: keyResult.nearAccountId,
                privateKey: keyResult.privateKey,
                warning: "이 프라이빗 키는 극비 정보입니다. 절대 공유하지 마시고, 안전한 곳에 보관하세요. 누군가 이 키를 알게 되면 지갑의 모든 자산을 제어할 수 있습니다.",
                note: "기존 키 형식이 올바르지 않아 새로운 키 페어가 생성되었습니다.",
            });
        }

        // 프라이빗 키 복호화
        try {
            // 저장된 값의 형식 확인 (디버깅용)
            const storedValuePreview = user.nearPrivateKey 
                ? `${user.nearPrivateKey.substring(0, 20)}... (length: ${user.nearPrivateKey.length})`
                : "null or empty";
            
            console.log(`[Export Private Key] Attempting to decrypt for user ${userId}, stored value preview: ${storedValuePreview}`);
            
            const decryptedPrivateKey = decrypt(user.nearPrivateKey);
            
            return Response.json({
                success: true,
                nearAccountId: user.nearAccountId,
                privateKey: decryptedPrivateKey,
                warning: "이 프라이빗 키는 극비 정보입니다. 절대 공유하지 마시고, 안전한 곳에 보관하세요. 누군가 이 키를 알게 되면 지갑의 모든 자산을 제어할 수 있습니다.",
            });
        } catch (decryptError: any) {
            console.error("Failed to decrypt private key:", {
                error: decryptError.message || decryptError,
                userId,
                nearAccountId: user.nearAccountId,
                storedValueLength: user.nearPrivateKey?.length || 0,
                storedValuePreview: user.nearPrivateKey?.substring(0, 50) || "null",
            });
            
            // 더 구체적인 에러 메시지 제공
            let errorMessage = "프라이빗 키 복호화에 실패했습니다.";
            
            if (decryptError.message?.includes("Invalid encrypted text format")) {
                errorMessage = "프라이빗 키가 올바른 형식으로 저장되지 않았습니다. 이 지갑은 다른 방법으로 생성되어 프라이빗 키를 제공할 수 없습니다.";
            } else if (decryptError.message?.includes("encryption key")) {
                errorMessage = "암호화 키 문제로 복호화에 실패했습니다. 관리자에게 문의하세요.";
            }
            
            return Response.json({
                error: "Decryption failed",
                message: errorMessage,
                details: process.env.NODE_ENV === "development" ? decryptError.message : undefined,
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Export private key error:", error);
        return Response.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
