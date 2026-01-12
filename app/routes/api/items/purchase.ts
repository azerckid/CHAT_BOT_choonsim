import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { ITEMS } from "~/lib/items";
import { z } from "zod";
import * as schema from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { BigNumber } from "bignumber.js";

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
    const item = Object.values(ITEMS).find(i => i.id === itemId);

    if (!item) {
        return Response.json({ error: "Item not found" }, { status: 404 });
    }

    const totalCost = (item.priceChoco || item.priceCredits || 0) * quantity; // priceChoco 우선, 없으면 priceCredits (호환성)

    // 1. Check user CHOCO balance
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, session.user.id),
        columns: { chocoBalance: true },
    });

    const userChocoBalance = user?.chocoBalance ? parseFloat(user.chocoBalance) : 0;
    if (!user || userChocoBalance < totalCost) {
        return Response.json({ error: "Insufficient CHOCO balance" }, { status: 400 });
    }

    try {
        await db.transaction(async (tx) => {
            // 2. Deduct CHOCO
            const newChocoBalance = new BigNumber(userChocoBalance).minus(totalCost).toString();
            await tx.update(schema.user)
                .set({ chocoBalance: newChocoBalance, updatedAt: new Date() })
                .where(eq(schema.user.id, session.user.id));

            // 3. Add to Inventory
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

            // 4. Create Payment Record (for history)
            await tx.insert(schema.payment).values({
                id: crypto.randomUUID(),
                userId: session.user.id,
                amount: totalCost,
                currency: "CHOCO",
                status: "COMPLETED",
                provider: "CHOCO",
                type: "ITEM_PURCHASE",
                description: `${item.name} ${quantity}개 구매`,
                metadata: JSON.stringify({ itemId, quantity, chocoSpent: totalCost }),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });

        return Response.json({ success: true, chocoSpent: totalCost });
    } catch (error: any) {
        console.error("Purchase transaction error:", error);
        return Response.json({ error: "Purchase failed" }, { status: 500 });
    }
}
