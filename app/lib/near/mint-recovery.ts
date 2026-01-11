
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function mintRecovery() {
    const { getNearConnection, NEAR_CONFIG } = await import("./client.server");
    const { BigNumber } = await import("bignumber.js");
    const nearAPI = await import("near-api-js");
    const { KeyPair } = nearAPI;

    const near = await getNearConnection();
    const serviceAccountId = NEAR_CONFIG.serviceAccountId; // rogulus.testnet
    const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;

    if (!servicePrivateKey) {
        throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing");
    }

    const serviceKeyPair = KeyPair.fromString(servicePrivateKey as any);
    await near.connection.signer.keyStore.setKey(NEAR_CONFIG.networkId, serviceAccountId, serviceKeyPair);
    const serviceAccount = await near.account(serviceAccountId);

    // Mint 1500 CHOCO (1500 * 10^18)
    const amountToMint = new BigNumber(1500).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

    console.log(`--- Minting 1500 CHOCO to recover total supply ---`);
    console.log(`Target: ${serviceAccountId}`);

    try {
        // choco.token.primitives.testnet 컨트랙트의 mint 함수 호출
        // 관리자 권한(rogulus.testnet)으로 실행
        const result = await serviceAccount.functionCall({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "ft_mint",
            args: {
                receiver_id: serviceAccountId,
                amount: amountToMint,
                memo: "Supply Recovery from Test Lock"
            },
            gas: BigInt("30000000000000")
        });

        console.log(`Success! Minted 1500 CHOCO. Tx Hash: ${result.transaction.hash}`);
    } catch (error: any) {
        console.error("Minting failed:");
        if (error.transaction_outcome) {
            console.error("Tx Status:", JSON.stringify(error.transaction_outcome.outcome.status, null, 2));
        }
        console.error(error);
    }
}

mintRecovery().catch(console.error);
