import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { ITEMS } from "~/lib/items";
import { z } from "zod";
import * as schema from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { BigNumber } from "bignumber.js";
import { logger } from "~/lib/logger.server";
import { nanoid } from "nanoid";

const purchaseSchema = z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
});

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const result = purchaseSchema.safeParse(body);

    if (!result.success) {
        return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { itemId, quantity } = result.data;

    // Check if the item exists in the database
    const item = await db.query.item.findFirst({
        where: eq(schema.item.id, itemId),
    });

    if (!item) {
        return Response.json({ error: "Item not found" }, { status: 404 });
    }

    if (!item.isActive) {
        return Response.json({ error: "Item is not currently available for purchase" }, { status: 400 });
    }

    const totalCost = (item.priceChoco || 0) * quantity;
    const totalCostBigNumber = new BigNumber(totalCost);
    const totalCostRaw = totalCostBigNumber.multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

    // 1. Check user CHOCO balance and get NEAR account info
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, session.user.id),
        columns: { chocoBalance: true, nearAccountId: true, nearPrivateKey: true },
    });

    const userChocoBalance = user?.chocoBalance ? parseFloat(user.chocoBalance) : 0;
    if (!user || userChocoBalance < totalCost) {
        return Response.json({ error: "Insufficient CHOCO balance" }, { status: 400 });
    }

    try {
        // 2. 온체인 전송: 사용자 계정 → 서비스 계정
        let returnTxHash: string | null = null;
        if (user.nearAccountId && user.nearPrivateKey) {
            try {
                const { decrypt } = await import("~/lib/near/key-encryption.server");
                const { returnChocoToService } = await import("~/lib/near/token.server");

                const decryptedPrivateKey = decrypt(user.nearPrivateKey);
                const returnResult = await returnChocoToService(
                    user.nearAccountId,
                    decryptedPrivateKey,
                    totalCostRaw,
                    `Item Purchase: ${item.name} x${quantity}`
                );
                returnTxHash = (returnResult as any).transaction.hash;

                logger.info({
                    category: "PAYMENT",
                    message: `Returned ${totalCost} CHOCO to service account (item purchase)`,
                    metadata: { userId: session.user.id, itemId, quantity, txHash: returnTxHash }
                });
            } catch (onChainError) {
                logger.error({
                    category: "PAYMENT",
                    message: "Failed to return CHOCO on-chain (item purchase)",
                    stackTrace: (onChainError as Error).stack,
                    metadata: { userId: session.user.id, itemId, quantity }
                });
                // 온체인 전송 실패해도 DB는 업데이트 (나중에 복구 가능)
            }
        }

        // 3. DB 트랜잭션
        await db.transaction(async (tx) => {
            // CHOCO 차감
            const newChocoBalance = new BigNumber(userChocoBalance).minus(totalCost).toString();
            await tx.update(schema.user)
                .set({ chocoBalance: newChocoBalance, updatedAt: new Date() })
                .where(eq(schema.user.id, session.user.id));

            // 인벤토리 추가
            await tx.insert(schema.userInventory).values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                itemId,
                quantity,
                updatedAt: new Date(),
            }).onConflictDoUpdate({
                target: [schema.userInventory.userId, schema.userInventory.itemId],
                set: {
                    quantity: sql`${schema.userInventory.quantity} + ${quantity}`,
                    updatedAt: new Date(),
                }
            });

            // Payment 기록
            await tx.insert(schema.payment).values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                amount: totalCost,
                currency: "CHOCO",
                status: "COMPLETED",
                provider: "CHOCO",
                type: "ITEM_PURCHASE",
                description: `${item.name} ${quantity}개 구매`,
                metadata: JSON.stringify({ itemId, quantity, chocoSpent: totalCost, returnTxHash }),
                txHash: returnTxHash || undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // TokenTransfer 기록 (온체인 전송 성공 시)
            if (returnTxHash) {
                await tx.insert(schema.tokenTransfer).values({
                    id: nanoid(),
                    userId: session.user.id,
                    txHash: returnTxHash,
                    amount: totalCostRaw,
                    tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                    status: "COMPLETED",
                    purpose: "ITEM_PURCHASE",
                    createdAt: new Date(),
                });
            }
        });

        return Response.json({ success: true, chocoSpent: totalCost, returnTxHash });
    } catch (error: any) {
        logger.error({
            category: "PAYMENT",
            message: "Purchase transaction error",
            stackTrace: error.stack,
            metadata: { userId: session.user.id, itemId, quantity }
        });
        return Response.json({ error: "Purchase failed" }, { status: 500 });
    }
}
