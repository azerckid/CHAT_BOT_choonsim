import { createClient } from "@libsql/client";
import { ITEMS } from "../app/lib/items";
import path from "path";
import fs from "fs";

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        env[key] = value;
    }
});

const client = createClient({
    url: env.TURSO_DATABASE_URL!,
    authToken: env.TURSO_AUTH_TOKEN!,
});

async function main() {
    console.log("Seeding items into remote Turso DB...");

    for (const item of Object.values(ITEMS)) {
        console.log(`Seeding item ${item.name}...`);

        await client.execute({
            sql: `INSERT INTO "Item" (id, name, type, priceCredits, description, isActive, createdAt, updatedAt) 
                  VALUES (?, ?, ?, ?, ?, 1, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET 
                  name=excluded.name, type=excluded.type, priceCredits=excluded.priceCredits, 
                  description=excluded.description, updatedAt=excluded.updatedAt`,
            args: [
                item.id,
                item.name,
                item.type,
                item.priceCredits,
                item.description || "",
                new Date().toISOString(),
                new Date().toISOString()
            ]
        });
    }

    console.log("Done!");
}

main().catch(console.error);
