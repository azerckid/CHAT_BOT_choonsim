import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "../db/schema";

const connectionConfig = {
    url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
};

const adapter = new PrismaLibSql(connectionConfig);

import { initCronJobs } from "./cron.server";

declare global {
    var __prisma__: PrismaClient | undefined;
    var __db__: LibSQLDatabase<typeof schema> | undefined;
    var __libsql_client__: Client | undefined;
    var __cron_initialized__: boolean | undefined;
}

let prisma: PrismaClient;
let db: LibSQLDatabase<typeof schema>;

if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient({ adapter });
    const client = createClient(connectionConfig);
    db = drizzle(client, { schema });
    // Vercel serverless 환경에서는 node-cron이 작동하지 않으므로 크론 잡 비활성화
    // initCronJobs();
} else {
    if (!global.__prisma__) {
        global.__prisma__ = new PrismaClient({ adapter });
    }
    prisma = global.__prisma__;

    if (!global.__libsql_client__) {
        global.__libsql_client__ = createClient(connectionConfig);
    }
    if (!global.__db__) {
        global.__db__ = drizzle(global.__libsql_client__, { schema });
    }
    db = global.__db__;

    if (!global.__cron_initialized__) {
        initCronJobs();
        global.__cron_initialized__ = true;
    }
}

export { prisma, db };
