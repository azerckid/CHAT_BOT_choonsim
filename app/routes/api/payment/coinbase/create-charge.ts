import type { ActionFunctionArgs } from "react-router";
import coinbase from "coinbase-commerce-node";
const { Client, resources } = coinbase;
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";

const { Charge } = resources;

// Coinbase Commerce 클라이언트 초기화
// API KEY가 없을 경우 런타임 에러 방지 위해 가드 로직 포함
const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY || "";
if (COINBASE_API_KEY) {
    Client.init(COINBASE_API_KEY);
}

const createChargeSchema = z.object({
    amount: z.number().positive(),
    credits: z.number().int().positive(),
    description: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    if (!COINBASE_API_KEY) {
        return Response.json({ error: "Coinbase API Key is not configured" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const result = createChargeSchema.safeParse(body);

        if (!result.success) {
            return Response.json(
                { error: "Invalid request data", details: result.error.errors },
                { status: 400 }
            );
        }

        const { amount, credits, description } = result.data;
        const userId = session.user.id;

        // Charge 생성
        const chargeData = {
            name: description || `${credits} Credits Top-up`,
            description: `Purchase ${credits} credits for $${amount}`,
            local_price: {
                amount: amount.toFixed(2),
                currency: "USD",
            },
            pricing_type: "fixed_price",
            metadata: {
                userId,
                credits: credits.toString(),
            },
        };

        const charge = await Charge.create(chargeData);

        // Pending Payment 레코드 생성
        await db.insert(schema.payment).values({
            id: crypto.randomUUID(),
            userId,
            amount: amount,
            currency: "USD",
            status: "PENDING",
            type: "TOPUP",
            provider: "COINBASE",
            transactionId: charge.id,
            creditsGranted: credits,
            description: chargeData.name,
            metadata: JSON.stringify({
                chargeId: charge.id,
                hostedUrl: charge.hosted_url,
            }),
            updatedAt: new Date(),
        });

        return Response.json({
            success: true,
            chargeId: charge.id,
            hostedUrl: charge.hosted_url,
            expiresAt: (charge as any).expires_at,
        });
    } catch (error) {
        console.error("Coinbase charge creation error:", error);
        return Response.json(
            { error: "Failed to create charge" },
            { status: 500 }
        );
    }
}
