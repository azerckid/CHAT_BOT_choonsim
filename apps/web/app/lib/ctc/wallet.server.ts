/**
 * Phase 0: CTC EVM 지갑 생성
 * ethers.js로 EVM 지갑을 생성하고 DB에 저장한다.
 *
 * Created: 2026-02-11
 * Related: docs/04_Logic_Progress/03_BM_IMPLEMENTATION_PLAN.md Phase 0-1
 */
import { ethers } from "ethers";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "~/lib/ctc/key-encryption.server";
import { BigNumber } from "bignumber.js";

const SIGNUP_CHOCO_REWARD = 5000;

export interface CreateEvmWalletResult {
  evmAddress: string;
  evmPrivateKey: string; // encrypted
}

/**
 * 새 EVM 지갑을 생성하고 개인키를 암호화해 반환한다.
 * DB에는 저장하지 않는다. (호출자가 저장)
 */
export function createEvmWallet(): CreateEvmWalletResult {
  const wallet = ethers.Wallet.createRandom();
  const encryptedKey = encrypt(wallet.privateKey);
  return {
    evmAddress: wallet.address,
    evmPrivateKey: encryptedKey,
  };
}

/**
 * 사용자에게 EVM 지갑이 없으면 생성하고, 신규 생성 시 가입 보상 CHOCO를 DB에 적립한다.
 * 첫 홈 접속 시 호출한다.
 * @returns evmAddress 또는 null (지갑 없음)
 */
export async function ensureEvmWalletAsync(userId: string): Promise<string | null> {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
    columns: {
      id: true,
      evmAddress: true,
      evmPrivateKey: true,
      chocoBalance: true,
    },
  });

  if (!user) return null;

  if (user.evmAddress) {
    return user.evmAddress;
  }

  // 신규: EVM 지갑 생성 + DB 저장 + 가입 보상 CHOCO (DB만)
  const { evmAddress, evmPrivateKey } = createEvmWallet();
  const currentBalance = new BigNumber(user.chocoBalance ?? "0");
  const newBalance = currentBalance.plus(SIGNUP_CHOCO_REWARD).toString();

  await db
    .update(schema.user)
    .set({
      evmAddress,
      evmPrivateKey,
      chocoBalance: newBalance,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, userId));

  console.log(`[CTC Wallet] Created evmAddress for user ${userId} (${evmAddress}), signup reward +${SIGNUP_CHOCO_REWARD} CHOCO`);
  return evmAddress;
}
