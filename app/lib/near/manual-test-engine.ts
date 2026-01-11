
import dotenv from "dotenv";
import path from "path";

// Load .env.development explicitly at the very top
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function main() {
    // Dynamically import everything else after env is loaded
    const { db } = await import("../db.server");
    const { user: userTable } = await import("../../db/schema");
    const { eq } = await import("drizzle-orm");
    const { runDepositMonitoring } = await import("./deposit-engine.server");
    const { getNearConnection, NEAR_CONFIG } = await import("./client.server");
    const { BigNumber } = await import("bignumber.js");
    const nearAPI = await import("near-api-js");
    const { decrypt } = await import("./key-encryption.server");

    const { utils, KeyPair } = nearAPI;

    console.log("--- Starting Integrated NEAR/CHOCO/X402 Sync Test ---");

    try {
        const { ensureNearWallet } = await import("./wallet.server");
        const { nanoid } = await import("nanoid");

        // 1. Create a fresh test user
        const testUserId = `test_${nanoid(8)}`;
        console.log(`[Test] Creating fresh test user: ${testUserId}`);

        await db.insert(userTable).values({
            id: testUserId,
            email: `${testUserId}@example.com`,
            credits: 0,
            chocoBalance: "0",
            nearLastBalance: "0",
            updatedAt: new Date(),
        });

        // 2. Ensure NEAR Wallet
        console.log(`[Test] Ensuring NEAR wallet...`);
        const nearAccountId = await ensureNearWallet(testUserId);

        const testUser = (await db.select().from(userTable).where(eq(userTable.id, testUserId)))[0];
        console.log(`[Test] Wallet: ${testUser.nearAccountId}`);

        // 3. Simulate Deposit Sync
        console.log(`[Test] Simulating deposit detection...`);
        // The sub-account already has ~0.1 NEAR from creation. 
        // We set DB last balance to 0, so runDepositMonitoring will see the 0.1 NEAR as a new deposit.
        await runDepositMonitoring();

        const userAfterDeposit = (await db.select().from(userTable).where(eq(userTable.id, testUserId)))[0];
        console.log(`[Test] After Deposit - Credits: ${userAfterDeposit.credits}, CHOCO: ${userAfterDeposit.chocoBalance}`);

        if (Number(userAfterDeposit.credits) > 0 && new BigNumber(userAfterDeposit.chocoBalance).gt(0)) {
            console.log("✅ Deposit Sync Success.");
        } else {
            throw new Error("Deposit Sync Failed.");
        }

        // 4. Simulate X402 Payment
        console.log(`\n[Test] Starting X402 Payment Simulation...`);
        const { createX402Invoice, verifyX402Payment } = await import("./x402.server");

        const amountUSD = 0.01;
        const invoiceRes = await createX402Invoice(testUserId, amountUSD);
        console.log(`[Test] Invoice Created: ${invoiceRes.invoice.amount} CHOCO`);

        // Reconnect to ensure signer is fresh
        // B. Perform Gasless On-Chain Transfer (The "User Action" via Relayer)
        const privateKey = decrypt(testUser.nearPrivateKey!);

        console.log(`[Test] Signing gasless ft_transfer for payment (Relayed by ${NEAR_CONFIG.serviceAccountId})...`);
        const { sendGaslessChocoToken } = await import("./token.server");

        const transferResult = await sendGaslessChocoToken(
            testUser.nearAccountId!,
            privateKey as string,
            invoiceRes.invoice.recipient,
            new BigNumber(invoiceRes.invoice.amount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0)
        );

        const txHash = (transferResult as any).transaction.hash;
        console.log(`[Test] Gasless Payment Success. Tx: ${txHash}`);

        // 5. Verify Mirroring
        console.log(`[Test] Verifying Payment in DB...`);
        await verifyX402Payment(invoiceRes.token, txHash);

        const finalUser = (await db.select().from(userTable).where(eq(userTable.id, testUserId)))[0];
        console.log(`[Test] Final DB - Credits: ${finalUser.credits}, CHOCO: ${finalUser.chocoBalance}`);

        const creditDiff = userAfterDeposit.credits! - finalUser.credits!;
        const chocoDiff = new BigNumber(userAfterDeposit.chocoBalance).minus(new BigNumber(finalUser.chocoBalance)).toNumber();

        console.log(`[Test] Total Deducted - Credits: ${creditDiff}, CHOCO: ${chocoDiff}`);

        if (creditDiff > 0 && chocoDiff > 0) {
            console.log("✅ Integrated Test PASSED: Dual Reduction Confirmed.");
        } else {
            throw new Error("Integrated Test FAILED: Assets not synced correctly.");
        }

        console.log("\n--- COMPLETE ---");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

main().catch(console.error);
