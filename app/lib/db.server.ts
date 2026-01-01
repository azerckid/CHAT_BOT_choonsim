import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
});

import { initCronJobs } from "./cron.server";

declare global {
    var __db__: PrismaClient | undefined;
    var __cron_initialized__: boolean | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient({ adapter });
    initCronJobs();
} else {
    if (!global.__db__) {
        global.__db__ = new PrismaClient({ adapter });
    }
    prisma = global.__db__;

    if (!global.__cron_initialized__) {
        initCronJobs();
        global.__cron_initialized__ = true;
    }
}

export { prisma };
