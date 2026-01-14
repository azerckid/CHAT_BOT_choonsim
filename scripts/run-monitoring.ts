
import { runDepositMonitoring } from "../app/lib/near/deposit-engine.server";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

async function main() {
    console.log("Starting manual deposit monitoring run...");
    await runDepositMonitoring();
    console.log("Finished manual deposit monitoring run.");
}

main().catch(console.error);
