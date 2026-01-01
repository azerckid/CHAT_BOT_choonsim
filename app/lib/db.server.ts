import { PrismaClient } from "../../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
});

declare global {
    var __db__: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient({ adapter });
} else {
    if (!global.__db__) {
        global.__db__ = new PrismaClient({ adapter });
    }
    prisma = global.__db__;
}

export { prisma };
