
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function recoverChoco() {
    const { db } = await import("../db.server");
    const { user: userTable } = await import("../../db/schema");
    const { eq } = await import("drizzle-orm");
    const { getNearConnection, NEAR_CONFIG } = await import("./client.server");
    const { decrypt } = await import("./key-encryption.server");
    const { BigNumber } = await import("bignumber.js");
    const nearAPI = await import("near-api-js");
    const { KeyPair } = nearAPI;

    // 1. Find the test user
    const testUserId = "test_ZqyK9E8F"; // From previous result
    const user = (await db.select().from(userTable).where(eq(userTable.id, testUserId)))[0];

    if (!user || !user.nearAccountId || !user.nearPrivateKey) {
        console.error("Test user or wallet info not found in DB.");
        return;
    }

    console.log(`Recovering CHOCO from ${user.nearAccountId}...`);

    try {
        const near = await getNearConnection();
        const privateKey = decrypt(user.nearPrivateKey);
        const keyPair = KeyPair.fromString(privateKey as any);

        // Configure signer for the user account
        await near.connection.signer.keyStore.setKey(NEAR_CONFIG.networkId, user.nearAccountId, keyPair);

        const account = await near.account(user.nearAccountId);
        const treasuryId = NEAR_CONFIG.serviceAccountId; // rogulus.testnet

        // Choco amount to recover (500 CHOCO)
        const amountToRecover = new BigNumber(user.chocoBalance || "500").multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

        console.log(`Sending ${user.chocoBalance} CHOCO back to ${treasuryId}...`);

        const result = await account.functionCall({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "ft_transfer",
            args: {
                receiver_id: treasuryId,
                amount: amountToRecover,
                memo: "CHOCO Recovery from Test"
            },
            gas: BigInt("30000000000000"),
            attachedDeposit: BigInt(1)
        });

        console.log(`Recovery Successful! Tx Hash: ${result.transaction.hash}`);

        // Update DB
        await db.update(userTable).set({
            chocoBalance: "0",
            updatedAt: new Date()
        }).where(eq(userTable.id, testUserId));

        console.log(`User ${testUserId} balance updated to 0 in DB.`);

    } catch (error) {
        console.error("Recovery failed:", error);
    }
}

recoverChoco().catch(console.error);
