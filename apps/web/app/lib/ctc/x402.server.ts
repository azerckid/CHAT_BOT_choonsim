/**
 * X402 결제 프로토콜 (CTC 오프체인 포인트 버전)
 * Phase 0-3: NEAR 온체인 검증 제거 → CHOCO DB 포인트 기반으로 단순화
 */
import { db } from "../db.server";
import * as schema from "../../db/schema";
import crypto from "crypto";
import { BigNumber } from "bignumber.js";
import { nanoid } from "nanoid";

// 1 CHOCO = $0.001 (1 USD = 1,000 CHOCO)
const CHOCO_PRICE_USD = 0.001;

/**
 * X402 결제를 위한 인보이스를 생성합니다.
 * @param userId 결제할 사용자 ID
 * @param amountUSD 결제할 금액 (USD)
 */
export async function createX402Invoice(userId: string, amountUSD: number) {
    const chocoAmount = new BigNumber(amountUSD).dividedBy(CHOCO_PRICE_USD);
    const amountRaw = chocoAmount.multipliedBy(new BigNumber(10).pow(18)).toString();

    const token = crypto.randomBytes(32).toString("hex");

    await db.insert(schema.x402Invoice).values({
        id: nanoid(),
        token,
        userId,
        amount: amountUSD,
        currency: "USD",
        chocoAmount: amountRaw,
        recipientAddress: "",
        status: "PENDING",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분 유효
        createdAt: new Date(),
    });

    return {
        token,
        invoice: {
            amount: chocoAmount.toString(),
            currency: "CHOCO",
        },
    };
}

/**
 * 402 Payment Required 응답 객체를 생성합니다.
 */
export function createX402Response(token: string, invoice: any): Response {
    return Response.json(
        {
            error: "Payment Required",
            code: "X402_PAYMENT_REQUIRED",
            message: "CHOCO 잔액이 부족합니다. 충전 후 다시 시도해 주세요.",
        },
        {
            status: 402,
            headers: {
                "X-x402-Token": token,
                "X-x402-Invoice": JSON.stringify(invoice),
                "Access-Control-Expose-Headers": "X-x402-Token, X-x402-Invoice",
            },
        }
    );
}
