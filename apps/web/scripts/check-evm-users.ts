/**
 * CTC 스윕 테스트용: evmAddress가 있는 유저 목록 확인
 */
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../app/db/schema";
import * as dotenv from "dotenv";
import { isNotNull, ne } from "drizzle-orm";

dotenv.config({ path: ".env.development" });

async function main() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const db = drizzle(client, { schema });

    const users = await db.query.user.findMany({
        where: (u) => isNotNull(u.evmAddress) && ne(u.evmAddress, ""),
        columns: {
            id: true,
            email: true,
            evmAddress: true,
            ctcLastBalance: true,
            chocoBalance: true,
        },
        limit: 10,
    });

    if (users.length === 0) {
        console.log("evmAddress가 있는 유저 없음. 앱에 가입 후 홈 접속 시 자동 생성됩니다.");
        return;
    }

    console.log(`evmAddress 보유 유저 ${users.length}명:\n`);
    for (const u of users) {
        console.log(`ID         : ${u.id}`);
        console.log(`Email      : ${u.email}`);
        console.log(`evmAddress : ${u.evmAddress}`);
        console.log(`chocoBalance  : ${u.chocoBalance}`);
        console.log(`ctcLastBalance: ${u.ctcLastBalance ?? "0"}`);
        console.log("---");
    }
}

main().catch(console.error);
