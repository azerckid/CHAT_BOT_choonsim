import * as nearTransactions from "@near-js/transactions";
import { KeyType } from "@near-js/crypto";
import { g as getNearConnection, N as NEAR_CONFIG } from "./server-build-ugncUK38.js";
import "react/jsx-runtime";
import "node:stream";
import "@react-router/node";
import "react-router";
import "isbot";
import "react-dom/server";
import "sonner";
import "@hugeicons/react";
import "@hugeicons/core-free-icons";
import "react";
import "lucide-react";
import "near-api-js";
import "buffer";
import "better-auth";
import "better-auth/adapters/drizzle";
import "drizzle-orm/libsql";
import "@libsql/client";
import "drizzle-orm/sqlite-core";
import "drizzle-orm";
import "node-cron";
import "@langchain/google-genai";
import "@langchain/core/messages";
import "@langchain/langgraph";
import "axios";
import "luxon";
import "web-push";
import "clsx";
import "tailwind-merge";
import "better-auth/react";
import "@base-ui/react/dialog";
import "@base-ui/react/button";
import "class-variance-authority";
import "@base-ui/react/menu";
import "zod";
import "@paypal/react-paypal-js";
import "@base-ui/react/alert-dialog";
import "react-qr-code";
import "bignumber.js";
import "crypto";
import "@base-ui/react/input";
import "@ai-sdk/google";
import "ai";
import "nanoid";
import "cloudinary";
import "uuid";
import "@paypal/checkout-server-sdk";
import "node:crypto";
import "@solana/web3.js";
import "@solana/pay";
async function verifyTokenTransfer(txHash, recipientAccountId) {
  const near = await getNearConnection();
  const tokenContract = NEAR_CONFIG.chocoTokenContract;
  try {
    const accountCandidates = ["rogulus.testnet", recipientAccountId, tokenContract];
    let txStatus = null;
    let lastError = null;
    for (let i = 0; i < 10; i++) {
      for (const accountId of accountCandidates) {
        try {
          txStatus = await near.connection.provider.txStatus(txHash, accountId, "final");
          if (txStatus) break;
        } catch (err) {
          lastError = err;
        }
      }
      if (txStatus) break;
      console.log(`[Verify] Waiting for indexer... (${i + 1}/10)`);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    }
    if (!txStatus) throw new Error(`Transaction ${txHash} not found: ${lastError?.message}`);
    const status = txStatus.status;
    const isSuccess = status.SuccessValue !== void 0 || status.SuccessReceiptId !== void 0;
    if (!isSuccess) throw new Error("Transaction failed on-chain");
    const receipts = txStatus.receipts_outcome || [];
    let transferInfo = null;
    for (const receipt of receipts) {
      const outcome = receipt.outcome;
      const logs = outcome.logs || [];
      for (const log of logs) {
        if (log.includes("EVENT_JSON")) {
          const jsonMatch = log.match(/EVENT_JSON:(.+)/);
          if (jsonMatch) {
            const eventData = JSON.parse(jsonMatch[1]);
            if (eventData.standard === "nep141" && eventData.event === "ft_transfer") {
              for (const transfer of eventData.data) {
                if (transfer.new_owner_id === recipientAccountId) {
                  transferInfo = { from: transfer.old_owner_id, to: transfer.new_owner_id, amount: transfer.amount };
                  break;
                }
              }
            }
          }
        }
        if (transferInfo) break;
      }
      if (transferInfo) break;
    }
    if (!transferInfo) throw new Error("No valid CHOCO transfer found");
    return { ...transferInfo, isValid: true };
  } catch (error) {
    console.error(`Failed to verify tx ${txHash}:`, error);
    return { from: "", to: "", amount: "0", isValid: false };
  }
}
async function sendGaslessChocoToken(userAccountId, userPrivateKey, toAccountId, amountRaw, memo = "Gasless Transfer") {
  const { KeyPair } = await import("near-api-js");
  const near = await getNearConnection();
  const networkId = NEAR_CONFIG.networkId;
  const serviceAccountId = NEAR_CONFIG.serviceAccountId;
  const userKeyPair = KeyPair.fromString(userPrivateKey);
  await near.connection.signer.keyStore.setKey(networkId, userAccountId, userKeyPair);
  await near.account(userAccountId);
  const serviceAccount = await near.account(serviceAccountId);
  const block = await near.connection.provider.block({ finality: "final" });
  const currentBlockHeight = block.header.height;
  const publicKey = userKeyPair.getPublicKey();
  const accessKeyRes = await near.connection.provider.query({
    request_type: "view_access_key",
    finality: "final",
    account_id: userAccountId,
    public_key: publicKey.toString()
  });
  const currentNonce = BigInt(accessKeyRes.nonce);
  const innerAction = nearTransactions.actionCreators.functionCall(
    "ft_transfer",
    { receiver_id: toAccountId, amount: amountRaw, memo },
    BigInt("30000000000000"),
    BigInt(1)
  );
  const delegateAction = new nearTransactions.DelegateAction({
    actions: [innerAction],
    maxBlockHeight: BigInt(currentBlockHeight) + BigInt(100),
    nonce: currentNonce + BigInt(1),
    publicKey,
    receiverId: NEAR_CONFIG.chocoTokenContract,
    senderId: userAccountId
  });
  const { signature } = await near.connection.signer.signMessage(
    nearTransactions.encodeDelegateAction(delegateAction),
    userAccountId,
    networkId
  );
  const signedDelegate = new nearTransactions.SignedDelegate({
    delegateAction,
    signature: new nearTransactions.Signature({
      keyType: KeyType.ED25519,
      data: signature
    })
  });
  const result = await serviceAccount.signAndSendTransaction({
    receiverId: userAccountId,
    actions: [nearTransactions.actionCreators.signedDelegate(signedDelegate)]
  });
  return result;
}
async function sendChocoToken(toAccountId, amountRaw) {
  const { ensureStorageDeposit } = await import("./server-build-ugncUK38.js").then((n) => n.l);
  await ensureStorageDeposit(toAccountId);
  const near = await getNearConnection();
  const serviceAccount = await near.account(NEAR_CONFIG.serviceAccountId);
  return await serviceAccount.functionCall({
    contractId: NEAR_CONFIG.chocoTokenContract,
    methodName: "ft_transfer",
    args: { receiver_id: toAccountId, amount: amountRaw, memo: "Choco Reward" },
    attachedDeposit: BigInt(1),
    gas: BigInt("30000000000000")
  });
}
async function returnChocoToService(userAccountId, userPrivateKey, amountRaw, memo = "Choco Usage") {
  return await sendGaslessChocoToken(
    userAccountId,
    userPrivateKey,
    NEAR_CONFIG.serviceAccountId,
    amountRaw
  );
}
async function getChocoBalance(accountId) {
  const near = await getNearConnection();
  const serviceAccount = await near.account(NEAR_CONFIG.serviceAccountId);
  try {
    const balance = await serviceAccount.viewFunction({
      contractId: NEAR_CONFIG.chocoTokenContract,
      methodName: "ft_balance_of",
      args: { account_id: accountId }
    });
    return balance.toString();
  } catch (error) {
    console.error(`Failed to get CHOCO balance for ${accountId}:`, error);
    return "0";
  }
}
export {
  getChocoBalance,
  returnChocoToService,
  sendChocoToken,
  sendGaslessChocoToken,
  verifyTokenTransfer
};
