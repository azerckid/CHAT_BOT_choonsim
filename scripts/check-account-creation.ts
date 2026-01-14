
import * as nearAPI from "near-api-js";
const { connect, keyStores } = nearAPI;

async function main() {
    const networkId = "testnet";
    const nodeUrl = "https://rpc.testnet.fastnear.com";
    const accountId = "pqgfd2mfcdvqcvmk.rogulus.testnet";

    const keyStore = new keyStores.InMemoryKeyStore();
    const near = await connect({ networkId, nodeUrl, keyStore });

    // 이 노드는 아카이브 노드이어야 과거 트랜잭션 조회가 잘 됨.
    // fastnear RPC는 보통 최신 상태 위주임.

    console.log(`Checking creation of ${accountId}...`);
    // NEAR RPC does not easily support "find creator" without indexing.
    // But we know the parent is rogulus.testnet.
}

main().catch(console.error);
