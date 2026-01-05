import fs from 'fs';
import path from 'path';
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

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

// Set DATABASE_URL for Prisma - preferring local for safety during dev/testing
process.env.DATABASE_URL = "file:./dev.db";

const adapter = new PrismaLibSql({
    url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const INITIAL_ITEMS = [
    {
        name: "하트 (Heart)",
        type: "GIFT",
        priceCredits: 10,
        description: "가장 기본적인 마음을 전하는 선물입니다.",
        iconUrl: "https://res.cloudinary.com/dzev688v9/image/upload/v1736034000/gifts/heart.png",
        isActive: true,
    },
    {
        name: "장미 (Rose)",
        type: "GIFT",
        priceCredits: 50,
        description: "로맨틱한 분위기를 연출할 수 있는 빨간 장미입니다.",
        iconUrl: "https://res.cloudinary.com/dzev688v9/image/upload/v1736034000/gifts/rose.png",
        isActive: true,
    },
    {
        name: "곰인형 (Teddy Bear)",
        type: "GIFT",
        priceCredits: 200,
        description: "포근하고 귀여운 곰인형입니다. 캐릭터의 호감도가 크게 상승합니다.",
        iconUrl: "https://res.cloudinary.com/dzev688v9/image/upload/v1736034000/gifts/bear.png",
        isActive: true,
    },
    {
        name: "다이아몬드 (Diamond)",
        type: "GIFT",
        priceCredits: 1000,
        description: "당신의 특별한 마음을 전하는 가장 화려한 선물입니다.",
        iconUrl: "https://res.cloudinary.com/dzev688v9/image/upload/v1736034000/gifts/diamond.png",
        isActive: true,
    },
];

async function main() {
    console.log("Seeding initial items... (Using dev.db)");

    for (const item of INITIAL_ITEMS) {
        console.log(`Checking item: ${item.name}...`);

        await prisma.item.upsert({
            where: { id: `seed-${item.name.split(' ')[0]}` }, // Simplified key for seed items
            update: {
                ...item,
            },
            create: {
                id: `seed-${item.name.split(' ')[0]}`,
                ...item,
            }
        });
    }

    console.log("Item seeding completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
