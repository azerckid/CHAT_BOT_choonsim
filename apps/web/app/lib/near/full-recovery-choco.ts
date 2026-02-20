
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function fullRecovery() {
    const { db } = await import("../db.server");
    const { user: userTable } = await import("../../db/schema");
    const { sql, eq } = await import("drizzle-orm");
    const { getNearConnection, NEAR_CONFIG } = await import("./client.server");
    const { decrypt } = await import("./key-encryption.server");
    const { BigNumber } = await import("bignumber.js");
    const nearAPI = await import("near-api-js");
    const { KeyPair } = nearAPI;

    // 1. CHOCO 잔액이 있는 모든 사용자 조회
    const usersWithBalance = await db.select().from(userTable).where(sql`CAST(chocoBalance AS REAL) > 0`);

    if (usersWithBalance.length === 0) {
        console.log("No balances found to recover.");
        return;
    }

    console.log(`--- Starting Full CHOCO Recovery for ${usersWithBalance.length} users ---`);

    const near = await getNearConnection();
    const treasuryId = NEAR_CONFIG.serviceAccountId;

    for (const user of usersWithBalance) {
        if (!user.nearAccountId || !user.nearPrivateKey) {
            console.log(`Skipping user ${user.id}: Missing NEAR info`);
            continue;
        }

        try {
            const privateKey = decrypt(user.nearPrivateKey);
            const keyPair = KeyPair.fromString(privateKey as any);
            await near.connection.signer.keyStore.setKey(NEAR_CONFIG.networkId, user.nearAccountId, keyPair);

            const account = await near.account(user.nearAccountId);

            // 실제 온체인 잔액 확인 (DB와 다를 수 있으므로)
            const balanceRaw = await account.viewFunction({
                contractId: NEAR_CONFIG.chocoTokenContract,
                methodName: "ft_balance_of",
                args: { account_id: user.nearAccountId }
            });

            if (new BigNumber(balanceRaw).isZero()) {
                console.log(`User ${user.nearAccountId} has 0 on-chain balance. Syncing DB...`);
                await db.update(userTable).set({ chocoBalance: "0" }).where(eq(userTable.id, user.id));
                continue;
            }

            console.log(`Recovering ${new BigNumber(balanceRaw).dividedBy(new BigNumber(10).pow(18)).toString()} CHOCO from ${user.nearAccountId}...`);

            await account.functionCall({
                contractId: NEAR_CONFIG.chocoTokenContract,
                methodName: "ft_transfer",
                args: {
                    receiver_id: treasuryId,
                    amount: balanceRaw,
                    memo: "Full CHOCO Recovery to 1B"
                },
                gas: BigInt("30000000000000"),
                attachedDeposit: BigInt(1)
            });

            console.log(`Successfully recovered from ${user.nearAccountId}`);

            // DB 업데이트
            await db.update(userTable).set({
                chocoBalance: "0",
                updatedAt: new Date()
            }).where(eq(userTable.id, user.id));

        } catch (err) {
            console.error(`Failed to recover from ${user.nearAccountId}:`, err);
        }
    }

    console.log("--- Full Recovery Process Finished ---");
}

fullRecovery().catch(console.error);
