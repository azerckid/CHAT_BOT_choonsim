
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function emergencyRecovery() {
    const { db } = await import("../db.server");
    const { user: userTable } = await import("../../db/schema");
    const { eq, sql } = await import("drizzle-orm");
    const { getNearConnection, NEAR_CONFIG } = await import("./client.server");
    const { decrypt, encrypt } = await import("./key-encryption.server");
    const { BigNumber } = await import("bignumber.js");
    const nearAPI = await import("near-api-js");
    const { KeyPair, transactions } = nearAPI;

    const near = await getNearConnection();
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;

    if (!servicePrivateKey) {
        throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing");
    }

    const serviceKeyPair = KeyPair.fromString(servicePrivateKey as any);
    await near.connection.signer.keyStore.setKey(NEAR_CONFIG.networkId, serviceAccountId, serviceKeyPair);
    const serviceAccount = await near.account(serviceAccountId);

    // 1. Target Accounts
    const targetAccounts = [
        { id: "pQgfd2MfcDVQCVMkXTe9gfJ5TVUZWSpk", nearId: "pqgfd2mfcdvqcvmk.rogulus.testnet" },
        { id: "NAmy7w4uYyjqqC4jCgujcAdXboE8t6AN", nearId: "namy7w4uyyjqqc4j.rogulus.testnet" },
        { id: "test_ZqyK9E8F", nearId: "testzqyk9e8f.rogulus.testnet" }
    ];

    console.log("--- Emergency CHOCO Recovery via Service Account ---");

    for (const target of targetAccounts) {
        try {
            console.log(`\nProcessing Account: ${target.nearId}`);

            // A. Create a NEW KeyPair to gain control
            const newKeyPair = KeyPair.fromRandom("ed25519");
            const newPublicKey = newKeyPair.getPublicKey().toString();

            console.log(`Adding new full access key: ${newPublicKey}`);

            // B. Add the new key via Service Account (since it's a sub-account, service account has some control if it created it or via transactions)
            // Wait, standard NEAR sub-accounts are NOT controlled by parents unless specific keys are added.
            // But we created them using serviceAccount.functionCall("create_account").
            // If we don't have the original keys, the ONLY way is if we have them in DB.

            // Let's try to find ANY valid key in the DB first.
            const userInDb = (await db.select().from(userTable).where(eq(userTable.id, target.id)))[0];

            // Re-check balance first
            const balanceRaw = await near.connection.provider.query({
                request_type: "call_function",
                finality: "final",
                account_id: NEAR_CONFIG.chocoTokenContract,
                method_name: "ft_balance_of",
                args_base64: Buffer.from(JSON.stringify({ account_id: target.nearId })).toString("base64")
            }).then((res: any) => JSON.parse(Buffer.from(res.result).toString()));

            if (new BigNumber(balanceRaw).isZero()) {
                console.log(`Balance is already 0 for ${target.nearId}. Updating DB...`);
                await db.update(userTable).set({ chocoBalance: "0" }).where(eq(userTable.id, target.id));
                continue;
            }

            console.log(`On-chain Balance: ${new BigNumber(balanceRaw).dividedBy(new BigNumber(10).pow(18)).toString()} CHOCO`);

            // If we have a key in DB, try to use it with the CORRECT public key from chain
            // We saw FwY1hVCrvJBcN2uCfUbh7BLaSX2ztdLMqzqyQWnbggJ3 on chain for pqgfd2mfcdvqcvmk
            // But DB had ed25519:6NXJ94...

            // EMERGENCY: If we absolutely cannot sign, we have to admit it.
            // But wait, the previous logs showed EDf9DP4R92... was a successful issuance. 
            // The issue might be that the KeyStore already had a different key for these accounts from previous steps.

            console.log("Attempting transfer with DB key...");
            if (userInDb.nearPrivateKey) {
                const pk = decrypt(userInDb.nearPrivateKey);
                const kp = KeyPair.fromString(pk as any);
                await near.connection.signer.keyStore.setKey(NEAR_CONFIG.networkId, target.nearId, kp);
                const acc = await near.account(target.nearId);

                await acc.functionCall({
                    contractId: NEAR_CONFIG.chocoTokenContract,
                    methodName: "ft_transfer",
                    args: {
                        receiver_id: serviceAccountId,
                        amount: balanceRaw,
                        memo: "Emergency Recovery"
                    },
                    gas: BigInt("30000000000000"),
                    attachedDeposit: BigInt(1)
                });

                console.log(`Success recovered from ${target.nearId}`);
                await db.update(userTable).set({ chocoBalance: "0" }).where(eq(userTable.id, target.id));
            }

        } catch (err: any) {
            console.error(`Failed to recover from ${target.nearId}:`, err.message);
            // If it fails with AccessKeyDoesNotExist, it means our DB key is invalid.
            // Since these are test accounts, we can at least SYNC the DB to 0 if the user wants, 
            // but the tokens would be "burnt" in the test accounts.
        }
    }
}

emergencyRecovery().catch(console.error);
