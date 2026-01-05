const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
    console.error('Error: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is missing.');
    process.exit(1);
}

const client = createClient({
    url: tursoUrl,
    authToken: tursoToken,
});

async function main() {
    const migrationDir = path.join(__dirname, '..', 'prisma', 'migrations', '20260105142002_update_schema');
    const sqlPath = path.join(migrationDir, 'migration.sql');

    if (!fs.existsSync(sqlPath)) {
        console.error('Migration file not found:', sqlPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Connecting to Turso...');

    try {
        // 1. Fetch current schema objects
        const result = await client.execute("SELECT name, type FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations';");
        const objects = result.rows;

        if (objects.length > 0) {
            console.log(`Found ${objects.length} existing schema objects.`);

            // Construct a single batch SQL string to drop everything
            // Note: Order matters. Drop triggers/views first? Actually FK OFF solves most.
            let dropSql = "PRAGMA foreign_keys = OFF;\n";

            for (const obj of objects) {
                const name = obj.name;
                const type = obj.type; // table, view, index, trigger
                dropSql += `DROP ${type} IF EXISTS "${name}";\n`;
            }

            console.log("Dropping all existing schema objects...");
            // Execute as one batch to ensure PRAGMA holds
            await client.executeMultiple(dropSql);
            console.log('✅ Schema cleared.');
        } else {
            console.log('Database is already empty.');
        }

        // 2. Apply the migration
        console.log(`Applying full schema migration from ${sqlPath}...`);

        const cleanSql = sql
            .replace(/Pragma writable_schema=1;/g, '-- Pragma writable_schema=1; skipped')
            .replace(/Pragma writable_schema=0;/g, '-- Pragma writable_schema=0; skipped')
            .replace(/CREATE UNIQUE INDEX "sqlite_autoindex_TweetEmbedding_2"/g, '-- Skipped autoindex creation');

        await client.executeMultiple(cleanSql);

        console.log('✅ Migration applied successfully.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
        if (e.cause) console.error('Cause:', e.cause);
    } finally {
        client.close();
    }
}

main();
