/**
 * BondBase Revenue Bridge - 집계 Cron 엔드포인트 (1시간 주기)
 * Vercel Cron에서 호출. CRON_SECRET 헤더로 인증.
 *
 * 처리 흐름:
 *  [REVENUE]
 *  1. CRON_SECRET 인증
 *  2. ChocoConsumptionLog isSynced=false 레코드 조회
 *  3. characterId별 chocoAmount BigNumber 합산
 *  4. character.bondBaseId 조회 (null이면 skip)
 *  5. CHOCO 합산액 → USDC 환산
 *  6. BondBase POST /api/revenue 전송
 *  7. 성공 시 해당 레코드들 isSynced=true 업데이트
 *
 *  [METRICS] — REVENUE 로그 유무와 무관하게 항상 실행
 *  8. 전체 유저 수(followers) + subscriptionStatus=ACTIVE 유저 수(subscribers) 조회
 *  9. bondBaseId 있는 모든 캐릭터에 sendMetrics 전송
 *     (캐릭터별 구독 분리 전까지는 전체 수치를 동일하게 전송)
 *
 * 주의: sendRevenue 실패 시 isSynced 업데이트를 건너뛰어 at-least-once 전송 보장.
 * (중복 전송 허용 정책 — BondBase 측 멱등성 처리 권장)
 *
 * Related: docs/04_Logic_Progress/06_BONDBASE_BRIDGE_PLAN.md Phase D, E
 */
import type { LoaderFunctionArgs } from "react-router";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq, inArray, isNotNull, count } from "drizzle-orm";
import { BigNumber } from "bignumber.js";
import { calculateUSDFromChoco } from "~/lib/ctc/exchange-rate.server";
import { sendRevenue, sendMetrics } from "~/lib/bondbase/client.server";
import { logger } from "~/lib/logger.server";

const CRON_SECRET = process.env.CRON_SECRET;

export async function loader({ request }: LoaderFunctionArgs) {
    // 1. CRON_SECRET 인증 (ctc-sweep.ts와 동일 패턴)
    const authHeader = request.headers.get("Authorization");
    const secret =
        authHeader?.replace(/^Bearer\s+/i, "") ??
        request.headers.get("X-Cron-Secret") ??
        "";

    if (!CRON_SECRET || secret !== CRON_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // ── REVENUE ──────────────────────────────────────────────────────────

        // 2. isSynced=false 레코드 전체 조회
        const unsyncedLogs = await db
            .select()
            .from(schema.chocoConsumptionLog)
            .where(eq(schema.chocoConsumptionLog.isSynced, false));

        // 3. characterId별 chocoAmount BigNumber 합산
        const byCharacter = new Map<string, { total: BigNumber; ids: string[] }>();
        for (const log of unsyncedLogs) {
            const entry = byCharacter.get(log.characterId);
            if (entry) {
                entry.total = entry.total.plus(log.chocoAmount);
                entry.ids.push(log.id);
            } else {
                byCharacter.set(log.characterId, {
                    total: new BigNumber(log.chocoAmount),
                    ids: [log.id],
                });
            }
        }

        let synced = 0;
        let skipped = 0;
        const revenueErrors: string[] = [];

        for (const [characterId, { total, ids }] of byCharacter) {
            // 4. character.bondBaseId 조회 — null이면 skip (isSynced 미업데이트)
            const char = await db.query.character.findFirst({
                where: eq(schema.character.id, characterId),
                columns: { bondBaseId: true },
            });

            if (!char?.bondBaseId) {
                logger.info({
                    category: "SYSTEM",
                    message: `[BondBase] bondBaseId 없음, 건너뜀: characterId=${characterId}`,
                });
                skipped++;
                continue;
            }

            try {
                // 5. CHOCO → USDC 환산
                const usdcAmount = calculateUSDFromChoco(total.toString());
                const description = `${characterId} CHOCO consumption (${new Date().toISOString().slice(0, 10)})`;

                // 6. BondBase REVENUE 전송 (실패 시 throw → isSynced 업데이트 건너뜀)
                await sendRevenue(char.bondBaseId, usdcAmount, description);

                // 7. 성공 시 isSynced=true 일괄 업데이트
                await db
                    .update(schema.chocoConsumptionLog)
                    .set({ isSynced: true })
                    .where(inArray(schema.chocoConsumptionLog.id, ids));

                synced++;
                logger.info({
                    category: "SYSTEM",
                    message: `[BondBase] REVENUE 전송 완료: bondId=${char.bondBaseId}, ${total.toString()} CHOCO = $${usdcAmount} USDC`,
                    metadata: {
                        characterId,
                        bondBaseId: char.bondBaseId,
                        chocoTotal: total.toString(),
                        usdcAmount,
                        recordCount: ids.length,
                    },
                });
            } catch (err) {
                const msg = `characterId=${characterId}: ${(err as Error).message}`;
                revenueErrors.push(msg);
                logger.error({
                    category: "SYSTEM",
                    message: `[BondBase] REVENUE 전송 실패: ${msg}`,
                    stackTrace: (err as Error).stack,
                });
            }
        }

        // ── METRICS ──────────────────────────────────────────────────────────

        // 8. 전체 유저 수 + ACTIVE 구독 유저 수 병렬 조회
        const [totalUsersResult, activeSubsResult] = await Promise.all([
            db.select({ value: count() }).from(schema.user),
            db.select({ value: count() })
                .from(schema.user)
                .where(eq(schema.user.subscriptionStatus, "ACTIVE")),
        ]);
        const followers = totalUsersResult[0]?.value ?? 0;
        const subscribers = activeSubsResult[0]?.value ?? 0;

        // bondBaseId가 설정된 모든 캐릭터 조회
        const activeCharacters = await db.query.character.findMany({
            where: isNotNull(schema.character.bondBaseId),
            columns: { id: true, bondBaseId: true },
        });

        const metricsErrors: string[] = [];

        // 9. 캐릭터별로 동일한 전역 수치 전송 (캐릭터별 구독 분리 전 임시 방편)
        for (const char of activeCharacters) {
            if (!char.bondBaseId) continue;
            try {
                await sendMetrics(char.bondBaseId, followers, subscribers);
                logger.info({
                    category: "SYSTEM",
                    message: `[BondBase] METRICS 전송 완료: bondId=${char.bondBaseId}, followers=${followers}, subscribers=${subscribers}`,
                    metadata: { characterId: char.id, bondBaseId: char.bondBaseId, followers, subscribers },
                });
            } catch (err) {
                const msg = `characterId=${char.id}: ${(err as Error).message}`;
                metricsErrors.push(msg);
                logger.error({
                    category: "SYSTEM",
                    message: `[BondBase] METRICS 전송 실패: ${msg}`,
                    stackTrace: (err as Error).stack,
                });
            }
        }

        return Response.json({
            ok: true,
            revenue: { synced, skipped, errors: revenueErrors },
            metrics: { sent: activeCharacters.length - metricsErrors.length, errors: metricsErrors },
        });
    } catch (e) {
        logger.error({
            category: "SYSTEM",
            message: "[BondBase] bondbase-sync Cron 실패",
            stackTrace: (e as Error).stack,
        });
        return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
}
