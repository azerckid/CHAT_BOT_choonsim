/**
 * Mock 유저 시뮬레이션 서버 로직 — Cron API에서 호출
 * Related: 21_MOCK_USER_SIMULATION_PLAN, 10_MOCK_USER_IMPLEMENTATION_PLAN
 */
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq, like } from "drizzle-orm";

const MOCK_EMAIL_PATTERN = "mock-%@test.local";
const CHARACTERS = ["chunsim", "rina"] as const;
const TOKENS_MIN = 500;
const TOKENS_MAX = 2000;
const DEFAULT_CHOCO_PER_USER = 3000;

function randomInt(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function chocoFromTokens(tokens: number): string {
  return String(Math.floor(tokens / 100));
}

export async function grantMockUsersChoco(chocoPerUser = DEFAULT_CHOCO_PER_USER): Promise<{ updated: number }> {
  const users = await db
    .select({ id: schema.user.id, chocoBalance: schema.user.chocoBalance })
    .from(schema.user)
    .where(like(schema.user.email, MOCK_EMAIL_PATTERN));

  if (users.length === 0) return { updated: 0 };

  const now = new Date();
  for (const u of users) {
    const current = parseFloat(u.chocoBalance || "0");
    const next = current + chocoPerUser;
    await db
      .update(schema.user)
      .set({ chocoBalance: String(next), updatedAt: now })
      .where(eq(schema.user.id, u.id));
  }

  return { updated: users.length };
}

export async function runMockActivity(rounds = 1): Promise<{ logs: number; deducted: number; users: number }> {
  const users = await db
    .select({ id: schema.user.id, chocoBalance: schema.user.chocoBalance })
    .from(schema.user)
    .where(like(schema.user.email, MOCK_EMAIL_PATTERN));

  if (users.length === 0) return { logs: 0, deducted: 0, users: 0 };

  const now = new Date();
  let totalDeducted = 0;
  let totalLogs = 0;
  const balances = new Map<string, number>(users.map((u) => [u.id, parseFloat(u.chocoBalance || "0")]));

  for (let r = 0; r < rounds; r++) {
    for (const u of users) {
      const current = balances.get(u.id) ?? 0;
      const tokens = randomInt(TOKENS_MIN, TOKENS_MAX);
      const chocoToDeduct = chocoFromTokens(tokens);
      const deduct = parseInt(chocoToDeduct, 10);
      if (current < deduct) continue;

      const characterId = CHARACTERS[randomInt(0, CHARACTERS.length - 1)];
      const newBalance = current - deduct;
      balances.set(u.id, newBalance);

      await db.insert(schema.chocoConsumptionLog).values({
        id: crypto.randomUUID(),
        characterId,
        chocoAmount: chocoToDeduct,
        source: "CHAT",
        isSynced: false,
        createdAt: now,
      });

      await db
        .update(schema.user)
        .set({ chocoBalance: String(newBalance), updatedAt: now })
        .where(eq(schema.user.id, u.id));

      totalDeducted += deduct;
      totalLogs++;
    }
  }

  return { logs: totalLogs, deducted: totalDeducted, users: users.length };
}
