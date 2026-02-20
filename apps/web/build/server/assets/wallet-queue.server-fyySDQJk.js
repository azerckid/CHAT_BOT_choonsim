import { d as db, u as user, e as ensureNearWalletOnChain } from "./server-build-ugncUK38.js";
import { and, sql, or, eq } from "drizzle-orm";
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
const MAX_RETRY_COUNT = 3;
const BATCH_SIZE = 10;
const STUCK_TIMEOUT_MS = 5 * 60 * 1e3;
async function processWalletCreationQueue() {
  const now = /* @__PURE__ */ new Date();
  const stuckThreshold = new Date(now.getTime() - STUCK_TIMEOUT_MS);
  const pendingUsers = await db.query.user.findMany({
    where: and(
      sql`${user.nearAccountId} IS NOT NULL`,
      sql`${user.nearPublicKey} IS NOT NULL`,
      sql`${user.nearPrivateKey} IS NOT NULL`,
      or(
        eq(user.walletStatus, "PENDING"),
        and(
          eq(user.walletStatus, "FAILED"),
          sql`${user.walletRetryCount} < ${MAX_RETRY_COUNT}`
        ),
        and(
          eq(user.walletStatus, "CREATING"),
          sql`${user.walletCreatedAt} < ${Math.floor(stuckThreshold.getTime() / 1e3)}`
        )
      )
    ),
    columns: {
      id: true,
      nearAccountId: true,
      nearPublicKey: true,
      nearPrivateKey: true,
      walletRetryCount: true
    },
    limit: BATCH_SIZE
  });
  if (pendingUsers.length === 0) return;
  console.log(`[Wallet Queue] Processing ${pendingUsers.length} pending wallet(s)`);
  for (const user$1 of pendingUsers) {
    try {
      const updated = await db.update(user).set({
        walletStatus: "CREATING",
        walletCreatedAt: now,
        walletError: null,
        updatedAt: now
      }).where(and(
        eq(user.id, user$1.id),
        or(
          eq(user.walletStatus, "PENDING"),
          eq(user.walletStatus, "FAILED"),
          eq(user.walletStatus, "CREATING")
          // stuck recovery
        )
      ));
      await ensureNearWalletOnChain(
        user$1.id,
        user$1.nearAccountId,
        user$1.nearPublicKey,
        user$1.nearPrivateKey
      );
      await db.update(user).set({
        walletStatus: "READY",
        walletCompletedAt: /* @__PURE__ */ new Date(),
        walletError: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, user$1.id));
      console.log(`[Wallet Queue] SUCCESS: user ${user$1.id} (${user$1.nearAccountId})`);
    } catch (error) {
      const retryCount = (user$1.walletRetryCount ?? 0) + 1;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const isFinalFailure = retryCount >= MAX_RETRY_COUNT;
      await db.update(user).set({
        walletStatus: "FAILED",
        walletRetryCount: retryCount,
        walletError: `[${retryCount}/${MAX_RETRY_COUNT}] ${errorMessage}`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, user$1.id));
      if (isFinalFailure) {
        console.error(`[Wallet Queue] FINAL FAILURE (${MAX_RETRY_COUNT} retries exhausted) for user ${user$1.id}:`, errorMessage);
      } else {
        console.warn(`[Wallet Queue] RETRY ${retryCount}/${MAX_RETRY_COUNT} for user ${user$1.id}:`, errorMessage);
      }
    }
  }
}
export {
  processWalletCreationQueue
};
