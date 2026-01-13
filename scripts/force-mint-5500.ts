
import { keyStores, connect, KeyPair } from "near-api-js";
import { BigNumber } from "bignumber.js";
import * as dotenv from "dotenv";
import * as fs from "fs";

// 1. Load Env
const envConfig = dotenv.parse(fs.readFileSync(".env.development"));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function main() {
    console.log("--- Starting Correction Mint (5,500 CHOCO) ---");

    const networkId = process.env.NEAR_NETWORK_ID || "testnet";
    const nodeUrl = process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org";
    const adminAccountId = process.env.NEAR_SERVICE_ACCOUNT_ID!;
    const adminPrivateKey = process.env.NEAR_SERVICE_ACCOUNT_PRIVATE_KEY!;
    const contractId = process.env.NEAR_CHOCO_TOKEN_CONTRACT!;

    console.log(`Target: ${adminAccountId}`);

    // 2. Setup KeyStore & Connection (Explicit)
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(adminPrivateKey);
    await keyStore.setKey(networkId, adminAccountId, keyPair);

    const config = { networkId, keyStore, nodeUrl, headers: {} };
    const near = await connect(config);
    const adminAccount = await near.account(adminAccountId);

    // 3. Mint 5,500 CHOCO to restore 1B
    const amount = "5500";
    const amountYocto = new BigNumber(amount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

    console.log(`Minting ${amount} CHOCO...`);

    try {
        const result = await adminAccount.functionCall({
            contractId,
            methodName: "ft_mint",
            args: {
                account_id: adminAccountId,
                amount: amountYocto,
                memo: "Restore Treasury Balance to 1B"
            },
            gas: BigInt("30000000000000"),
            attachedDeposit: BigInt("1")
        });

        console.log("✅ Mint Success!");
        console.log(`Tx: ${result.transaction.hash}`);
        console.log("Treasury should now be 1,000,000,000 CHOCO.");

    } catch (error) {
        console.error("❌ Mint Failed:", error);
    }
}

main().catch(console.error);
