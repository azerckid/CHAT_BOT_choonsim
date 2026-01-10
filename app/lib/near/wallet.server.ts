import { db } from "../db.server";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import { ensureStorageDeposit } from "./storage-deposit.server";

/**
 * 사용자의 Better Auth 세션 ID와 NEAR 계정 주소를 연결합니다.
 * @param userId Better Auth 사용자 ID
 * @param nearAccountId NEAR 계정 주소 (예: user.near)
 * @param publicKey (선택) NEAR 공개키
 */
export async function linkNearWallet(
    userId: string,
    nearAccountId: string,
    publicKey?: string
) {
    // 1. NEAR 토큰 실령을 위한 Storage Deposit 자동 처리
    try {
        await ensureStorageDeposit(nearAccountId);
    } catch (e) {
        console.error("Failed to ensure storage deposit during linking:", e);
        // 비즈니스 로직에 따라 에러를 던질지, 무시할지 결정 (여기서는 로그만 남김)
    }

    // 2. DB 업데이트
    await db.update(schema.user)
        .set({
            nearAccountId,
            nearPublicKey: publicKey || null,
            updatedAt: new Date(),
        })
        .where(eq(schema.user.id, userId));
}

/**
 * 사용자의 계정 정보와 연결된 NEAR 지갑 정보를 조회합니다.
 */
export async function getUserNearWallet(userId: string) {
    return await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: {
            nearAccountId: true,
            nearPublicKey: true,
            chocoBalance: true,
            heartsCount: true,
            allowanceAmount: true,
            allowanceExpiresAt: true,
        },
    });
}
