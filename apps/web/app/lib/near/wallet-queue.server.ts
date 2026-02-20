import { db } from "../db.server";
import * as schema from "../../db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import { ensureNearWalletOnChain } from "./wallet.server";

const MAX_RETRY_COUNT = 3;
const BATCH_SIZE = 10;
// CREATING 상태에서 5분 이상 경과하면 stuck으로 판단
const STUCK_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * PENDING/FAILED(재시도 가능)/STUCK 상태의 지갑 생성 작업을 일괄 처리합니다.
 * cron.server.ts에서 30초마다 호출됩니다.
 */
export async function processWalletCreationQueue() {
    const now = new Date();
    const stuckThreshold = new Date(now.getTime() - STUCK_TIMEOUT_MS);

    // PENDING이거나, FAILED이면서 재시도 횟수가 남은 건, 또는 CREATING인데 5분 이상 stuck된 건
    const pendingUsers = await db.query.user.findMany({
        where: and(
            sql`${schema.user.nearAccountId} IS NOT NULL`,
            sql`${schema.user.nearPublicKey} IS NOT NULL`,
            sql`${schema.user.nearPrivateKey} IS NOT NULL`,
            or(
                eq(schema.user.walletStatus, "PENDING"),
                and(
                    eq(schema.user.walletStatus, "FAILED"),
                    sql`${schema.user.walletRetryCount} < ${MAX_RETRY_COUNT}`
                ),
                and(
                    eq(schema.user.walletStatus, "CREATING"),
                    sql`${schema.user.walletCreatedAt} < ${Math.floor(stuckThreshold.getTime() / 1000)}`
                )
            )
        ),
        columns: {
            id: true,
            nearAccountId: true,
            nearPublicKey: true,
            nearPrivateKey: true,
            walletRetryCount: true,
        },
        limit: BATCH_SIZE,
    });

    if (pendingUsers.length === 0) return;

    console.log(`[Wallet Queue] Processing ${pendingUsers.length} pending wallet(s)`);

    for (const user of pendingUsers) {
        try {
            // CREATING으로 상태 변경 (중복 실행 방지)
            const updated = await db.update(schema.user)
                .set({
                    walletStatus: "CREATING",
                    walletCreatedAt: now,
                    walletError: null,
                    updatedAt: now,
                })
                .where(and(
                    eq(schema.user.id, user.id),
                    or(
                        eq(schema.user.walletStatus, "PENDING"),
                        eq(schema.user.walletStatus, "FAILED"),
                        eq(schema.user.walletStatus, "CREATING") // stuck recovery
                    )
                ));

            // 온체인 지갑 생성 실행
            await ensureNearWalletOnChain(
                user.id,
                user.nearAccountId!,
                user.nearPublicKey!,
                user.nearPrivateKey!
            );

            // 완료 상태로 변경
            await db.update(schema.user)
                .set({
                    walletStatus: "READY",
                    walletCompletedAt: new Date(),
                    walletError: null,
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, user.id));

            console.log(`[Wallet Queue] SUCCESS: user ${user.id} (${user.nearAccountId})`);

        } catch (error) {
            const retryCount = (user.walletRetryCount ?? 0) + 1;
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const isFinalFailure = retryCount >= MAX_RETRY_COUNT;

            await db.update(schema.user)
                .set({
                    walletStatus: "FAILED",
                    walletRetryCount: retryCount,
                    walletError: `[${retryCount}/${MAX_RETRY_COUNT}] ${errorMessage}`,
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, user.id));

            if (isFinalFailure) {
                console.error(`[Wallet Queue] FINAL FAILURE (${MAX_RETRY_COUNT} retries exhausted) for user ${user.id}:`, errorMessage);
            } else {
                console.warn(`[Wallet Queue] RETRY ${retryCount}/${MAX_RETRY_COUNT} for user ${user.id}:`, errorMessage);
            }
        }
    }
}
