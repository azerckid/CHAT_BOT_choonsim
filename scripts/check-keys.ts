
import * as nearAPI from "near-api-js";
const { connect, keyStores } = nearAPI;

async function main() {
    const networkId = "testnet";
    const nodeUrl = "https://rpc.testnet.fastnear.com";
    const accountId = "pqgfd2mfcdvqcvmk.rogulus.testnet";

    const keyStore = new keyStores.InMemoryKeyStore();
    const near = await connect({ networkId, nodeUrl, keyStore });
    const account = await near.account(accountId);

    try {
        const keys = await account.getAccessKeys();
        console.log(`Access Keys for ${accountId}:`);
        keys.forEach((k: any) => {
            console.log(`- Public Key: ${k.public_key}, Permission: ${JSON.stringify(k.access_key.permission)}`);
        });
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
}

main().catch(console.error);
