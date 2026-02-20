import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import BigNumber from "bignumber.js";
import axios from "axios";

// NEAR 가격 캐싱
let cachedNearPrice: number | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

const createRequestSchema = z.object({
    amount: z.number().positive(), // USD
    credits: z.number().int().positive(),
    description: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

    const recipientAddr = process.env.NEAR_RECEIVER_WALLET;
    if (!recipientAddr) {
        return Response.json({ error: "NEAR receiver wallet is not configured" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const result = createRequestSchema.safeParse(body);
        if (!result.success) {
            return Response.json({ error: "Invalid request data", details: result.error.issues }, { status: 400 });
        }

        const { amount, credits, description } = result.data;
        const userId = session.user.id;

        // 1. NEAR 가격 가져오기 (캐싱 적용)
        let nearPrice = cachedNearPrice || 5;
        const now = Date.now();
        if (!cachedNearPrice || (now - lastFetchTime > CACHE_DURATION)) {
            try {
                const priceRes = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd");
                nearPrice = priceRes.data.near.usd;
                cachedNearPrice = nearPrice;
                lastFetchTime = now;
                console.log(`[NearPay] Updated NEAR price: $${nearPrice}`);
            } catch (e) {
                console.error("Failed to fetch NEAR price, using cached/fallback:", e);
            }
        }

        // 2. NEAR 수량 계산
        const nearAmount = new BigNumber(amount).dividedBy(nearPrice).decimalPlaces(6);

        // 3. Pending Payment 레코드 생성
        const paymentId = crypto.randomUUID();
        await db.insert(schema.payment).values({
            id: paymentId,
            userId,
            amount,
            currency: "USD",
            status: "PENDING",
            type: "TOPUP",
            provider: "NEAR",
            creditsGranted: credits,
            cryptoCurrency: "NEAR",
            cryptoAmount: nearAmount.toNumber(),
            exchangeRate: nearPrice,
            description: description || `${credits} Credits Top-up (NEAR)`,
            updatedAt: new Date(),
        });

        return Response.json({
            success: true,
            paymentId,
            recipient: recipientAddr,
            nearAmount: nearAmount.toString(),
            nearPrice: nearPrice.toString(),
        });
    } catch (error) {
        console.error("NEAR payment request creation error:", error);
        return Response.json({ error: "Failed to create NEAR payment request" }, { status: 500 });
    }
}
