/**
 * Phase 0-4: CTC 입금 감지 및 스윕 엔진
 * evmAddress 보유 유저의 CTC 네이티브 잔액을 조회하고, 입금 시 CHOCO 적립 후 유저 지갑에서 Treasury로 전량 스윕합니다.
 *
 * Related: docs/04_Logic_Progress/03_BM_IMPLEMENTATION_PLAN.md Phase 0-4
 */
import { ethers } from "ethers";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { BigNumber } from "bignumber.js";
import { logger } from "~/lib/logger.server";
import { decrypt } from "~/lib/ctc/key-encryption.server";

const CTC_RPC_URL = process.env.CTC_RPC_URL;
const CTC_TREASURY_ADDRESS = process.env.CTC_TREASURY_ADDRESS;
const CTC_PRICE_API_URL = process.env.CTC_PRICE_API_URL;

// 1 CHOCO = $0.001 (1 USD = 1,000 CHOCO)
const CHOCO_PRICE_USD = 0.001;
const TOKEN_CONTRACT_NATIVE = "CTC";
const GAS_LIMIT_SWEEP = 21_000n;

/**
 * CTC/USD 시세를 API에서 조회합니다. 실패 시 null 반환.
 */
async function getCtcPriceUSD(): Promise<number | null> {
  if (!CTC_PRICE_API_URL) {
    logger.warn({
      category: "SYSTEM",
      message: "[CTC Deposit] CTC_PRICE_API_URL not set, skipping price fetch",
    });
    return null;
  }
  try {
    const res = await fetch(CTC_PRICE_API_URL);
    if (!res.ok) return null;
    const data = (await res.json()) as { price?: number; usd?: number };
    const price = data.price ?? data.usd ?? null;
    return typeof price === "number" ? price : null;
  } catch (e) {
    logger.error({
      category: "SYSTEM",
      message: "[CTC Deposit] Failed to fetch CTC price",
      stackTrace: (e as Error).stack,
    });
    return null;
  }
}

/**
 * CTC 입금액(wei)을 USD 가격으로 환산한 CHOCO 수를 반환합니다.
 */
function ctcDepositToChoco(depositWei: string, ctcPriceUsd: number | null): string {
  if (!ctcPriceUsd || ctcPriceUsd <= 0) return "0";
  const depositEth = new BigNumber(depositWei).dividedBy(new BigNumber(10).pow(18));
  const usdValue = depositEth.multipliedBy(ctcPriceUsd);
  const choco = usdValue.dividedBy(CHOCO_PRICE_USD);
  return choco.toFixed(0);
}

/**
 * CTC 입금 감지 및 스윕을 한 번 실행합니다.
 * - evmAddress, evmPrivateKey가 있는 유저만 대상 (스윕 시 유저 키로 서명)
 * - 현재 잔액 > ctcLastBalance 이면 입금으로 간주 → CHOCO 적립 → 유저 지갑에서 Treasury로 전량 스윕
 */
export async function runCtcDepositAndSweep(): Promise<{ processed: number; errors: number }> {
  if (!CTC_RPC_URL || !CTC_TREASURY_ADDRESS) {
    logger.warn({
      category: "SYSTEM",
      message: "[CTC Deposit] Missing CTC_RPC_URL or CTC_TREASURY_ADDRESS",
    });
    return { processed: 0, errors: 0 };
  }

  const provider = new ethers.JsonRpcProvider(CTC_RPC_URL);
  const ctcPriceUsd = await getCtcPriceUSD();

  const users = await db
    .select({
      id: schema.user.id,
      evmAddress: schema.user.evmAddress,
      evmPrivateKey: schema.user.evmPrivateKey,
      ctcLastBalance: schema.user.ctcLastBalance,
      chocoBalance: schema.user.chocoBalance,
    })
    .from(schema.user)
    .where(
      sql`${schema.user.evmAddress} IS NOT NULL AND ${schema.user.evmAddress} != '' AND ${schema.user.evmPrivateKey} IS NOT NULL AND ${schema.user.evmPrivateKey} != ''`
    );

  let processed = 0;
  let errors = 0;

  for (const user of users) {
    const address = user.evmAddress!;
    if (!user.evmPrivateKey) continue;

    try {
      const currentBalanceWei = await provider.getBalance(address);
      const currentStr = currentBalanceWei.toString();
      const lastStr = user.ctcLastBalance ?? "0";
      const lastBn = new BigNumber(lastStr);
      const currentBn = new BigNumber(currentStr);

      if (currentBn.lte(lastBn)) {
        if (currentBn.lt(lastBn)) {
          await db
            .update(schema.user)
            .set({ ctcLastBalance: currentStr, updatedAt: new Date() })
            .where(eq(schema.user.id, user.id));
        }
        continue;
      }

      const depositWei = currentBn.minus(lastBn).toString();
      const chocoToCredit = ctcDepositToChoco(depositWei, ctcPriceUsd);

      const privateKey = decrypt(user.evmPrivateKey);
      const userWallet = new ethers.Wallet(privateKey, provider);

      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice ?? ethers.parseUnits("1", "gwei");
      const gasCost = maxFeePerGas * GAS_LIMIT_SWEEP;
      const balanceBn = BigInt(currentStr);
      const valueToSweep = balanceBn > gasCost ? balanceBn - gasCost : 0n;

      let sweepTxHash: string | null = null;
      if (valueToSweep > 0n) {
        const sweepTx = await userWallet.sendTransaction({
          to: CTC_TREASURY_ADDRESS,
          value: valueToSweep,
          gasLimit: GAS_LIMIT_SWEEP,
        });
        const receipt = await sweepTx.wait();
        sweepTxHash = receipt?.hash ?? null;
      }

      const newChocoBalance = new BigNumber(user.chocoBalance ?? "0").plus(chocoToCredit).toString();

      await db.transaction(async (txDb) => {
        await txDb
          .update(schema.user)
          .set({
            chocoBalance: newChocoBalance,
            ctcLastBalance: "0",
            updatedAt: new Date(),
          })
          .where(eq(schema.user.id, user.id));

        await txDb.insert(schema.tokenTransfer).values({
          id: crypto.randomUUID(),
          userId: user.id,
          txHash: sweepTxHash,
          amount: depositWei,
          tokenContract: TOKEN_CONTRACT_NATIVE,
          status: "COMPLETED",
          purpose: "TOPUP",
          createdAt: new Date(),
        });
      });

      processed++;
      logger.info({
        category: "PAYMENT",
        message: `[CTC Deposit] Credited ${chocoToCredit} CHOCO for user ${user.id}, swept ${valueToSweep.toString()} wei`,
        metadata: { userId: user.id, depositWei, chocoToCredit, txHash: sweepTxHash },
      });
    } catch (e) {
      errors++;
      logger.error({
        category: "SYSTEM",
        message: `[CTC Deposit] Error processing user ${user.id}`,
        stackTrace: (e as Error).stack,
        metadata: { userId: user.id, evmAddress: address },
      });
    }
  }

  return { processed, errors };
}
