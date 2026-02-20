import { connect, KeyPair, keyStores, utils } from "near-api-js";
import { NEAR_CONFIG } from "./client.server";

const STORAGE_DEPOSIT_AMOUNT = "0.00125"; // NEAR (NEP-145 standard for most FTs)

/**
 * 신규 사용자가 CHOCO 토큰을 수령할 수 있도록 서비스 계정을 통해 Storage Deposit을 대신 납부합니다.
 * @param userNearAccountId 사용자의 NEAR 계정 ID
 */
export async function ensureStorageDeposit(userNearAccountId: string) {
    const networkId = NEAR_CONFIG.networkId;
    const nodeUrl = NEAR_CONFIG.nodeUrl;
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    const privateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;

    if (!privateKey) {
        console.warn("NEAR_SERVICE_PRIVATE_KEY is not set. Skipping storage deposit.");
        return { success: false, reason: "No private key" };
    }

    const keyStore = new keyStores.InMemoryKeyStore();
    // KeyPair.fromString() expects a string starting with ed25519:
    const keyPair = KeyPair.fromString(privateKey as any);
    await keyStore.setKey(networkId, serviceAccountId, keyPair);

    const near = await connect({
        networkId,
        nodeUrl,
        keyStore,
    });

    const serviceAccount = await near.account(serviceAccountId);

    try {
        console.log(`Paying storage deposit for ${userNearAccountId} on ${NEAR_CONFIG.chocoTokenContract}...`);

        // ft_storage_deposit 호출
        const result = await serviceAccount.functionCall({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "storage_deposit",
            args: {
                account_id: userNearAccountId,
                registration_only: false,
            },
            gas: BigInt("30000000000000"), // 30 TGas
            attachedDeposit: BigInt(utils.format.parseNearAmount(STORAGE_DEPOSIT_AMOUNT)!),
        });

        console.log(`Storage deposit successful for ${userNearAccountId}:`, result.transaction.hash);
        return { success: true, txHash: result.transaction.hash };
    } catch (error) {
        console.error(`Failed to pay storage deposit for ${userNearAccountId}:`, error);

        // 이미 등록된 경우 처리
        if (error instanceof Error && error.message.includes("Already registered")) {
            return { success: true, message: "Already registered" };
        }

        return { success: false, error };
    }
}
