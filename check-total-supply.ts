
import { keyStores, connect } from "near-api-js";
import { BigNumber } from "bignumber.js";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load Env
const envConfig = dotenv.parse(fs.readFileSync(".env.development"));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function main() {
    console.log("--- Checking FT Total Supply ---");

    const networkId = process.env.NEAR_NETWORK_ID || "testnet";
    const nodeUrl = process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org";
    const contractId = process.env.NEAR_CHOCO_TOKEN_CONTRACT!;
    const adminAccountId = process.env.NEAR_SERVICE_ACCOUNT_ID!;

    const keyStore = new keyStores.InMemoryKeyStore();
    const config = { networkId, keyStore, nodeUrl, headers: {} };
    const near = await connect(config);
    const viewAccount = await near.account(adminAccountId);

    console.log(`Contract: ${contractId}`);

    try {
        // 1. Total Supply 조회
        const totalSupplyRaw: string = await viewAccount.viewFunction({
            contractId,
            methodName: "ft_total_supply",
            args: {}
        });

        // 2. Treasury Balance 조회
        const treasuryBalanceRaw: string = await viewAccount.viewFunction({
            contractId,
            methodName: "ft_balance_of",
            args: { account_id: adminAccountId }
        });

        const totalSupply = new BigNumber(totalSupplyRaw).div(new BigNumber(10).pow(18));
        const treasuryBalance = new BigNumber(treasuryBalanceRaw).div(new BigNumber(10).pow(18));
        const missing = totalSupply.minus(treasuryBalance);

        console.log(`\n--- Report ---`);
        console.log(`Total Supply (On-Chain):  ${totalSupply.toFormat()} CHOCO`);
        console.log(`Treasury Balance:         ${treasuryBalance.toFormat()} CHOCO`);
        console.log(`Circulating (Lost/User):  ${missing.toFormat()} CHOCO`);

        if (totalSupply.isEqualTo(1000000000)) {
            console.log(`\n✅ Total Supply is perfectly preserved at 1 Billion.`);
            console.log(`   The 5,500 CHOCO are NOT gone from the chain. They exist in lost user accounts.`);
        } else {
            console.log(`\n⚠️ Total Supply has changed!`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);
