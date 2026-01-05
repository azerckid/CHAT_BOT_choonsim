import fs from 'fs';
import path from 'path';
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { CHARACTERS } from "../app/lib/characters";

// Manually load .env
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
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[key] = value;
        process.env[key] = value;
    }
});

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = "file:./dev.db";

const adapter = new PrismaLibSql({
    url: "file:./dev.db",
});


const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding characters into DB...");

    for (const [key, char] of Object.values(CHARACTERS).entries()) {
        const character = char as any;
        console.log(`Processing: ${character.name} (${character.id})...`);

        await prisma.character.upsert({
            where: { id: character.id },
            update: {
                name: character.name,
                role: character.role,
                bio: character.bio,
                personaPrompt: character.personaPrompt,
                isOnline: character.isOnline,
            },
            create: {
                id: character.id,
                name: character.name,
                role: character.role,
                bio: character.bio,
                personaPrompt: character.personaPrompt,
                isOnline: character.isOnline,
                stats: {
                    create: {
                        totalHearts: 0,
                    }
                },
                media: {
                    create: {
                        url: character.avatarUrl,
                        type: "AVATAR"
                    }
                }
            }
        });
    }

    console.log("Seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
