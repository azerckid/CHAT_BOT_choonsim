import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
    try {
        console.log("Applying migration to Turso...");
        await client.execute("ALTER TABLE Conversation ADD COLUMN personaMode TEXT NOT NULL DEFAULT 'lover'");
        console.log("Migration successful!");
    } catch (e) {
        if (e.message.includes("duplicate column name")) {
            console.log("Column already exists.");
        } else {
            console.error("Migration failed:", e);
        }
    }
}

migrate();
