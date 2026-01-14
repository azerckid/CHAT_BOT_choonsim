
import * as nearAPI from "near-api-js";
import { inspect } from "util";
const { connect, keyStores } = nearAPI;

async function main() {
    const networkId = "testnet";
    const nodeUrl = "https://rpc.testnet.fastnear.com";
    const accountId = "pqgfd2mfcdvqcvmk.rogulus.testnet";

    const keyStore = new keyStores.InMemoryKeyStore();
    const near = await connect({ networkId, nodeUrl, keyStore });
    const account = await near.account(accountId);

    try {
        const state = await account.getState() as any;
        console.log(`Account State for ${accountId}:`);
        console.log(inspect(state, { depth: null, colors: true }));
    } catch (e: any) {
        console.log(`Error checking account ${accountId}: ${e.message}`);
    }
}

main().catch(console.error);
