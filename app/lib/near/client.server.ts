
import { connect, keyStores, KeyPair, type Near } from "near-api-js";

let nearConnection: Near | null = null;

export async function getNearConnection() {
    if (nearConnection) return nearConnection;

    const networkId = process.env.NEAR_NETWORK_ID || "testnet";
    const keyStore = new keyStores.InMemoryKeyStore();

    // 서비스 계정 키 자동 로드 (존재할 경우)
    if (process.env.NEAR_SERVICE_ACCOUNT_ID && process.env.NEAR_SERVICE_PRIVATE_KEY) {
        const keyPair = KeyPair.fromString(process.env.NEAR_SERVICE_PRIVATE_KEY);
        await keyStore.setKey(networkId, process.env.NEAR_SERVICE_ACCOUNT_ID, keyPair);
    }

    const config = {
        networkId,
        nodeUrl: process.env.NEAR_NODE_URL || "https://rpc.testnet.fastnear.com",
        keyStore,
        headers: {},
    };

    nearConnection = await connect(config);
    return nearConnection;
}

export const NEAR_CONFIG = {
    networkId: process.env.NEAR_NETWORK_ID || "testnet",
    nodeUrl: process.env.NEAR_NODE_URL || "https://rpc.testnet.fastnear.com",
    chocoTokenContract: process.env.CHOCO_TOKEN_CONTRACT || "choco.token.primitives.testnet",
    serviceAccountId: process.env.NEAR_SERVICE_ACCOUNT_ID || "rogulus.testnet",
};
