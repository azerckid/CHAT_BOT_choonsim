import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { ITEMS } from "~/lib/items";
import { z } from "zod";

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

    const totalCost = item.priceCredits * quantity;

    // 1. Check user credits
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { credits: true },
    });

    if (!user || user.credits < totalCost) {
        return Response.json({ error: "Insufficient credits" }, { status: 400 });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 2. Deduct credits
            await tx.user.update({
                where: { id: session.user.id },
                data: { credits: { decrement: totalCost } },
            });

            // 3. Add to Inventory
            await tx.userInventory.upsert({
                where: { userId_itemId: { userId: session.user.id, itemId } },
                create: {
                    userId: session.user.id,
                    itemId,
                    quantity,
                },
                update: {
                    quantity: { increment: quantity },
                },
            });

            // 4. Create Payment Record (for history)
            await tx.payment.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: session.user.id,
                    amount: totalCost,
                    currency: "CREDITS",
                    status: "COMPLETED",
                    provider: "CREDITS",
                    type: "ITEM_PURCHASE",
                    description: `${item.name} ${quantity}개 구매`,
                    metadata: JSON.stringify({ itemId, quantity }),
                    createdAt: new Date(),
                }
            });
        });

        return Response.json({ success: true, creditsSpent: totalCost });
    } catch (error: any) {
        console.error("Purchase transaction error:", error);
        return Response.json({ error: "Purchase failed" }, { status: 500 });
    }
}
