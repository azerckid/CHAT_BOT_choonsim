import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { ensureNearWallet } from "~/lib/near/wallet.server";
import { getUserNearWallet } from "~/lib/near/wallet.server";

/**
 * GET /api/test-wallet
 * 현재 로그인한 사용자의 지갑 생성 테스트 및 상태 확인
 */
export async function loader({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 현재 지갑 상태 확인
        const walletInfo = await getUserNearWallet(userId);

        return Response.json({
            userId,
            currentWallet: walletInfo,
            message: walletInfo?.nearAccountId 
                ? "지갑이 이미 존재합니다." 
                : "지갑이 없습니다. POST 요청으로 생성할 수 있습니다."
        });
    } catch (error: any) {
        return Response.json({
            error: error.message || "Failed to check wallet status",
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        }, { status: 500 });
    }
}

/**
 * POST /api/test-wallet
 * 현재 로그인한 사용자의 지갑 강제 생성 (테스트용)
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        console.log(`[Test Wallet] Starting wallet creation test for user: ${userId}`);
        
        // 지갑 생성 시도
        const accountId = await ensureNearWallet(userId);

        if (accountId) {
            console.log(`[Test Wallet] Successfully created wallet: ${accountId}`);
            return Response.json({
                success: true,
                accountId,
                message: "지갑이 성공적으로 생성되었습니다."
            });
        } else {
            console.error(`[Test Wallet] Failed to create wallet for user: ${userId}`);
            return Response.json({
                success: false,
                error: "지갑 생성에 실패했습니다. 서버 로그를 확인하세요.",
                message: "서버 터미널에서 '[Wallet] Failed to create wallet' 메시지를 확인하세요."
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error(`[Test Wallet] Error creating wallet:`, error);
        return Response.json({
            success: false,
            error: error.message || "Failed to create wallet",
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            message: "서버 터미널에서 상세한 에러 로그를 확인하세요."
        }, { status: 500 });
    }
}
