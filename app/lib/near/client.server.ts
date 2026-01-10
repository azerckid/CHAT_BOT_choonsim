import { connect, keyStores, type Near } from "near-api-js";

let nearConnection: Near | null = null;

export async function getNearConnection() {
    if (nearConnection) return nearConnection;

    const config = {
        networkId: process.env.NEAR_NETWORK_ID || "testnet",
        nodeUrl: process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org",
        keyStore: new keyStores.InMemoryKeyStore(), // 서버 사이드에서는 필요 시점에 키를 주입하거나 폴링용으로만 사용
        headers: {},
    };

    nearConnection = await connect(config);
    return nearConnection;
}

export const NEAR_CONFIG = {
    networkId: process.env.NEAR_NETWORK_ID || "testnet",
    nodeUrl: process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org",
    chocoTokenContract: process.env.CHOCO_TOKEN_CONTRACT || "choco.token.primitives.testnet",
    serviceAccountId: process.env.NEAR_SERVICE_ACCOUNT_ID || "rogulus.testnet",
};
