
import * as nearAPI from "near-api-js";
const { connect, keyStores, KeyPair } = nearAPI;
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

async function main() {
    const networkId = process.env.NEAR_NETWORK_ID || "testnet";
    const nodeUrl = process.env.NEAR_NODE_URL || "https://rpc.testnet.fastnear.com";

    // 서비스 계정 (마스터)
    const masterAccountId = process.env.NEAR_SERVICE_ACCOUNT_ID || "rogulus.testnet";
    const masterPrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY!;

    // 대상 계정 및 추가할 공개키 (DB에 저장된 키)
    const targetAccountId = "pqgfd2mfcdvqcvmk.rogulus.testnet";
    const publicKeyToAdd = "ed25519:6NXJ94VFMVaM95ooRjaA66wuY7Kh2Jpt3skZmy6ezxZN";

    const keyStore = new keyStores.InMemoryKeyStore();
    await keyStore.setKey(networkId, masterAccountId, KeyPair.fromString(masterPrivateKey as any));

    const near = await connect({ networkId, nodeUrl, keyStore });
    const masterAccount = await near.account(masterAccountId);

    console.log(`Adding FullAccess key to ${targetAccountId} using master account ${masterAccountId}...`);

    // 마스터 계정의 권한으로 서브계정에 키 추가
    // 서브계정의 생성자와 마스터가 같으므로 가능하거나, 
    // 또는 서브계정 자체가 마스터 소유인 경우.
    // 사실 NEAR에서는 subaccount를 만들 때 master가 sign해서 만들지만, 
    // 나중에 키를 추가하려면 targetAccountId의 가스비와 권한이 필요함.

    // 만약 우리가 targetAccountId의 가스비는 마스터가 낼 수 없으므로 
    // targetAccountId로 sign해야 함. 하지만 키가 없다.

    // 아! 계정 생성 시에 키가 mismatch 된 것이 문제이므로 
    // 계정을 삭제하고 다시 만들거나, 마스터가 delete_account 후 re-create 할 수 있음.

    console.log("Attempting to add key via targetAccount sign... (might fail if no key yet)");
    // ...
}

main().catch(console.error);
