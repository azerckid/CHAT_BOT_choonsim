
import { keyStores, connect, Contract } from "near-api-js";
import { BigNumber } from "bignumber.js";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load Env
const envConfig = dotenv.parse(fs.readFileSync(".env.development"));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function main() {
    console.log("--- Starting Forensic Audit of Lost Tokens ---");

    const networkId = process.env.NEAR_NETWORK_ID || "testnet";
    const nodeUrl = process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org";
    const contractId = process.env.NEAR_CHOCO_TOKEN_CONTRACT!;
    const adminAccountId = process.env.NEAR_SERVICE_ACCOUNT_ID!;

    // 로그에서 식별된 "접근 불가능(키 유실)" 계정 목록
    const suspectAccounts = [
        "pqgfd2mfcdvqcvmk.rogulus.testnet",
        "namy7w4uyyjqqc4j.rogulus.testnet",
        "test7ne6allt.rogulus.testnet",
        "testatwaelw0.rogulus.testnet",
        "testksp45ffx.rogulus.testnet",
        "test6cc0ysc7.rogulus.testnet",
        "testorek95we.rogulus.testnet"
    ];

    const keyStore = new keyStores.InMemoryKeyStore();
    const config = { networkId, keyStore, nodeUrl, headers: {} };
    const near = await connect(config);
    const viewAccount = await near.account(adminAccountId); // Any account can view

    console.log(`Token Contract: ${contractId}`);
    console.log("Querying balances for lost accounts...\n");

    let totalLost = new BigNumber(0);
    let foundCount = 0;

    for (const accountId of suspectAccounts) {
        try {
            // ft_balance_of 호출 (View Function)
            const balanceRaw: string = await viewAccount.viewFunction({
                contractId,
                methodName: "ft_balance_of",
                args: { account_id: accountId }
            });

            const balance = new BigNumber(balanceRaw).dividedBy(new BigNumber(10).pow(18));

            if (balance.gt(0)) {
                console.log(`❌ [LOCKED] ${accountId}: ${balance.toFixed(0)} CHOCO`);
                totalLost = totalLost.plus(balance);
                foundCount++;
            } else {
                console.log(`   [EMPTY]  ${accountId}`);
            }

        } catch (error) {
            console.log(`   [ERROR]  ${accountId}: Account likely deleted or contract error`);
        }
    }

    console.log("\n--- Audit Result ---");
    console.log(`Accounts checking out with balance: ${foundCount}`);
    console.log(`Total Locked (Lost) Amount: ${totalLost.toFixed(0)} CHOCO`);

    // Treasury Balance Check (Optional comparison)
    // console.log(`Treasury Balance: 999,994,500 (Known)`);
    // console.log(`Gap to Explain: 5,500`);
}

main().catch(console.error);
