import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "",
    authToken: process.env.TURSO_AUTH_TOKEN || "",
});

async function main() {
    const userName = process.argv[2] || "bill";
    const tier = process.argv[3] || "ULTIMATE";

    console.log(`Updating ${userName}'s subscription tier to ${tier}...`);

    try {
        // 먼저 사용자 찾기
        const result = await client.execute({
            sql: `SELECT id, name, email, subscriptionTier FROM User WHERE name = ? OR email LIKE ? LIMIT 1`,
            args: [userName, `%${userName}%`]
        });

        if (result.rows.length === 0) {
            console.log(`❌ User "${userName}" not found.`);
            console.log("\nAvailable users:");
            const allUsers = await client.execute(`SELECT id, name, email, subscriptionTier FROM User LIMIT 10`);
            allUsers.rows.forEach(row => {
                console.log(`  - ${row.name || row.email} (${row.email}) - Current tier: ${row.subscriptionTier || 'NULL'}`);
            });
            process.exit(1);
        }

        const user = result.rows[0];
        console.log(`Found user: ${user.name || user.email} (${user.email})`);
        console.log(`Current tier: ${user.subscriptionTier || 'NULL'}`);

        // 업데이트 실행
        await client.execute({
            sql: `UPDATE User SET subscriptionTier = ? WHERE id = ?`,
            args: [tier, user.id]
        });

        console.log(`✅ Successfully updated ${user.name || user.email}'s subscription tier to ${tier}`);

        // 확인
        const updated = await client.execute({
            sql: `SELECT id, name, email, subscriptionTier FROM User WHERE id = ?`,
            args: [user.id]
        });
        console.log(`Verified: New tier is ${updated.rows[0].subscriptionTier}`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }

    process.exit(0);
}

main();

