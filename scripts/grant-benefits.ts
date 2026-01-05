import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: "azerc" } },
                { name: { contains: "Coding" } }
            ]
        }
    });

    console.log("Matching users:", JSON.stringify(users, null, 2));

    if (users.length === 0) {
        console.log("No user found.");
        return;
    }

    // If there's exactly one or one that clearly matches the full name
    const target = users.find(u => u.name?.includes("azerc coder")) || users[0];

    console.log(`Updating user: ${target.name} (${target.id})`);

    // 1. Update Membership & Credits
    const updatedUser = await prisma.user.update({
        where: { id: target.id },
        data: {
            subscriptionTier: "ULTIMATE",
            subscriptionStatus: "ACTIVE",
            credits: { increment: 90000 }, // Mega Pack (70,000 + 20,000)
        }
    });

    // 2. Ensure Heart Item exists and Add Hearts (Heart Treasure Box = 100)
    const heartItem = await prisma.item.upsert({
        where: { id: "heart" },
        create: {
            id: "heart",
            name: "Heart",
            type: "GIFT",
            iconUrl: "💖",
            description: "A beautiful heart to show your love."
        },
        update: {}
    });

    await prisma.userInventory.upsert({
        where: {
            userId_itemId: {
                userId: target.id,
                itemId: heartItem.id
            }
        },
        create: {
            userId: target.id,
            itemId: heartItem.id,
            quantity: 100
        },
        update: {
            quantity: { increment: 100 }
        }
    });
    console.log("Added 100 Hearts.");

    console.log("Successfully updated user benefits.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
