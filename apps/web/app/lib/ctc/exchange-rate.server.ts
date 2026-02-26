/**
 * 환율 계산 서버 유틸리티 (CTC 버전)
 * 이전 구현에서 이동 — 레거시 가격 조회 함수 제거
 * USD/KRW → CHOCO 환산에 사용됩니다.
 */
import { db } from "../db.server";
import { exchangeRate as exchangeRateTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { BigNumber } from "bignumber.js";
import { logger } from "~/lib/logger.server";
import crypto from "crypto";

const EXCHANGERATE_API_URL = "https://api.exchangerate-api.com/v4/latest";
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

// CHOCO 가격 설정 (1 CHOCO = $0.001, 즉 $1 = 1,000 CHOCO)
const CHOCO_PRICE_USD = 0.001;

interface ExchangeRateCache {
    rate: number;
    updatedAt: number;
}

const memoryCache: Map<string, ExchangeRateCache> = new Map();

async function getExchangeRateFromDB(tokenPair: string): Promise<number | null> {
    const rateRecord = await db.query.exchangeRate.findFirst({
        where: eq(exchangeRateTable.tokenPair, tokenPair),
    });

    if (!rateRecord) return null;

    const cacheAge = Date.now() - rateRecord.updatedAt.getTime();
    if (cacheAge > CACHE_DURATION) return null;

    return rateRecord.rate;
}

async function saveExchangeRateToDB(tokenPair: string, rate: number): Promise<void> {
    const existing = await db.query.exchangeRate.findFirst({
        where: eq(exchangeRateTable.tokenPair, tokenPair),
    });

    if (existing) {
        await db.update(exchangeRateTable)
            .set({ rate, updatedAt: new Date() })
            .where(eq(exchangeRateTable.tokenPair, tokenPair));
    } else {
        await db.insert(exchangeRateTable).values({
            id: crypto.randomUUID(),
            tokenPair,
            rate,
            updatedAt: new Date(),
        });
    }
}

/**
 * USD → CHOCO 환율을 계산합니다. ($1 = 1,000 CHOCO 고정)
 */
export async function calculateChocoFromUSD(usdAmount: number): Promise<string> {
    const chocoAmount = new BigNumber(usdAmount).dividedBy(CHOCO_PRICE_USD);

    logger.info({
        category: "PAYMENT",
        message: `Calculated CHOCO from USD: $${usdAmount} = ${chocoAmount.toString()} CHOCO`,
        metadata: { usdAmount, chocoAmount: chocoAmount.toString() }
    });

    return chocoAmount.toString();
}

/**
 * CHOCO → USD 역산 함수 ($1 = 1,000 CHOCO 고정)
 * BondBase REVENUE 전송 시 USDC 환산에 사용됩니다.
 *
 * @param chocoAmount CHOCO 금액 문자열 (BigNumber)
 * @returns USDC 금액 문자열 (소수점 6자리)
 */
export function calculateUSDFromChoco(chocoAmount: string): string {
    return new BigNumber(chocoAmount).multipliedBy(CHOCO_PRICE_USD).toFixed(6);
}

/**
 * USD/KRW 환율을 조회합니다. (메모리 캐시 → DB 캐시 → ExchangeRate API)
 */
export async function getUSDKRWRate(): Promise<number> {
    const tokenPair = "USD/KRW";

    const memoryCached = memoryCache.get(tokenPair);
    if (memoryCached && (Date.now() - memoryCached.updatedAt) < CACHE_DURATION) {
        return memoryCached.rate;
    }

    const dbCached = await getExchangeRateFromDB(tokenPair);
    if (dbCached !== null) {
        memoryCache.set(tokenPair, { rate: dbCached, updatedAt: Date.now() });
        return dbCached;
    }

    try {
        const response = await fetch(`${EXCHANGERATE_API_URL}/USD`);
        if (!response.ok) throw new Error(`ExchangeRate API error: ${response.status}`);
        const data = await response.json();
        const krwRate = data.rates?.KRW || 1350;

        await saveExchangeRateToDB(tokenPair, krwRate);
        memoryCache.set(tokenPair, { rate: krwRate, updatedAt: Date.now() });

        return krwRate;
    } catch (error) {
        logger.error({
            category: "SYSTEM",
            message: "Failed to fetch USD/KRW rate, using fallback 1350",
            stackTrace: (error as Error).stack
        });
        const fallbackRate = 1350;
        await saveExchangeRateToDB(tokenPair, fallbackRate);
        memoryCache.set(tokenPair, { rate: fallbackRate, updatedAt: Date.now() });
        return fallbackRate;
    }
}

/**
 * KRW → CHOCO 환율을 계산합니다.
 */
export async function calculateChocoFromKRW(krwAmount: number): Promise<string> {
    const usdKrwRate = await getUSDKRWRate();
    const usdAmount = new BigNumber(krwAmount).dividedBy(usdKrwRate);
    const chocoAmount = await calculateChocoFromUSD(usdAmount.toNumber());

    logger.info({
        category: "PAYMENT",
        message: `Calculated CHOCO from KRW: ${krwAmount} KRW = ${chocoAmount} CHOCO (USD/KRW: ${usdKrwRate})`,
        metadata: { krwAmount, usdKrwRate, chocoAmount }
    });

    return chocoAmount;
}
