import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { connect, providers, utils } from "near-api-js";
import { eq, sql } from "drizzle-orm";
import BigNumber from "bignumber.js";

const NEAR_RPC_ENDPOINT = "https://rpc.mainnet.near.org";
const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_ENDPOINT });

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

    try {
        const { txHash, paymentId, accountId } = await request.json();

        if (!txHash || !paymentId || !accountId) {
            return Response.json({ error: "Missing required fields (txHash, paymentId, accountId)" }, { status: 400 });
        }

        const paymentRecord = await db.query.payment.findFirst({
            where: eq(schema.payment.id, paymentId),
        });

        if (!paymentRecord || paymentRecord.userId !== session.user.id) {
            return Response.json({ error: "Payment record not found" }, { status: 404 });
        }

        if (paymentRecord.status === "COMPLETED") {
            return Response.json({ success: true, message: "Already completed" });
        }

        // 1. NEAR 트랜잭션 상태 확인
        try {
            const result = await provider.txStatus(txHash, accountId);

            // 2. 트랜잭션 성공 여부 및 수신자 확인
            const isSuccess = (result.status as any).SuccessValue !== undefined || (result.status as any).SuccessReceiptId !== undefined;
            const receiverId = result.transaction.receiver_id;
            const expectedReceiver = process.env.NEAR_RECEIVER_WALLET;

            if (!isSuccess || receiverId !== expectedReceiver) {
                return Response.json({ error: "Invalid transaction status or receiver" }, { status: 400 });
            }

            // 3. 금액 확인 (NEAR는 10^24 yoctoNEAR 단위)
            const actions = result.transaction.actions;
            const transferAction = actions.find((a: any) => a.Transfer);
            if (!transferAction) {
                return Response.json({ error: "No transfer action found in transaction" }, { status: 400 });
            }

            const transfferedYocto = transferAction.Transfer.deposit;
            const transfferedNear = new BigNumber(utils.format.formatNearAmount(transfferedYocto));
            const expectedNear = new BigNumber(paymentRecord.cryptoAmount || "0");

            // 0.1% 허용 오차 (환율 변동 대비)
            if (transfferedNear.lt(expectedNear.multipliedBy(0.999))) {
                return Response.json({ error: "Insufficient amount transferred" }, { status: 400 });
            }

            // 4. 검증 성공 시 DB 업데이트 및 크레딧 지급
            await db.transaction(async (tx) => {
                await tx.update(schema.payment)
                    .set({
                        status: "COMPLETED",
                        txHash: txHash,
                        updatedAt: new Date(),
                    })
                    .where(eq(schema.payment.id, paymentId));

                await tx.update(schema.user)
                    .set({
                        credits: sql`${schema.user.credits} + ${paymentRecord.creditsGranted}`
                    })
                    .where(eq(schema.user.id, paymentRecord.userId));
            });

            console.info(`[NearPay] Payment COMPLETED: user=${paymentRecord.userId}, hash=${txHash}`);

            return Response.json({ success: true, status: "COMPLETED" });

        } catch (txError) {
            console.error("NEAR tx fetch error:", txError);
            return Response.json({ error: "Failed to verify transaction on NEAR network" }, { status: 400 });
        }

    } catch (error) {
        console.error("NEAR verification error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
