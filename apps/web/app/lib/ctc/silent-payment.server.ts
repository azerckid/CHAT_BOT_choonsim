/**
 * Silent Payment 한도 확인 (오프체인 포인트 버전)
 * 이전 구현에서 이동 (온체인 의존성 없음)
 */
import { db } from "../db.server";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * 사용자가 "자동 결제(Silent Payment)" 한도 내에 있는지 확인합니다.
 */
export async function checkSilentPaymentAllowance(
    userId: string,
    requestAmountUSD: number
) {
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: {
            allowanceAmount: true,
            allowanceExpiresAt: true,
            chocoBalance: true,
        },
    });

    if (!user) return { canAutoPay: false, reason: "User not found" };

    const now = new Date();
    const hasAllowance = user.allowanceAmount !== null && user.allowanceAmount > 0;
    const isNotExpired = !user.allowanceExpiresAt || user.allowanceExpiresAt > now;

    if (!hasAllowance || !isNotExpired) {
        return {
            canAutoPay: false,
            reason: "No active allowance or expired",
            allowanceAmount: user.allowanceAmount || 0
        };
    }

    if (requestAmountUSD > (user.allowanceAmount || 0)) {
        return {
            canAutoPay: false,
            reason: "Request exceeds allowance limit",
            allowanceAmount: user.allowanceAmount
        };
    }

    return {
        canAutoPay: true,
        remainingAllowance: user.allowanceAmount! - requestAmountUSD
    };
}

/**
 * 사용자별 자동 결제 한도를 업데이트합니다.
 */
export async function updateAllowance(
    userId: string,
    amountUSD: number,
    hours: number = 24
) {
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    await db.update(schema.user)
        .set({
            allowanceAmount: amountUSD,
            allowanceExpiresAt: expiresAt,
            updatedAt: new Date(),
        })
        .where(eq(schema.user.id, userId));
}
