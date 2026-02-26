/**
 * Phase D-1: nearAccountId만 있고 evmAddress가 없는 유저에게 EVM 지갑을 생성해 부여합니다.
 * NEAR 컬럼 DROP 전에 한 번만 실행합니다.
 *
 * 사용: cd apps/web && npx tsx scripts/migrate-near-users-to-evm.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../app/db/schema";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { ethers } from "ethers";
import { encrypt } from "../app/lib/ctc/key-encryption.server";

dotenv.config({ path: ".env.development" });

function createEvmWallet(): { evmAddress: string; evmPrivateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return { evmAddress: wallet.address, evmPrivateKey: encrypt(wallet.privateKey) };
}

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  const r = await client.execute({
    sql: "SELECT id, email FROM User WHERE nearAccountId IS NOT NULL AND evmAddress IS NULL",
    args: [],
  });
  const rows: { id: string; email: string | null }[] = Array.isArray(r.rows) ? r.rows : [];

  if (rows.length === 0) {
    console.log("No users with nearAccountId and no evmAddress. Done.");
    client.close();
    return;
  }

  console.log(`Found ${rows.length} user(s) to migrate.`);

  for (const u of rows) {
    const { evmAddress, evmPrivateKey } = createEvmWallet();
    await db
      .update(schema.user)
      .set({
        evmAddress,
        evmPrivateKey,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, u.id));
    console.log(`[OK] ${u.id} (${u.email}) -> evmAddress ${evmAddress}`);
  }

  console.log("Migration done.");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
