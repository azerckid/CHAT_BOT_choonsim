
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function fullOnChainRecovery() {
    const { db } = await import("../db.server");
    const { user: userTable } = await import("../../db/schema");
    const { eq } = await import("drizzle-orm");
    const { getNearConnection, NEAR_CONFIG } = await import("./client.server");
    const { decrypt } = await import("./key-encryption.server");
    const { BigNumber } = await import("bignumber.js");
    const nearAPI = await import("near-api-js");
    const { KeyPair } = nearAPI;

    // 1. 모든 NEAR 계정 유저 조회
    const allUsers = await db.select().from(userTable);

    console.log(`--- Starting Full ON-CHAIN CHOCO Recovery for ${allUsers.length} potential users ---`);

    const near = await getNearConnection();
    const treasuryId = NEAR_CONFIG.serviceAccountId;

    for (const user of allUsers) {
        if (!user.nearAccountId || !user.nearPrivateKey) continue;

        try {
            // A. 온체인에서 직접 잔액 조회
            const balanceRaw = await near.connection.provider.query({
                request_type: "call_function",
                finality: "final",
                account_id: NEAR_CONFIG.chocoTokenContract,
                method_name: "ft_balance_of",
                args_base64: Buffer.from(JSON.stringify({ account_id: user.nearAccountId })).toString("base64")
            }).then((res: any) => JSON.parse(Buffer.from(res.result).toString())).catch(() => "0");

            if (new BigNumber(balanceRaw).isZero()) {
                // DB 잔액이 0이 아니면 0으로 동기화
                if (user.chocoBalance !== "0") {
                    await db.update(userTable).set({ chocoBalance: "0" }).where(eq(userTable.id, user.id));
                }
                continue;
            }

            console.log(`\nFound balance on ${user.nearAccountId}: ${new BigNumber(balanceRaw).dividedBy(new BigNumber(10).pow(18)).toString()} CHOCO`);

            // B. 회수 시도
            const privateKey = decrypt(user.nearPrivateKey);
            const keyPair = KeyPair.fromString(privateKey as any);
            await near.connection.signer.keyStore.setKey(NEAR_CONFIG.networkId, user.nearAccountId, keyPair);

            const account = await near.account(user.nearAccountId);

            await account.functionCall({
                contractId: NEAR_CONFIG.chocoTokenContract,
                methodName: "ft_transfer",
                args: {
                    receiver_id: treasuryId,
                    amount: balanceRaw,
                    memo: "Full On-Chain Cleanup"
                },
                gas: BigInt("30000000000000"),
                attachedDeposit: BigInt(1)
            });

            console.log(`Successfully recovered from ${user.nearAccountId}`);

            // C. DB 업데이트
            await db.update(userTable).set({
                chocoBalance: "0",
                updatedAt: new Date()
            }).where(eq(userTable.id, user.id));

        } catch (err: any) {
            // 키가 없거나 실패한 경우
            console.log(`Skipping ${user.nearAccountId}: ${err.message || 'Key mismatch'}`);
            // 만약 키는 없는데 DB 수치가 음수이거나 잘못된 경우 0으로 강제 세팅 (수치 관리용)
            await db.update(userTable).set({ chocoBalance: "0" }).where(eq(userTable.id, user.id));
        }
    }

    console.log("\n--- Full On-Chain Cleanup Finished ---");
}

fullOnChainRecovery().catch(console.error);
