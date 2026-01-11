import { db } from "../db.server";
import { exchangeRate as exchangeRateTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { BigNumber } from "bignumber.js";
import { logger } from "../logger.server";
import crypto from "crypto";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

interface ExchangeRateCache {
    rate: number;
    updatedAt: number;
}

// 메모리 캐시 (서버 재시작 시 초기화됨)
const memoryCache: Map<string, ExchangeRateCache> = new Map();

/**
 * CoinGecko API를 통해 NEAR/USD 시세를 조회합니다.
 * @returns NEAR 가격 (USD)
 */
async function fetchNearPriceFromCoinGecko(): Promise<number> {
    try {
        const response = await fetch(`${COINGECKO_API_URL}?ids=near&vs_currencies=usd`);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }
        const data = await response.json();
        const price = data.near?.usd || 5.0; // 기본값: $5
        
        logger.info({
            category: "SYSTEM",
            message: `Fetched NEAR price from CoinGecko: $${price}`,
            metadata: { price }
        });
        
        return price;
    } catch (error) {
        logger.error({
            category: "SYSTEM",
            message: "Failed to fetch NEAR price from CoinGecko",
            stackTrace: (error as Error).stack
        });
        return 5.0; // 기본값 반환
    }
}

/**
 * ExchangeRate 테이블에서 시세를 조회합니다.
 * @param tokenPair 토큰 페어 (예: "NEAR/USD")
 * @returns 시세 또는 null
 */
async function getExchangeRateFromDB(tokenPair: string): Promise<number | null> {
    const rateRecord = await db.query.exchangeRate.findFirst({
        where: eq(exchangeRateTable.tokenPair, tokenPair),
    });

    if (!rateRecord) {
        return null;
    }

    // 캐시 만료 확인 (5분)
    const cacheAge = Date.now() - rateRecord.updatedAt.getTime();
    if (cacheAge > CACHE_DURATION) {
        return null; // 만료된 캐시
    }

    return rateRecord.rate;
}

/**
 * ExchangeRate 테이블에 시세를 저장합니다.
 * @param tokenPair 토큰 페어 (예: "NEAR/USD")
 * @param rate 시세
 */
async function saveExchangeRateToDB(tokenPair: string, rate: number): Promise<void> {
    const existing = await db.query.exchangeRate.findFirst({
        where: eq(exchangeRateTable.tokenPair, tokenPair),
    });

    if (existing) {
        await db.update(exchangeRateTable)
            .set({
                rate,
                updatedAt: new Date(),
            })
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
 * NEAR/USD 시세를 조회합니다. (메모리 캐시 → DB 캐시 → CoinGecko API 순서)
 * @returns NEAR 가격 (USD)
 */
export async function getNearPriceUSD(): Promise<number> {
    const tokenPair = "NEAR/USD";

    // 1. 메모리 캐시 확인
    const memoryCached = memoryCache.get(tokenPair);
    if (memoryCached && (Date.now() - memoryCached.updatedAt) < CACHE_DURATION) {
        return memoryCached.rate;
    }

    // 2. DB 캐시 확인
    const dbCached = await getExchangeRateFromDB(tokenPair);
    if (dbCached !== null) {
        // 메모리 캐시 업데이트
        memoryCache.set(tokenPair, {
            rate: dbCached,
            updatedAt: Date.now(),
        });
        return dbCached;
    }

    // 3. CoinGecko API 호출
    const freshRate = await fetchNearPriceFromCoinGecko();

    // 4. 캐시 저장 (DB 및 메모리)
    await saveExchangeRateToDB(tokenPair, freshRate);
    memoryCache.set(tokenPair, {
        rate: freshRate,
        updatedAt: Date.now(),
    });

    return freshRate;
}

/**
 * NEAR → CHOCO 환율을 계산합니다.
 * 현재는 고정비율을 사용하지만, 향후 USD 기준으로 계산 가능합니다.
 * @param nearAmount NEAR 수량
 * @returns CHOCO 수량
 */
export async function calculateChocoFromNear(nearAmount: string | number): Promise<string> {
    // MVP: 고정비율 1 NEAR = 5,000 CHOCO
    // 향후: NEAR 가격(USD)을 기준으로 CHOCO 가격(USD)과 비교하여 계산
    const fixedRate = 5000;
    const amount = typeof nearAmount === "string" ? parseFloat(nearAmount) : nearAmount;
    return new BigNumber(amount).multipliedBy(fixedRate).toString();
}

/**
 * USD → CHOCO 환율을 계산합니다.
 * @param usdAmount USD 금액
 * @returns CHOCO 수량
 */
export async function calculateChocoFromUSD(usdAmount: number): Promise<string> {
    // 현재: 1 Credit = $0.0001, 1 CHOCO = 1 Credit
    // $1 = 10,000 CHOCO
    const chocoPriceUSD = 0.0001;
    return new BigNumber(usdAmount).dividedBy(chocoPriceUSD).toString();
}
