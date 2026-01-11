
import dotenv from "dotenv";
import path from "path";

// Load .env.development explicitly at the very top
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function main() {
    // Dynamically import everything else after env is loaded
    const { db } = await import("../db.server");
    const { user: userTable } = await import("../../db/schema");
    const { sql, eq } = await import("drizzle-orm");
    const { runDepositMonitoring } = await import("./deposit-engine.server");
    const { getNearConnection } = await import("./client.server");
    const { BigNumber } = await import("bignumber.js");
    const nearAPI = await import("near-api-js");

    const { utils } = nearAPI;

    console.log("--- Starting Deposit Engine Manual Test ---");

    try {
        // 1. Find a test user with a NEAR account
        const users = await db.select().from(userTable).where(sql`${userTable.nearAccountId} IS NOT NULL`).limit(1);

        if (users.length === 0) {
            console.error("No user with NEAR account found in DB.");
            return;
        }

        const testUser = users[0];
        console.log(`Using Test User: ${testUser.id} (${testUser.nearAccountId})`);
        console.log(`Current DB Balance: NEAR ${testUser.nearLastBalance || '0'}, CHOCO ${testUser.chocoBalance || '0'}`);

        // 2. Check actual NEAR balance on chain
        const near = await getNearConnection();
        const account = await near.account(testUser.nearAccountId!);
        const state = await account.getState() as any;
        console.log("Account State (parsed):", state);

        const currentOnChainBalance = (state.amount !== undefined ? state.amount : state.balance?.total).toString();

        console.log(`Actual On-Chain Balance: ${utils.format.formatNearAmount(currentOnChainBalance)} NEAR`);

        // 3. To simulate a deposit
        if (new BigNumber(currentOnChainBalance).gt(new BigNumber(0))) {
            const simulatedLastBalance = new BigNumber(currentOnChainBalance).minus(new BigNumber(utils.format.parseNearAmount("0.1")!)).toString();

            console.log(`Simulating deposit: Setting DB nearLastBalance to ${utils.format.formatNearAmount(simulatedLastBalance)} NEAR`);

            await db.update(userTable).set({
                nearLastBalance: simulatedLastBalance
            }).where(eq(userTable.id, testUser.id));

            console.log("DB updated. Running engine...");

            // 4. Run the monitoring engine
            await runDepositMonitoring();

            // 5. Check results
            const updatedUser = (await db.select().from(userTable).where(eq(userTable.id, testUser.id)))[0];
            console.log("--- Test Results ---");
            console.log(`New DB Balance: NEAR ${updatedUser.nearLastBalance}, CHOCO ${updatedUser.chocoBalance}`);

            const chocoDiff = new BigNumber(updatedUser.chocoBalance || "0").minus(new BigNumber(testUser.chocoBalance || "0"));
            console.log(`CHOCO Amount Increased: ${chocoDiff.toString()}`);
        } else {
            console.log("On-chain balance is 0. Please deposit some NEAR to the test account first.");
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

main().catch(console.error);
