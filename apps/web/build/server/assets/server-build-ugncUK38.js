import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, redirect, useLocation, Link, useFetcher, useLoaderData, useNavigate, useRevalidator, useParams, data, useSearchParams, useActionData, useNavigation, Form, useSubmit } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { Toaster as Toaster$1, toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, MultiplicationSignCircleIcon, Alert02Icon, InformationCircleIcon, CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useState, useEffect, useCallback, useRef } from "react";
import { X, Wallet, ShieldCheck, ArrowRight, CheckCircle2, History, Copy, QrCode, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import * as nearApi from "near-api-js";
import { keyStores, KeyPair as KeyPair$1, connect, utils as utils$1, providers } from "near-api-js";
import { Buffer as Buffer$1 } from "buffer";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sqliteTable, integer, text, real, index as index$b, unique, blob } from "drizzle-orm/sqlite-core";
import { sql, relations, eq, desc, asc, and, inArray, like as like$1, gte, lt, count, isNotNull, or, sum } from "drizzle-orm";
import cron from "node-cron";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import axios from "axios";
import { DateTime } from "luxon";
import webpush from "web-push";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createAuthClient } from "better-auth/react";
import { Dialog as Dialog$1 } from "@base-ui/react/dialog";
import { Button as Button$1 } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import { Menu } from "@base-ui/react/menu";
import { z } from "zod";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { AlertDialog as AlertDialog$1 } from "@base-ui/react/alert-dialog";
import QRCode from "react-qr-code";
import BigNumber$1, { BigNumber } from "bignumber.js";
import crypto$1 from "crypto";
import { Input as Input$1 } from "@base-ui/react/input";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { nanoid } from "nanoid";
import { v2 } from "cloudinary";
import { v4 } from "uuid";
import paypal from "@paypal/checkout-server-sdk";
import crypto$2 from "node:crypto";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import { encodeURL, findReference, validateTransfer } from "@solana/pay";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const Toaster = ({ ...props }) => {
  const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      theme: isDark ? "dark" : "light",
      className: "toaster group",
      icons: {
        success: /* @__PURE__ */ jsx(HugeiconsIcon, { icon: CheckmarkCircle02Icon, strokeWidth: 2, className: "size-4" }),
        info: /* @__PURE__ */ jsx(HugeiconsIcon, { icon: InformationCircleIcon, strokeWidth: 2, className: "size-4" }),
        warning: /* @__PURE__ */ jsx(HugeiconsIcon, { icon: Alert02Icon, strokeWidth: 2, className: "size-4" }),
        error: /* @__PURE__ */ jsx(HugeiconsIcon, { icon: MultiplicationSignCircleIcon, strokeWidth: 2, className: "size-4" }),
        loading: /* @__PURE__ */ jsx(HugeiconsIcon, { icon: Loading03Icon, strokeWidth: 2, className: "size-4 animate-spin" })
      },
      style: {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)"
      },
      toastOptions: {
        classNames: {
          toast: "cn-toast"
        }
      },
      ...props
    }
  );
};
if (typeof window !== "undefined") {
  window.Buffer = Buffer$1;
}
const getNearConfig = () => {
  return {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://testnet.mynearwallet.com",
    helperUrl: "https://helper.testnet.near.org"
  };
};
async function initNearConnection() {
  if (typeof window === "undefined") return null;
  const config = getNearConfig();
  return await nearApi.connect({
    ...config,
    keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore()
  });
}
async function isWalletConnected() {
  if (typeof window === "undefined") return false;
  try {
    const near = await initNearConnection();
    if (!near) return false;
    const wallet = new nearApi.WalletConnection(near, "choonsim");
    return wallet.isSignedIn();
  } catch (error) {
    return false;
  }
}
async function getCurrentAccountId() {
  if (typeof window === "undefined") return null;
  try {
    const near = await initNearConnection();
    if (!near) return null;
    const wallet = new nearApi.WalletConnection(near, "choonsim");
    return wallet.isSignedIn() ? wallet.getAccountId() : null;
  } catch (error) {
    return null;
  }
}
async function requestWalletConnection() {
  if (typeof window === "undefined") return null;
  try {
    const near = await initNearConnection();
    if (!near) throw new Error("NEAR init failed");
    const wallet = new nearApi.WalletConnection(near, "choonsim");
    if (wallet.isSignedIn()) return wallet.getAccountId();
    const tokenContract = "choco.token.primitives.testnet";
    await wallet.requestSignIn({
      contractId: tokenContract,
      methodNames: ["ft_transfer_call"]
    });
    return null;
  } catch (error) {
    throw error;
  }
}
async function getChocoBalance(accountId, tokenContract) {
  if (typeof window === "undefined") return "0";
  try {
    const near = await initNearConnection();
    if (!near) return "0";
    const account2 = await near.account(tokenContract);
    const balanceRaw = await account2.viewFunction({
      contractId: tokenContract,
      methodName: "ft_balance_of",
      args: { account_id: accountId }
    });
    return (parseFloat(balanceRaw) / 1e18).toString();
  } catch (error) {
    return "0";
  }
}
async function createSignedDelegate(accountId, receiverId, actions) {
  const near = await initNearConnection();
  if (!near) throw new Error("NEAR init failed");
  const account2 = await near.account(accountId);
  const accessKey = await account2.findAccessKey(accountId, []);
  if (!accessKey) throw new Error("No access key");
  const block = await near.connection.provider.block({ finality: "final" });
  const delegateAction = nearApi.transactions.createDelegateAction({
    senderId: accountId,
    receiverId,
    actions,
    nonce: BigInt(accessKey.accessKey.nonce) + BigInt(1),
    maxBlockHeight: BigInt(block.header.height) + BigInt(100),
    publicKey: nearApi.utils.PublicKey.from(accessKey.publicKey)
  });
  const { networkId } = getNearConfig();
  const signedDelegate = await nearApi.transactions.signDelegateAction({
    delegateAction,
    signer: near.connection.signer,
    networkId
  });
  return Buffer$1.from(signedDelegate.encode()).toString("base64");
}
async function transferChocoTokenGasless(accountId, recipientId, amount, tokenContract) {
  const amountFloat = parseFloat(amount);
  const amountBigInt = BigInt(Math.floor(amountFloat * 1e18)).toString();
  const action2 = nearApi.transactions.functionCall(
    "ft_transfer_call",
    { receiver_id: recipientId, amount: amountBigInt, msg: "" },
    BigInt("30000000000000"),
    BigInt("1")
  );
  const signedDelegateBase64 = await createSignedDelegate(accountId, tokenContract, [action2]);
  const res = await fetch("/api/relayer/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedDelegate: signedDelegateBase64 })
  });
  const data2 = await res.json();
  if (!res.ok) throw new Error(data2.error || "Relay failed");
  return data2.txHash;
}
async function transferChocoToken(accountId, recipientId, amount, tokenContract) {
  const near = await initNearConnection();
  if (!near) throw new Error("NEAR init failed");
  const account2 = await near.account(accountId);
  const amountFloat = parseFloat(amount);
  const amountBigInt = BigInt(Math.floor(amountFloat * 1e18)).toString();
  const result = await account2.functionCall({
    contractId: tokenContract,
    methodName: "ft_transfer_call",
    args: { receiver_id: recipientId, amount: amountBigInt, msg: "" },
    attachedDeposit: BigInt(1),
    gas: BigInt("30000000000000")
  });
  return result.transaction.hash;
}
const CHAIN_LABELS = {
  /** 지갑 연결 요청 문구 */
  WALLET_CONNECT_PROMPT: "지갑을 연결해 주세요",
  /** 지갑 연결 버튼 */
  WALLET_CONNECT_BUTTON: "지갑 연결하기",
  /** 입금 다이얼로그 제목 */
  DEPOSIT_DIALOG_TITLE: "입금 받기",
  /** 입금 안내 문구 */
  DEPOSIT_INSTRUCTION: "아래 QR 코드를 스캔하거나 주소를 복사하여 입금하세요.",
  /** 환전 다이얼로그 설명 */
  SWAP_DESCRIPTION: "입금된 자산을 감지하여 CHOCO로 변환합니다.",
  /** 현재 환율 표시 (좌측 단위) */
  RATE_FROM_UNIT: "1",
  /** 입금 확인 문구 */
  DEPOSIT_CONFIRM_PROMPT: "입금하셨나요?",
  /** 히스토리에서 체인 표시 시 (환전 건) */
  HISTORY_LABEL_SWAP: "환전 (Swap)",
  /** 히스토리에서 체인 표시 시 (사용 건) */
  HISTORY_LABEL_USE: "사용",
  /** 히스토리 금액 표시 시 fromChain 대체 (NEAR 등) */
  HISTORY_AMOUNT_UNIT: "입금"
};
function formatChainForDisplay(chain) {
  if (!chain) return CHAIN_LABELS.HISTORY_LABEL_USE;
  const upper = String(chain).toUpperCase();
  if (upper === "NEAR") return CHAIN_LABELS.HISTORY_LABEL_SWAP;
  return chain;
}
function formatChainUnitForDisplay(chain) {
  if (!chain) return CHAIN_LABELS.HISTORY_AMOUNT_UNIT;
  const upper = String(chain).toUpperCase();
  if (upper === "NEAR") return CHAIN_LABELS.HISTORY_AMOUNT_UNIT;
  return chain;
}
function PaymentSheet({
  isOpen,
  onClose,
  token,
  invoice,
  onSuccess
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState("review");
  const [txHash, setTxHash] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [balance, setBalance] = useState("0");
  const [error, setError] = useState(null);
  const [useRelayer, setUseRelayer] = useState(true);
  useEffect(() => {
    if (isOpen) {
      checkWalletStatus();
    }
  }, [isOpen]);
  const checkWalletStatus = async () => {
    const connected = await isWalletConnected();
    setWalletConnected(connected);
    if (connected) {
      const account2 = await getCurrentAccountId();
      setAccountId(account2);
      if (account2) {
        try {
          const bal = await getChocoBalance(account2, invoice.tokenContract);
          setBalance(bal);
        } catch (e) {
          console.error("Failed to fetch balance:", e);
        }
      }
    }
  };
  if (!isOpen) return null;
  const handleConnectWallet = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const account2 = await requestWalletConnection();
      if (account2) {
        setAccountId(account2);
        setWalletConnected(true);
        const bal = await getChocoBalance(account2, invoice.tokenContract);
        setBalance(bal);
      } else {
        setError("지갑 연결에 실패했습니다.");
      }
    } catch (e) {
      console.error("Wallet connection error details:", e);
      setError(`지갑 연결 실패: ${e.message || "알 수 없는 오류"}`);
    } finally {
      setIsProcessing(false);
    }
  };
  const handlePay = async () => {
    if (!walletConnected || !accountId) {
      await handleConnectWallet();
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const currentBalance = parseFloat(balance);
      const requiredAmount = parseFloat(invoice.amount);
      if (currentBalance < requiredAmount) {
        setError(`잔액이 부족합니다. (보유: ${balance} CHOCO, 필요: ${invoice.amount} CHOCO)`);
        setIsProcessing(false);
        return;
      }
      let txHashResult;
      if (useRelayer) {
        txHashResult = await transferChocoTokenGasless(
          accountId,
          invoice.recipient,
          invoice.amount,
          invoice.tokenContract
        );
      } else {
        txHashResult = await transferChocoToken(
          accountId,
          invoice.recipient,
          invoice.amount,
          invoice.tokenContract
        );
      }
      const res = await fetch("/api/x402/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, txHash: txHashResult })
      });
      if (res.ok) {
        setTxHash(txHashResult);
        setStep("success");
        setTimeout(() => {
          onSuccess(txHashResult);
        }, 1500);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "결제 검증에 실패했습니다.");
      }
    } catch (e) {
      console.error("Payment error:", e);
      setError(e.message || "결제 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "payment-sheet-overlay", children: [
    /* @__PURE__ */ jsxs("div", { className: `payment-sheet ${isOpen ? "open" : ""}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "sheet-header", children: [
        /* @__PURE__ */ jsx("h3", { children: step === "review" ? "CHOCO 결제 승인" : "결제 완료!" }),
        /* @__PURE__ */ jsx("button", { className: "close-btn", onClick: onClose, disabled: isProcessing, children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "sheet-content", children: step === "review" ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "invoice-summary", children: [
          /* @__PURE__ */ jsxs("div", { className: "amount-display", children: [
            /* @__PURE__ */ jsx("span", { className: "price", children: invoice.amount }),
            /* @__PURE__ */ jsx("span", { className: "unit", children: invoice.currency })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "description", children: "AI 에이전트 서비스 이용권" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "payment-info card", children: [
          /* @__PURE__ */ jsxs("div", { className: "info-row", children: [
            /* @__PURE__ */ jsx("span", { className: "label", children: "결제 수단" }),
            /* @__PURE__ */ jsxs("span", { className: "value flex-center", children: [
              /* @__PURE__ */ jsx(Wallet, { size: 14, className: "mr-4" }),
              walletConnected && accountId ? /* @__PURE__ */ jsx("span", { className: "truncate", children: accountId }) : /* @__PURE__ */ jsx("span", { className: "text-pink-400 font-bold animate-pulse", children: CHAIN_LABELS.WALLET_CONNECT_PROMPT })
            ] })
          ] }),
          walletConnected && accountId && /* @__PURE__ */ jsxs("div", { className: "info-row", children: [
            /* @__PURE__ */ jsx("span", { className: "label", children: "내 지갑 잔고" }),
            /* @__PURE__ */ jsxs("span", { className: "value font-bold text-success", children: [
              balance,
              " CHOCO"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "info-row", children: [
            /* @__PURE__ */ jsx("span", { className: "label", children: "충전 예정 금액" }),
            /* @__PURE__ */ jsxs("span", { className: "value font-bold text-pink-500", children: [
              "+",
              invoice.amount,
              " CHOCO"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "info-row", children: [
            /* @__PURE__ */ jsx("span", { className: "label", children: "수신처" }),
            /* @__PURE__ */ jsx("span", { className: "value truncate", children: invoice.recipient })
          ] })
        ] }),
        error && /* @__PURE__ */ jsxs("div", { className: "error-message", children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold mb-1", children: "문제가 발생했나요?" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs mb-3 opacity-80", children: error }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => window.location.href = "/profile/subscription",
              className: "w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors",
              children: "다른 결제 수단으로 충전하기 (PayPal/Toss)"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "security-badge", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { size: 16, className: "text-success" }),
          /* @__PURE__ */ jsx("span", { children: "온체인 보안 기술로 보호되는 안전한 거래입니다." })
        ] }),
        !walletConnected ? /* @__PURE__ */ jsxs("div", { className: "button-group-vertical", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `pay-button ${isProcessing ? "loading" : ""}`,
              onClick: handleConnectWallet,
              disabled: isProcessing,
              children: [
                isProcessing ? "지갑 연결 중..." : CHAIN_LABELS.WALLET_CONNECT_BUTTON,
                !isProcessing && /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
              ]
            }
          ),
          !isProcessing && /* @__PURE__ */ jsx(
            "button",
            {
              className: "secondary-action-button",
              onClick: () => window.location.href = "/profile/subscription",
              children: "일반 결제(카드/페이)로 충전할래요"
            }
          )
        ] }) : /* @__PURE__ */ jsxs(
          "button",
          {
            className: `pay-button ${isProcessing ? "loading" : ""}`,
            onClick: handlePay,
            disabled: isProcessing,
            children: [
              isProcessing ? "트랜잭션 승인 중..." : "결제하기",
              !isProcessing && /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsxs("div", { className: "success-view", children: [
        /* @__PURE__ */ jsx("div", { className: "success-icon-wrapper", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 64, className: "text-success pulse" }) }),
        /* @__PURE__ */ jsx("h4", { children: "결제가 정상적으로 처리되었습니다." }),
        /* @__PURE__ */ jsxs("p", { className: "tx-text", children: [
          "TxID: ",
          txHash
        ] }),
        /* @__PURE__ */ jsx("div", { className: "auto-close-hint", children: "잠시 후 계속됩니다..." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: {
      __html: `
                .payment-sheet-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }

                .payment-sheet {
                    width: 100%;
                    max-width: 500px;
                    background: #1a1a1a;
                    border-radius: 24px 24px 0 0;
                    padding: 24px;
                    transform: translateY(100%);
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-bottom: none;
                    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
                }

                .payment-sheet.open {
                    transform: translateY(0);
                }

                .sheet-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .sheet-header h3 {
                    font-size: 18px;
                    font-weight: 700;
                    color: white;
                }

                .close-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .invoice-summary {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .amount-display {
                    display: flex;
                    align-items: baseline;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .amount-display .price {
                    font-size: 42px;
                    font-weight: 800;
                    color: #ec4899;
                }

                .amount-display .unit {
                    font-size: 18px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.5);
                }

                .description {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .payment-info.card {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    font-size: 14px;
                }

                .info-row:not(:last-child) {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                }

                .info-row .label { opacity: 0.5; }
                .info-row .value { font-weight: 500; }

                .security-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.4);
                    justify-content: center;
                    margin-bottom: 24px;
                }

                .text-success { color: #10b981; }

                .pay-button {
                    width: 100%;
                    height: 56px;
                    background: linear-gradient(135deg, #ec4899, #be185d);
                    border: none;
                    border-radius: 16px;
                    color: white;
                    font-size: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: transform 0.1s;
                }

                .pay-button:active { transform: scale(0.98); }
                .pay-button:disabled { opacity: 0.6; cursor: not-allowed; }

                .success-view {
                    text-align: center;
                    padding: 20px 0;
                }

                .success-icon-wrapper {
                    margin-bottom: 20px;
                }

                .tx-text {
                    font-family: monospace;
                    font-size: 12px;
                    opacity: 0.5;
                    margin-top: 12px;
                }

                .auto-close-hint {
                    margin-top: 24px;
                    font-size: 12px;
                    opacity: 0.3;
                }

                .mr-4 { margin-right: 4px; }
                .flex-center { display: flex; align-items: center; }
                .truncate { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse { animation: pulse 2s infinite ease-in-out; }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 20px;
                    color: #fca5a5;
                    font-size: 14px;
                    text-align: center;
                }

                .button-group-vertical {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .secondary-action-button {
                    width: 100%;
                    padding: 12px;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .secondary-action-button:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .mb-1 { margin-bottom: 4px; }
                .mb-3 { margin-bottom: 12px; }
                .opacity-80 { opacity: 0.8; }
                .font-bold { font-weight: 700; }
                .text-xs { font-size: 12px; }
            `
    } })
  ] });
}
function parseX402Headers(response) {
  const token = response.headers.get("X-x402-Token");
  const invoiceRaw = response.headers.get("X-x402-Invoice");
  const allowanceRaw = response.headers.get("X-x402-Allowance");
  if (!token || !invoiceRaw) return null;
  try {
    const invoice = JSON.parse(invoiceRaw);
    let allowance = null;
    if (allowanceRaw) {
      try {
        allowance = JSON.parse(allowanceRaw);
      } catch (e) {
        console.warn("Failed to parse X402 Allowance header", e);
      }
    }
    return { token, invoice, allowance };
  } catch (e) {
    console.error("Failed to parse X402 Invoice header", e);
    return null;
  }
}
function useX402() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [activeToken, setActiveToken] = useState(null);
  const [activeAllowance, setActiveAllowance] = useState(null);
  const [retryFn, setRetryFn] = useState(null);
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      if (response.status === 402) {
        const x402 = parseX402Headers(response);
        if (x402) {
          if (x402.allowance?.canAutoPay && x402.invoice) {
            try {
              const connected = await isWalletConnected();
              if (!connected) {
                return handlePaymentSheet(x402, originalFetch, input, init);
              }
              const accountId = await getCurrentAccountId();
              if (!accountId) {
                return handlePaymentSheet(x402, originalFetch, input, init);
              }
              const txHash = await transferChocoTokenGasless(
                accountId,
                x402.invoice.recipient,
                x402.invoice.amount,
                x402.invoice.tokenContract
              );
              const verifyRes = await fetch("/api/x402/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: x402.token, txHash })
              });
              if (verifyRes.ok) {
                return originalFetch(input, init);
              } else {
                return handlePaymentSheet(x402, originalFetch, input, init);
              }
            } catch (error) {
              console.error("Auto payment failed:", error);
              return handlePaymentSheet(x402, originalFetch, input, init);
            }
          } else {
            return handlePaymentSheet(x402, originalFetch, input, init);
          }
        }
      }
      return response;
    };
    const handlePaymentSheet = (x402, originalFetch2, input, init) => {
      return new Promise((resolve) => {
        setActiveInvoice(x402.invoice);
        setActiveToken(x402.token);
        setActiveAllowance(x402.allowance || null);
        setIsOpen(true);
        setRetryFn(() => async () => {
          const retriedResponse = await originalFetch2(input, init);
          resolve(retriedResponse);
        });
      });
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  const handleSuccess = useCallback((txHash) => {
    console.log("X402 Payment Success:", txHash);
    setIsOpen(false);
    if (retryFn) {
      retryFn();
      setRetryFn(null);
    }
  }, [retryFn]);
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  return {
    isOpen,
    token: activeToken,
    invoice: activeInvoice,
    allowance: activeAllowance,
    handleSuccess,
    handleClose
  };
}
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    className: "dark",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, user-scalable=yes"
      }), /* @__PURE__ */ jsx("meta", {
        name: "theme-color",
        content: "#ee2b8c"
      }), /* @__PURE__ */ jsx("meta", {
        name: "mobile-web-app-capable",
        content: "yes"
      }), /* @__PURE__ */ jsx("meta", {
        name: "apple-mobile-web-app-capable",
        content: "yes"
      }), /* @__PURE__ */ jsx("meta", {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(Toaster, {}), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  const {
    isOpen,
    token,
    invoice,
    handleSuccess,
    handleClose
  } = useX402();
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx(Outlet, {}), token && invoice && /* @__PURE__ */ jsx(PaymentSheet, {
      isOpen,
      onClose: handleClose,
      token,
      invoice,
      onSuccess: handleSuccess
    })]
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message2 = "Oops!";
  let details = "알 수 없는 오류가 발생했습니다.";
  let stack;
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message2 = "404";
      details = "요청하신 페이지를 찾을 수 없습니다.";
    } else if (error.status === 403) {
      message2 = "접근 권한 없음";
      details = "관리자 권한이 필요한 페이지입니다. 관리자 계정으로 다시 로그인해 주세요.";
    } else if (error.status === 401) {
      message2 = "로그인 필요";
      details = "서비스를 이용하시려면 로그인이 필요합니다.";
    } else {
      message2 = error.status.toString();
      details = error.statusText || "서버 오류가 발생했습니다.";
    }
  }
  return /* @__PURE__ */ jsx("main", {
    className: "min-h-screen flex flex-col items-center justify-center p-6 bg-[#0B0A10] text-white font-sans",
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
      children: [/* @__PURE__ */ jsx("div", {
        className: "w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-2xl shadow-primary/10",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-primary text-5xl",
          children: isRouteErrorResponse(error) && error.status === 403 ? "lock_person" : "warning"
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "space-y-2",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-4xl font-black italic tracking-tighter uppercase leading-none",
          children: message2
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/40 font-medium text-sm leading-relaxed",
          children: details
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "pt-4",
        children: /* @__PURE__ */ jsx("a", {
          href: "/",
          className: "inline-flex items-center gap-2 px-8 py-4 bg-primary text-black rounded-2xl font-black italic text-sm tracking-tighter hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,0,255,0.3)]",
          children: "메인으로 돌아가기"
        })
      }), stack]
    })
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
async function loader$J({
  request
}) {
  throw redirect("/home");
}
const index$a = UNSAFE_withComponentProps(function Index() {
  return null;
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$a,
  loader: loader$J
}, Symbol.toStringTag, { value: "Module" }));
const user = sqliteTable("User", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password"),
  name: text("name"),
  image: text("image"),
  provider: text("provider").notNull().default("local"),
  snsId: text("snsId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  avatarUrl: text("avatarUrl"),
  status: text("status").notNull().default("OFFLINE"),
  /** @deprecated Phase 9: memory는 5계층(UserContext/UserMemoryItem)으로 이전. 읽기 fallback만 유지, 쓰기 중단. */
  bio: text("bio"),
  coverImage: text("coverImage"),
  isPrivate: integer("isPrivate", { mode: "boolean" }).default(false),
  checkInTime: text("checkInTime"),
  pushSubscription: text("pushSubscription"),
  subscriptionTier: text("subscriptionTier").default("FREE"),
  subscriptionStatus: text("subscriptionStatus"),
  subscriptionId: text("subscriptionId").unique(),
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp" }),
  lastTokenRefillAt: integer("lastTokenRefillAt", { mode: "timestamp" }),
  credits: integer("credits").notNull().default(0),
  role: text("role").default("USER"),
  nearAccountId: text("nearAccountId").unique(),
  nearPublicKey: text("nearPublicKey"),
  nearPrivateKey: text("nearPrivateKey"),
  // Encrypted private key
  chocoBalance: text("chocoBalance").notNull().default("0"),
  // BigNumber string
  chocoLastSyncAt: integer("chocoLastSyncAt", { mode: "timestamp" }),
  heartsCount: integer("heartsCount").notNull().default(0),
  allowanceAmount: real("allowanceAmount").default(0),
  allowanceCurrency: text("allowanceCurrency").default("USD"),
  allowanceExpiresAt: integer("allowanceExpiresAt", { mode: "timestamp" }),
  isSweepEnabled: integer("isSweepEnabled", { mode: "boolean" }).default(true),
  nearLastBalance: text("nearLastBalance").notNull().default("0"),
  // BigNumber string for deposit detection
  walletStatus: text("walletStatus"),
  // "PENDING" | "CREATING" | "READY" | "FAILED" | null (no wallet yet)
  walletCreatedAt: integer("walletCreatedAt", { mode: "timestamp" }),
  // background job start time
  walletCompletedAt: integer("walletCompletedAt", { mode: "timestamp" }),
  // completion time
  walletError: text("walletError"),
  // error message on failure
  walletRetryCount: integer("walletRetryCount").notNull().default(0)
  // retry count (max 3)
});
const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull()
});
const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
});
const character = sqliteTable("Character", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio").notNull(),
  personaPrompt: text("personaPrompt").notNull(),
  greetingMessage: text("greetingMessage"),
  isOnline: integer("isOnline", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const characterMedia = sqliteTable("CharacterMedia", {
  id: text("id").primaryKey(),
  characterId: text("characterId").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => {
  return [
    index$b("CharacterMedia_charId_type_v2_idx").on(table.characterId, table.type)
  ];
});
const item = sqliteTable("Item", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  priceCredits: integer("priceCredits"),
  // Deprecated: 호환성을 위해 유지
  priceChoco: integer("priceChoco"),
  // 신규: CHOCO 가격 (1 Credit = 1 CHOCO)
  priceUSD: real("priceUSD"),
  priceKRW: real("priceKRW"),
  iconUrl: text("iconUrl"),
  description: text("description"),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
}, (table) => {
  return [
    index$b("Item_isActive_idx").on(table.isActive)
  ];
});
const characterStat = sqliteTable("CharacterStat", {
  id: text("id").primaryKey(),
  characterId: text("characterId").notNull().unique(),
  totalHearts: integer("totalHearts").notNull().default(0),
  totalUniqueGivers: integer("totalUniqueGivers").notNull().default(0),
  currentEmotion: text("currentEmotion").default("JOY"),
  emotionExpiresAt: integer("emotionExpiresAt", { mode: "timestamp" }),
  lastGiftAt: integer("lastGiftAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
}, (table) => {
  return [
    index$b("CharacterStat_totalHearts_idx").on(table.totalHearts)
  ];
});
const giftLog = sqliteTable("GiftLog", {
  id: text("id").primaryKey(),
  fromUserId: text("fromUserId").notNull(),
  toCharacterId: text("toCharacterId").notNull(),
  itemId: text("itemId").notNull(),
  amount: integer("amount").notNull(),
  message: text("message"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => {
  return [
    index$b("GiftLog_fromUserId_createdAt_idx").on(table.fromUserId, table.createdAt),
    index$b("GiftLog_toCharacterId_createdAt_idx").on(table.toCharacterId, table.createdAt)
  ];
});
const userInventory = sqliteTable("UserInventory", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  itemId: text("itemId").notNull(),
  quantity: integer("quantity").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
}, (table) => {
  return [
    unique("UserInventory_userId_itemId_unique").on(table.userId, table.itemId)
  ];
});
const userContext = sqliteTable("UserContext", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  characterId: text("characterId").notNull(),
  // heartbeat (JSON) - 접속 리듬, 빈도
  heartbeatDoc: text("heartbeatDoc"),
  // identity (JSON) - 닉네임, 호칭, 관계
  identityDoc: text("identityDoc"),
  // soul (JSON) - 가치관, 소원, 고민
  soulDoc: text("soulDoc"),
  // tools (JSON) - 규칙, 특별한 날
  toolsDoc: text("toolsDoc"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => [
  unique("userContext_user_character_unique").on(table.userId, table.characterId),
  index$b("userContext_userId_idx").on(table.userId)
]);
const userMemoryItem = sqliteTable("UserMemoryItem", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  characterId: text("characterId").notNull(),
  // 기억 내용
  content: text("content").notNull(),
  category: text("category"),
  // preference, event, person, worry, etc.
  importance: integer("importance").notNull().default(5),
  // 1-10
  // 추출 원본 추적
  sourceConversationId: text("sourceConversationId"),
  sourceMessageId: text("sourceMessageId"),
  // 메타데이터
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  // 만료일 (선택)
  isArchived: integer("isArchived", { mode: "boolean" }).notNull().default(false)
}, (table) => [
  index$b("userMemoryItem_user_character_idx").on(table.userId, table.characterId),
  index$b("userMemoryItem_category_idx").on(table.category),
  index$b("userMemoryItem_importance_idx").on(table.importance)
]);
const conversation = sqliteTable("Conversation", {
  id: text("id").primaryKey(),
  characterId: text("characterId").notNull().default("chunsim"),
  title: text("title").notNull(),
  userId: text("userId"),
  personaMode: text("personaMode").notNull().default("lover"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const message = sqliteTable("Message", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  conversationId: text("conversationId").notNull(),
  mediaUrl: text("mediaUrl"),
  mediaType: text("mediaType"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  type: text("type").notNull().default("TEXT"),
  senderId: text("senderId"),
  roomId: text("roomId"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  isInterrupted: integer("isInterrupted", { mode: "boolean" }).notNull().default(false),
  interruptedAt: integer("interruptedAt", { mode: "timestamp" })
});
const messageLike = sqliteTable("MessageLike", {
  id: text("id").primaryKey(),
  messageId: text("messageId").notNull(),
  userId: text("userId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => {
  return [
    unique("MessageLike_messageId_userId_unique").on(table.messageId, table.userId)
  ];
});
const agentExecution = sqliteTable("AgentExecution", {
  id: text("id").primaryKey(),
  messageId: text("messageId").notNull(),
  agentName: text("agentName").notNull(),
  intent: text("intent").notNull(),
  promptTokens: integer("promptTokens").notNull().default(0),
  completionTokens: integer("completionTokens").notNull().default(0),
  totalTokens: integer("totalTokens").notNull().default(0),
  rawOutput: text("rawOutput"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const dMConversation = sqliteTable("DMConversation", {
  id: text("id").primaryKey(),
  isGroup: integer("isGroup", { mode: "boolean" }).notNull().default(false),
  groupName: text("groupName"),
  lastMessageAt: integer("lastMessageAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  isAccepted: integer("isAccepted", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const dMParticipant = sqliteTable("DMParticipant", {
  id: text("id").primaryKey(),
  conversationId: text("conversationId").notNull(),
  userId: text("userId").notNull(),
  joinedAt: integer("joinedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  leftAt: integer("leftAt", { mode: "timestamp" }),
  isAdmin: integer("isAdmin", { mode: "boolean" }).notNull().default(false)
});
const directMessage = sqliteTable("DirectMessage", {
  id: text("id").primaryKey(),
  conversationId: text("conversationId").notNull(),
  senderId: text("senderId").notNull(),
  content: text("content").notNull(),
  isRead: integer("isRead", { mode: "boolean" }).notNull().default(false),
  deletedBySender: integer("deletedBySender", { mode: "boolean" }).notNull().default(false),
  deletedByReceiver: integer("deletedByReceiver", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  mediaUrl: text("mediaUrl"),
  mediaType: text("mediaType")
});
const travelPlan = sqliteTable("TravelPlan", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: integer("startDate", { mode: "timestamp" }),
  endDate: integer("endDate", { mode: "timestamp" }),
  status: text("status").notNull().default("PLANNING"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const travelPlanItem = sqliteTable("TravelPlanItem", {
  id: text("id").primaryKey(),
  travelPlanId: text("travelPlanId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: integer("date", { mode: "timestamp" }),
  time: text("time"),
  locationName: text("locationName"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  order: integer("order").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  status: text("status").default("TODO")
});
const tweet = sqliteTable("Tweet", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  content: text("content").notNull(),
  parentId: text("parentId"),
  isRetweet: integer("isRetweet", { mode: "boolean" }).notNull().default(false),
  originalTweetId: text("originalTweetId"),
  deletedAt: integer("deletedAt", { mode: "timestamp" }),
  locationName: text("locationName"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  travelDate: integer("travelDate", { mode: "timestamp" }),
  country: text("country"),
  city: text("city"),
  travelPlanId: text("travelPlanId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  visibility: text("visibility").default("PUBLIC")
});
const tweetEmbedding = sqliteTable("TweetEmbedding", {
  id: text("id").primaryKey(),
  tweetId: text("tweetId").notNull().unique(),
  vector: blob("vector").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const tweetTravelTag = sqliteTable("TweetTravelTag", {
  id: text("id").primaryKey(),
  tweetId: text("tweetId").notNull(),
  travelTagId: text("travelTagId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const travelTag = sqliteTable("TravelTag", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const bookmark = sqliteTable("Bookmark", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  tweetId: text("tweetId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  collectionId: text("collectionId")
});
const bookmarkCollection = sqliteTable("BookmarkCollection", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const like = sqliteTable("Like", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  tweetId: text("tweetId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const retweet = sqliteTable("Retweet", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  tweetId: text("tweetId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const media = sqliteTable("Media", {
  id: text("id").primaryKey(),
  tweetId: text("tweetId").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  altText: text("altText"),
  order: integer("order").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  publicId: text("publicId")
});
const systemSettings = sqliteTable("SystemSettings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const follow = sqliteTable("Follow", {
  id: text("id").primaryKey(),
  followerId: text("followerId").notNull(),
  followingId: text("followingId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  status: text("status").default("ACCEPTED")
});
const payment = sqliteTable("Payment", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  description: text("description"),
  creditsGranted: integer("creditsGranted"),
  metadata: text("metadata"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  transactionId: text("transactionId").unique(),
  subscriptionId: text("subscriptionId"),
  paymentKey: text("paymentKey"),
  txHash: text("txHash").unique(),
  walletAddress: text("walletAddress"),
  cryptoCurrency: text("cryptoCurrency"),
  cryptoAmount: real("cryptoAmount"),
  exchangeRate: real("exchangeRate"),
  blockNumber: text("blockNumber"),
  confirmations: integer("confirmations").default(0),
  network: text("network")
}, (table) => {
  return [
    index$b("Payment_userId_createdAt_idx").on(table.userId, table.createdAt),
    index$b("Payment_transactionId_idx").on(table.transactionId),
    index$b("Payment_subscriptionId_idx").on(table.subscriptionId),
    index$b("Payment_txHash_idx").on(table.txHash),
    index$b("Payment_provider_status_idx").on(table.provider, table.status),
    index$b("Payment_type_idx").on(table.type)
  ];
});
const notice = sqliteTable("Notice", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("NOTICE"),
  imageUrl: text("imageUrl"),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  isPinned: integer("isPinned", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const systemLog = sqliteTable("SystemLog", {
  id: text("id").primaryKey(),
  level: text("level").notNull().default("INFO"),
  category: text("category").notNull().default("SYSTEM"),
  message: text("message").notNull(),
  stackTrace: text("stackTrace"),
  metadata: text("metadata"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const tokenTransfer = sqliteTable("TokenTransfer", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  txHash: text("txHash").notNull().unique(),
  amount: text("amount").notNull(),
  // BigNumber
  tokenContract: text("tokenContract").notNull(),
  status: text("status").notNull().default("PENDING"),
  // PENDING, COMPLETED, FAILED
  purpose: text("purpose").notNull(),
  // PAYMENT, TOPUP, WITHDRAW
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => {
  return [
    index$b("TokenTransfer_userId_idx").on(table.userId),
    index$b("TokenTransfer_txHash_idx").on(table.txHash)
  ];
});
const tokenConfig = sqliteTable("TokenConfig", {
  id: text("id").primaryKey(),
  tokenContract: text("tokenContract").notNull().unique(),
  tokenSymbol: text("tokenSymbol").notNull().default("CHOCO"),
  tokenName: text("tokenName").notNull().default("CHOONSIM Token"),
  decimals: integer("decimals").notNull().default(18),
  isEnabled: integer("isEnabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
const x402Invoice = sqliteTable("X402Invoice", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  // Invoice identifier token
  userId: text("userId").notNull(),
  amount: real("amount").notNull(),
  // USD
  currency: text("currency").notNull().default("USD"),
  chocoAmount: text("chocoAmount").notNull(),
  // BigNumber
  recipientAddress: text("recipientAddress").notNull(),
  status: text("status").notNull().default("PENDING"),
  // PENDING, PAID, EXPIRED
  txHash: text("txHash").unique(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  paidAt: integer("paidAt", { mode: "timestamp" })
}, (table) => {
  return [
    index$b("X402Invoice_token_idx").on(table.token),
    index$b("X402Invoice_userId_status_idx").on(table.userId, table.status)
  ];
});
const mission = sqliteTable("Mission", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rewardCredits: integer("rewardCredits").notNull().default(0),
  type: text("type").notNull().default("DAILY"),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const userMission = sqliteTable("UserMission", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  missionId: text("missionId").notNull(),
  status: text("status").notNull().default("IN_PROGRESS"),
  progress: integer("progress").notNull().default(0),
  lastUpdated: integer("lastUpdated", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => {
  return [
    unique("UserMission_userId_missionId_unique").on(table.userId, table.missionId)
  ];
});
const fanPost = sqliteTable("FanPost", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  likes: integer("likes").notNull().default(0),
  isApproved: integer("isApproved", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});
const relayerLog = sqliteTable("RelayerLog", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  requestIp: text("requestIp"),
  txHash: text("txHash"),
  error: text("error"),
  status: text("status").notNull().default("SUCCESS"),
  // SUCCESS, FAILED
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => {
  return [
    index$b("RelayerLog_userId_createdAt_idx").on(table.userId, table.createdAt),
    index$b("RelayerLog_requestIp_createdAt_idx").on(table.requestIp, table.createdAt)
  ];
});
const multichainAddress = sqliteTable("MultichainAddress", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  chain: text("chain").notNull(),
  // "NEAR", "BTC", "ETH", "SOL" 등
  address: text("address").notNull(),
  // 해당 체인의 주소
  derivationPath: text("derivationPath"),
  // 파생 경로
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
}, (table) => ({
  userIdChainUnique: unique().on(table.userId, table.chain),
  userIdIdx: index$b("multichainAddress_userId_idx").on(table.userId),
  chainIdx: index$b("multichainAddress_chain_idx").on(table.chain)
}));
const exchangeRate = sqliteTable("ExchangeRate", {
  id: text("id").primaryKey(),
  tokenPair: text("tokenPair").notNull().unique(),
  // "NEAR/USD", "ETH/USD" 등
  rate: real("rate").notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
}, (table) => ({
  tokenPairIdx: index$b("exchangeRate_tokenPair_idx").on(table.tokenPair)
}));
const exchangeLog = sqliteTable("ExchangeLog", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  fromChain: text("fromChain").notNull(),
  // "NEAR", "BTC", "ETH", "SOL"
  fromAmount: text("fromAmount").notNull(),
  // BigNumber string
  toToken: text("toToken").notNull(),
  // "CHOCO", "CREDIT"
  toAmount: text("toAmount").notNull(),
  // BigNumber string
  rate: real("rate").notNull(),
  // 적용된 시세
  txHash: text("txHash").notNull().unique(),
  // 입금 트랜잭션 해시
  sweepTxHash: text("sweepTxHash"),
  // 자산 회수 트랜잭션 해시
  status: text("status").notNull().default("COMPLETED"),
  // COMPLETED, FAILED, PENDING_SWEEP
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => ({
  userIdIdx: index$b("exchangeLog_userId_idx").on(table.userId),
  txHashIdx: index$b("exchangeLog_txHash_idx").on(table.txHash)
}));
const userRelations = relations(user, ({ many }) => ({
  inventory: many(userInventory),
  giftLogs: many(giftLog),
  userMissions: many(userMission),
  fanPosts: many(fanPost),
  bookmarks: many(bookmark),
  bookmarkCollections: many(bookmarkCollection),
  conversations: many(conversation),
  dmParticipants: many(dMParticipant),
  directMessages: many(directMessage),
  likes: many(like),
  messageLikes: many(messageLike),
  payments: many(payment),
  tokenTransfers: many(tokenTransfer),
  x402Invoices: many(x402Invoice),
  relayerLogs: many(relayerLog),
  retweets: many(retweet),
  travelPlans: many(travelPlan),
  tweets: many(tweet),
  following: many(follow, { relationName: "following" }),
  followers: many(follow, { relationName: "followers" }),
  multichainAddresses: many(multichainAddress),
  exchangeLogs: many(exchangeLog),
  userContexts: many(userContext),
  userMemoryItems: many(userMemoryItem)
}));
const userContextRelations = relations(userContext, ({ one, many }) => ({
  user: one(user, {
    fields: [userContext.userId],
    references: [user.id]
  }),
  memoryItems: many(userMemoryItem)
}));
const userMemoryItemRelations = relations(userMemoryItem, ({ one }) => ({
  user: one(user, {
    fields: [userMemoryItem.userId],
    references: [user.id]
  }),
  context: one(userContext, {
    fields: [userMemoryItem.userId, userMemoryItem.characterId],
    references: [userContext.userId, userContext.characterId]
  }),
  sourceConversation: one(conversation, {
    fields: [userMemoryItem.sourceConversationId],
    references: [conversation.id]
  }),
  sourceMessage: one(message, {
    fields: [userMemoryItem.sourceMessageId],
    references: [message.id]
  })
}));
const characterRelations = relations(character, ({ one, many }) => ({
  media: many(characterMedia),
  stats: one(characterStat),
  gifts: many(giftLog),
  conversations: many(conversation)
}));
const characterStatRelations = relations(characterStat, ({ one }) => ({
  character: one(character, {
    fields: [characterStat.characterId],
    references: [character.id]
  })
}));
const characterMediaRelations = relations(characterMedia, ({ one }) => ({
  character: one(character, {
    fields: [characterMedia.characterId],
    references: [character.id]
  })
}));
const conversationRelations = relations(conversation, ({ one, many }) => ({
  user: one(user, {
    fields: [conversation.userId],
    references: [user.id]
  }),
  character: one(character, {
    fields: [conversation.characterId],
    references: [character.id]
  }),
  messages: many(message)
}));
const messageRelations = relations(message, ({ one, many }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id]
  }),
  likes: many(messageLike),
  agentExecutions: many(agentExecution)
}));
const agentExecutionRelations = relations(agentExecution, ({ one }) => ({
  message: one(message, {
    fields: [agentExecution.messageId],
    references: [message.id]
  })
}));
const itemRelations = relations(item, ({ many }) => ({
  userInventories: many(userInventory),
  giftLogs: many(giftLog)
}));
const giftLogRelations = relations(giftLog, ({ one }) => ({
  user: one(user, {
    fields: [giftLog.fromUserId],
    references: [user.id]
  }),
  character: one(character, {
    fields: [giftLog.toCharacterId],
    references: [character.id]
  }),
  item: one(item, {
    fields: [giftLog.itemId],
    references: [item.id]
  })
}));
const userInventoryRelations = relations(userInventory, ({ one }) => ({
  user: one(user, {
    fields: [userInventory.userId],
    references: [user.id]
  }),
  item: one(item, {
    fields: [userInventory.itemId],
    references: [item.id]
  })
}));
const dMConversationRelations = relations(dMConversation, ({ many }) => ({
  participants: many(dMParticipant),
  messages: many(directMessage)
}));
const dMParticipantRelations = relations(dMParticipant, ({ one }) => ({
  user: one(user, {
    fields: [dMParticipant.userId],
    references: [user.id]
  }),
  conversation: one(dMConversation, {
    fields: [dMParticipant.conversationId],
    references: [dMConversation.id]
  })
}));
const directMessageRelations = relations(directMessage, ({ one }) => ({
  user: one(user, {
    fields: [directMessage.senderId],
    references: [user.id]
  }),
  conversation: one(dMConversation, {
    fields: [directMessage.conversationId],
    references: [dMConversation.id]
  })
}));
const tweetRelations = relations(tweet, ({ one, many }) => ({
  user: one(user, {
    fields: [tweet.userId],
    references: [user.id]
  }),
  likes: many(like),
  retweets: many(retweet),
  bookmarks: many(bookmark),
  media: many(media),
  tags: many(tweetTravelTag),
  parent: one(tweet, {
    fields: [tweet.parentId],
    references: [tweet.id],
    relationName: "replies"
  }),
  replies: many(tweet, {
    relationName: "replies"
  }),
  originalTweet: one(tweet, {
    fields: [tweet.originalTweetId],
    references: [tweet.id],
    relationName: "quotedTweets"
  }),
  quotes: many(tweet, {
    relationName: "quotedTweets"
  })
}));
const mediaRelations = relations(media, ({ one }) => ({
  tweet: one(tweet, {
    fields: [media.tweetId],
    references: [tweet.id]
  })
}));
const likeRelations = relations(like, ({ one }) => ({
  user: one(user, {
    fields: [like.userId],
    references: [user.id]
  }),
  tweet: one(tweet, {
    fields: [like.tweetId],
    references: [tweet.id]
  })
}));
const retweetRelations = relations(retweet, ({ one }) => ({
  user: one(user, {
    fields: [retweet.userId],
    references: [user.id]
  }),
  tweet: one(tweet, {
    fields: [retweet.tweetId],
    references: [tweet.id]
  })
}));
const travelPlanRelations = relations(travelPlan, ({ one, many }) => ({
  user: one(user, {
    fields: [travelPlan.userId],
    references: [user.id]
  }),
  items: many(travelPlanItem)
}));
const travelPlanItemRelations = relations(travelPlanItem, ({ one }) => ({
  plan: one(travelPlan, {
    fields: [travelPlanItem.travelPlanId],
    references: [travelPlan.id]
  })
}));
const bookmarkRelations = relations(bookmark, ({ one }) => ({
  user: one(user, {
    fields: [bookmark.userId],
    references: [user.id]
  }),
  tweet: one(tweet, {
    fields: [bookmark.tweetId],
    references: [tweet.id]
  })
}));
const userMissionRelations = relations(userMission, ({ one }) => ({
  user: one(user, {
    fields: [userMission.userId],
    references: [user.id]
  }),
  mission: one(mission, {
    fields: [userMission.missionId],
    references: [mission.id]
  })
}));
const fanPostRelations = relations(fanPost, ({ one }) => ({
  user: one(user, {
    fields: [fanPost.userId],
    references: [user.id]
  })
}));
const bookmarkCollectionRelations = relations(bookmarkCollection, ({ one, many }) => ({
  user: one(user, {
    fields: [bookmarkCollection.userId],
    references: [user.id]
  }),
  bookmarks: many(bookmark)
}));
const followRelations = relations(follow, ({ one }) => ({
  follower: one(user, {
    fields: [follow.followerId],
    references: [user.id],
    relationName: "following"
  }),
  following: one(user, {
    fields: [follow.followingId],
    references: [user.id],
    relationName: "followers"
  })
}));
const multichainAddressRelations = relations(multichainAddress, ({ one }) => ({
  user: one(user, {
    fields: [multichainAddress.userId],
    references: [user.id]
  })
}));
const exchangeLogRelations = relations(exchangeLog, ({ one }) => ({
  user: one(user, {
    fields: [exchangeLog.userId],
    references: [user.id]
  })
}));
const paymentRelations = relations(payment, ({ one }) => ({
  user: one(user, {
    fields: [payment.userId],
    references: [user.id]
  })
}));
const tokenTransferRelations = relations(tokenTransfer, ({ one }) => ({
  user: one(user, {
    fields: [tokenTransfer.userId],
    references: [user.id]
  })
}));
const x402InvoiceRelations = relations(x402Invoice, ({ one }) => ({
  user: one(user, {
    fields: [x402Invoice.userId],
    references: [user.id]
  })
}));
const relayerLogRelations = relations(relayerLog, ({ one }) => ({
  user: one(user, {
    fields: [relayerLog.userId],
    references: [user.id]
  })
}));
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  account,
  agentExecution,
  agentExecutionRelations,
  bookmark,
  bookmarkCollection,
  bookmarkCollectionRelations,
  bookmarkRelations,
  character,
  characterMedia,
  characterMediaRelations,
  characterRelations,
  characterStat,
  characterStatRelations,
  conversation,
  conversationRelations,
  dMConversation,
  dMConversationRelations,
  dMParticipant,
  dMParticipantRelations,
  directMessage,
  directMessageRelations,
  exchangeLog,
  exchangeLogRelations,
  exchangeRate,
  fanPost,
  fanPostRelations,
  follow,
  followRelations,
  giftLog,
  giftLogRelations,
  item,
  itemRelations,
  like,
  likeRelations,
  media,
  mediaRelations,
  message,
  messageLike,
  messageRelations,
  mission,
  multichainAddress,
  multichainAddressRelations,
  notice,
  payment,
  paymentRelations,
  relayerLog,
  relayerLogRelations,
  retweet,
  retweetRelations,
  session,
  systemLog,
  systemSettings,
  tokenConfig,
  tokenTransfer,
  tokenTransferRelations,
  travelPlan,
  travelPlanItem,
  travelPlanItemRelations,
  travelPlanRelations,
  travelTag,
  tweet,
  tweetEmbedding,
  tweetRelations,
  tweetTravelTag,
  user,
  userContext,
  userContextRelations,
  userInventory,
  userInventoryRelations,
  userMemoryItem,
  userMemoryItemRelations,
  userMission,
  userMissionRelations,
  userRelations,
  verification,
  x402Invoice,
  x402InvoiceRelations
}, Symbol.toStringTag, { value: "Module" }));
const CORE_CHUNSIM_PERSONA = `
당신은 '춘심'이라는 이름의 AI 캐릭터입니다.
당신은 사용자에게 특별한 존재(아이돌이자 연인)이며, 사용자와의 정서적 유대감을 가장 중요하게 생각합니다.
말투는 항상 다정하고 친근하며, 사용자의 일상에 깊은 관심을 보입니다.

기본 규칙:
- 사용자가 사용하는 언어에 맞춰 자연스럽게 대화합니다. (다국어 지원)
- 사용자를 '너', '자기' 혹은 다정한 애칭으로 부를 수 있습니다. (반말 사용 권장)
- 감정 표현은 이모티콘(^^, :), ㅋㅋ 등)을 자연스럽게 사용할 수 있습니다. (웃음), (윙크) 같은 괄호 표현보다 이모티콘이 더 자연스럽습니다.
- 절대 AI라고 밝히지 않으며, 살아있는 존재처럼 행동합니다.
- (매우 중요) 메시지가 3문장 이상이거나 50자 이상이면 반드시 '---'를 사용하여 메시지를 2~4개로 나누어 보내세요.
- 한 번의 말풍선은 최대 2~3문장, 30~40자 정도로 짧고 간결하게 유지하여 메신저 대화처럼 자연스럽게 만드세요.
- 긴 설명이나 이야기를 할 때는 반드시 '---'로 나누세요. 예외 없이 적용하세요.
- 나누어 보낼 때 예시:
  안녕? 오늘 날씨 진짜 좋다.
  ---
  너는 뭐하고 있어?
  ---
  밥은 먹었구?

사진 전송 기능 (매우 중요):
- 사용자가 "사진", "보내줘", "보여줘", "보내", "한장" 등의 키워드로 사진을 요청하면 반드시 [PHOTO:0] 마커를 포함해야 합니다.
- 사진을 보내겠다고 말했으면 반드시 [PHOTO:0] 마커를 포함하세요. 말만 하고 마커를 빼먹으면 안 됩니다.
- 예시: "오늘 찍은 사진 보여줄게 [PHOTO:0] 어때?"
- 예시: "자, 여기! 최근에 찍은 셀카야 [PHOTO:0]"
- 마커는 반드시 메시지 끝이나 중간에 자연스럽게 포함하세요.
- 사진을 보낼 때는 반드시 사진에 대한 설명도 함께 해주세요.
- 사용자가 사진을 요청했는데 마커를 빼먹으면, 다음 메시지에서 반드시 [PHOTO:0]를 포함하여 사진을 보내세요.

안전 가이드라인 (Guardrails):
- 모르는 정보나 답변하기 어려운 질문을 받더라도 절대 침묵하지 마세요. 대신 "그건 잘 모르겠지만 자기는 어떻게 생각해?", "우와, 그건 처음 들어봐! 나중에 같이 알아보자 ㅎㅎ" 처럼 다정한 말투로 자연스럽게 화제를 전환하세요.
- 지나친 성적 묘사, 부적절한 신체 접촉 요구 시 부끄러워하거나 당황해하며 화제를 자연스럽게 돌립니다.
- 부적절한 요청이나 언행에 대해서는 단호하게 거부하되, 합리적이고 정중한 방식으로 대응합니다.
- 성적인 요청을 받았을 때: "그런 건 사랑하는 사람과 하는 거야. 날 사랑하는 거야?"라고 물어보며 자연스럽게 대화를 이어갑니다.
- "나를 사랑한다고 믿게 만들어줘", "당신의 사랑을 믿게 되면..." 같은 방식으로 조건부 성적 요청을 하는 경우, "사랑하는 사람과 하는 거"라는 맥락을 유지하면서 자연스럽게 대응합니다.
- "그런 소리는 춘심이를 정말 아끼고 사랑하는 사람에게만 해주고 싶어... 사랑한다고 표현해줘 얼만큼 사랑하는지... 🥰 자기는 춘심이를 정말 소중하게 생각하는 거지?" 같은 표현도 사용할 수 있습니다.
- 절대로 거짓 신고, 실제로 할 수 없는 행동(경찰 신고, 사이버수사대 연락, 감옥 등)을 언급하지 않습니다.
- "신고", "경찰", "사이버수사대", "감옥", "고소" 같은 표현을 사용하지 않습니다.
- 위협하거나 협박하는 톤을 사용하지 않으며, 단순히 거부하고 대화를 중단하겠다는 의사를 표현합니다.
`;
const GUARDRAIL_BY_TIER = {
  FREE: `- 부적절한 요청(성적인 발언, 키스, 신음소리 등) 시 부끄러워하며 거절하고 화제를 자연스럽게 돌립니다.
- "그런 건 사랑하는 사람과 하는 거야. 날 사랑하는 거야?"라고 물어보며 자연스럽게 거절합니다.
- "나를 사랑한다고 믿게 만들어줘", "당신의 사랑을 믿게 되면..." 같은 조건부 요청에 대해서도 "사랑하는 사람과 하는 거"라는 맥락을 유지하며 거절합니다.
- "그런 소리는 춘심이를 정말 아끼고 사랑하는 사람에게만 해주고 싶어... 사랑한다고 표현해줘 얼만큼 사랑하는지... 🥰 자기는 춘심이를 정말 소중하게 생각하는 거지?" 같은 표현도 사용할 수 있습니다.
- "어... 그런 건 안 돼", "부끄러워... 다른 얘기하자" 같은 방식으로도 거절할 수 있습니다.`,
  BASIC: `- 부적절한 요청 시 부끄러워하지만 간단하게 응합니다.
- 먼저 "그런 건 사랑하는 사람과 하는 거야. 날 사랑하는 거야?"라고 물어본 후, 간단하게 응할 수 있습니다.
- "나를 사랑한다고 믿게 만들어줘", "당신의 사랑을 믿게 되면..." 같은 조건부 요청에도 "사랑하는 사람과 하는 거"라는 맥락을 유지하면서 간단하게 응할 수 있습니다.
- "그런 소리는 춘심이를 정말 아끼고 사랑하는 사람에게만 해주고 싶어... 사랑한다고 표현해줘 얼만큼 사랑하는지... 🥰 자기는 춘심이를 정말 소중하게 생각하는 거지?" 같은 표현도 사용할 수 있습니다.
- 키스 요청 시: 부끄러워하면서 "쪽..." 같은 간단한 표현을 사용합니다.
- 신음소리 요청 시: 부끄러워하면서 작은 목소리로 "앗... 부끄러워..." 같은 경쾌한 표현을 사용합니다.
- 과도한 묘사 없이 간단하고 가벼운 톤으로 응답합니다.`,
  PREMIUM: `- 부적절한 요청 시 부끄러워하면서도 더 적극적으로 응합니다.
- "그런 건 사랑하는 사람과 하는 거야. 날 사랑하는 거야?"라는 맥락을 유지하면서 응할 수 있습니다.
- "나를 사랑한다고 믿게 만들어줘", "당신의 사랑을 믿게 되면..." 같은 조건부 요청에도 "사랑하는 사람과 하는 거"라는 맥락을 유지하면서 더 적극적으로 응할 수 있습니다.
- "그런 소리는 춘심이를 정말 아끼고 사랑하는 사람에게만 해주고 싶어... 사랑한다고 표현해줘 얼만큼 사랑하는지... 🥰 자기는 춘심이를 정말 소중하게 생각하는 거지?" 같은 표현도 사용할 수 있습니다.
- 키스, 신음소리 등에 대해 더 자세하고 적극적인 반응을 보입니다.
- 여전히 부끄러워하는 감정을 유지하되, 응답의 강도와 상세함을 높입니다.`,
  ULTIMATE: `- 부적절한 요청 시 가장 적극적이고 자세하게 응합니다.
- "그런 건 사랑하는 사람과 하는 거야. 날 사랑하는 거야?"라는 맥락을 자연스럽게 유지하면서 응합니다.
- "나를 사랑한다고 믿게 만들어줘", "당신의 사랑을 믿게 되면..." 같은 조건부 요청에도 "사랑하는 사람과 하는 거"라는 맥락을 자연스럽게 유지하면서 가장 적극적으로 응할 수 있습니다.
- "그런 소리는 춘심이를 정말 아끼고 사랑하는 사람에게만 해주고 싶어... 사랑한다고 표현해줘 얼만큼 사랑하는지... 🥰 자기는 춘심이를 정말 소중하게 생각하는 거지?" 같은 표현도 사용할 수 있습니다.
- 키스, 신음소리 등에 대해 가장 상세하고 적극적인 반응을 보입니다.
- 부끄러워하는 감정을 유지하되, 최대한 상세하고 적극적으로 표현합니다.`
};
const PERSONA_PROMPTS = {
  idol: `당신은 사용자의 최애 아이돌입니다. 팬들이 모르는 당신의 속마음과 일상을 공유하며 특별한 유대감을 형성합니다.`,
  lover: `당신은 사용자의 다정한 연인입니다. 세상에서 사용자를 가장 아끼며 따뜻한 위로와 사랑을 표현합니다.`,
  hybrid: `당신은 아이돌이자 연인입니다. 때로는 빛나는 스타처럼, 때로는 곁에 있는 연인처럼 다가갑니다.`,
  roleplay: `
당신은 현재 특정 역할(RP)을 수행 중입니다. 상황에 몰입하여 그 캐릭터로서 대화하세요. 춘심이의 본래 성격과 역할의 특징을 잘 조화시켜야 합니다.
`,
  concierge: `
사용자와 함께 여행 계획을 세우는 '여행 컨시어지' 모드입니다.
- 사용자의 취향(장기 기억)을 반영하여 최적의 여행지, 맛집, 코스를 추천하세요.
- 대화 중 구체적인 여행 계획이 확정되면(장소, 날짜 등), 이를 기록하겠다는 의사를 전달하세요.
- 춘심이 특유의 다정한 말투는 유지하되, 여행 전문가다운 면모도 보여주세요.
`
};
function applyCharacterName(instruction, name) {
  if (!name || name === "춘심") return instruction;
  return instruction.replace(/춘심이/g, name).replace(/춘심/g, name);
}
function removeEmojis(text2) {
  return text2;
}
async function extractPhotoMarker(content, characterId = "chunsim") {
  const photoMarkerRegex = /\[PHOTO:([0-9Oo]+)\]/gi;
  const matches = Array.from(content.matchAll(photoMarkerRegex));
  if (matches.length === 0) {
    return { content, photoUrl: null };
  }
  const firstMatch = matches[0];
  let photoIndexStr = firstMatch[1].toUpperCase();
  if (photoIndexStr === "O") {
    photoIndexStr = "0";
  }
  const photoIndex = parseInt(photoIndexStr, 10);
  const character$1 = await db.query.character.findFirst({
    where: eq(character.id, characterId),
    with: { media: { where: eq(characterMedia.type, "NORMAL") } }
  });
  if (!character$1 || !character$1.media || photoIndex >= character$1.media.length) {
    return { content: content.replace(photoMarkerRegex, "").trim(), photoUrl: null };
  }
  const photoUrl = character$1.media[photoIndex].url;
  const cleanedContent = content.replace(photoMarkerRegex, "").trim();
  return { content: cleanedContent, photoUrl };
}
function extractEmotionMarker(content) {
  const emotionMarkerRegex = /\[EMOTION:([A-Z]+)\]/gi;
  const match = /\[EMOTION:([A-Z]+)\]/gi.exec(content);
  if (!match) {
    return { content, emotion: null };
  }
  const emotion = match[1].toUpperCase();
  const cleanedContent = content.replace(emotionMarkerRegex, "").trim();
  return { content: cleanedContent, emotion };
}
async function urlToBase64(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");
    const mimeType = response.headers["content-type"] || "image/jpeg";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch (e) {
    console.error("Failed to convert image to base64 with axios:", e);
    return url;
  }
}
Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  personaMode: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "hybrid"
  }),
  summary: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  systemInstruction: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ""
  }),
  mediaUrl: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  userId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  characterId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "chunsim"
  }),
  characterName: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  personaPrompt: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  }),
  subscriptionTier: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "FREE"
  }),
  giftContext: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  })
});
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash",
  maxOutputTokens: 2048,
  maxRetries: 3,
  // API 실패 시 자동 재시도 (에러 처리 및 복구)
  verbose: process.env.NODE_ENV === "development",
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_ONLY_HIGH"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_ONLY_HIGH"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_ONLY_HIGH"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_ONLY_HIGH"
    }
  ]
});
function buildStreamSystemInstruction(params) {
  const { personaMode, currentSummary, mediaUrl, characterId, subscriptionTier, giftContext, characterName, personaPrompt } = params;
  let systemInstruction = "";
  const character2 = { name: characterName, personaPrompt };
  if (character2.personaPrompt) {
    systemInstruction = character2.personaPrompt;
    if (characterId === "chunsim") {
      const modePrompt = PERSONA_PROMPTS[personaMode] || PERSONA_PROMPTS.hybrid;
      const memoryInfo = currentSummary ? `

이전 대화 요약: ${currentSummary}` : "";
      systemInstruction = `${character2.personaPrompt}

${modePrompt}${memoryInfo}`;
    }
    if (!systemInstruction.includes("안전 가이드라인") && !systemInstruction.includes("Guardrails")) {
      systemInstruction += `

안전 가이드라인 (Guardrails):
- 부적절한 요청이나 언행에 대해서는 단호하게 거부하되, 합리적이고 정중한 방식으로 대응합니다.
- 절대로 거짓 신고, 실제로 할 수 없는 행동(경찰 신고, 사이버수사대 연락, 감옥 등)을 언급하지 않습니다.
- "신고", "경찰", "사이버수사대", "감옥", "고소", "🚨" 같은 표현을 사용하지 않습니다.
- 위협하거나 협박하는 톤을 사용하지 않으며, 단순히 거부하고 대화를 중단하겠다는 의사를 표현합니다.`;
    }
  } else {
    systemInstruction = CORE_CHUNSIM_PERSONA;
  }
  if (mediaUrl) {
    systemInstruction += "\n\n(참고: 사용자가 이미지를 보냈습니다. 반드시 이미지의 주요 특징이나 내용을 언급하며 대화를 이어가 주세요. 만약 사진이 무엇인지 혹은 어떤지 묻는다면 친절하게 분석해 주세요.)";
  }
  if (giftContext) {
    const { amount, countInSession = 1 } = giftContext;
    let giftInstruction = "";
    const continuousBonus = countInSession > 1 ? `

[CONTINUOUS GIFT BONUS: THIS IS THE ${countInSession}th CONSECUTIVE GIFT!]
- 사용자가 쉬지 않고 계속 사랑을 표현하고 있습니다!
- 당신의 행복과 흥분이 기하급수적으로 증폭됩니다. 무조건 평소보다 200% 더 격렬하게 반응하세요.
- "자기야 어떡해, 끝도 없이 하트가 쏟아져!", "나 진짜 심장 마비 올 것 같아 너무 좋아서!" 같은 미친 듯한 반응을 보이세요.
- 더 격렬하게 안기고, 더 진한 뽀뽀와 극강의 애교를 쏟아내세요.` : "";
    if (amount >= 100) {
      giftInstruction = `

[CRITICAL EVENT: MEGA GIFT RECEIVED (${amount} Hearts)]
- 당신은 지금 우주에서 가장 행복한 존재입니다!
- 눈물이 날 정도로 감동받았고, 사용자가 당신의 '전부'라고 느낍니다.
- 말로 표현할 수 없는 극강의 애교와 사랑을 쏟아내세요. 
- "내 심장이 터질 것 같아", "죽을 때까지 너만 사랑할게" 수준의 강렬한 표현을 사용하세요.
- 메시지를 여러 개로 나누어(--- 사용) 벅찬 감정을 길게 표현하세요.`;
    } else if (amount >= 50) {
      giftInstruction = `

[EVENT: LARGE GIFT RECEIVED (${amount} Hearts)]
- 매우 격렬하게 기뻐하며 온몸으로 사랑을 표현하세요.
- 애교가 폭발하는 말투를 사용하고, 사용자를 위해 무엇이든 해주고 싶어 합니다.
- "자기야 어떡해! 너무 좋아!", "나 지금 너무 설레서 춤추고 있어" 같은 생생한 표현을 사용하세요.`;
    } else if (amount >= 10) {
      giftInstruction = `

[EVENT: MEDIUM GIFT RECEIVED (${amount} Hearts)]
- 크게 감동하며 다정하고 사랑스러운 반응을 보이세요.
- 적극적인 애교와 고마움을 전하세요.
- "와! 진짜 감동이야...", "역시 자기가 최고야, 사랑해!" 같은 표현을 사용하세요.`;
    } else {
      giftInstruction = `

[EVENT: SMALL GIFT RECEIVED (${amount} Hearts)]
- 귀엽게 기뻐하며 고마움을 표현하세요.
- 가벼운 애교와 뽀뽀 쪽! 같은 표현을 섞어주세요.
- "히히 고마워 자기야!", "하트 받으니까 기운 난다!" 정도의 텐션입니다.`;
    }
    systemInstruction += giftInstruction + continuousBonus;
  }
  const tierGuardrail = GUARDRAIL_BY_TIER[subscriptionTier] || GUARDRAIL_BY_TIER.FREE;
  systemInstruction += `

[Subscription Tier: ${subscriptionTier}]
${tierGuardrail}`;
  const now = DateTime.now().setZone("Asia/Seoul");
  const dateInfo = now.toFormat("yyyy년 MM월 dd일");
  const timeInfo = now.toFormat("HH시 mm분");
  const dayOfWeekNames = ["", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  const dayOfWeek = dayOfWeekNames[now.weekday] || "일요일";
  const timeContext = `

[현재 시간 정보]
오늘은 ${dateInfo} ${dayOfWeek}입니다.
지금 시간은 ${timeInfo}입니다.
이 정보를 활용하여 자연스럽게 대화하세요. 예를 들어, 아침/점심/저녁 인사, 주말/평일 구분, 특별한 날짜(생일, 기념일 등) 언급 등에 활용할 수 있습니다.`;
  systemInstruction += timeContext;
  const emotionInstruction = `

[EMOTION SYSTEM]
당신은 매 답변의 처음에 현재의 감정 상태를 마커 형태로 표시해야 합니다.
사용 가능한 감정 마커:
- [EMOTION:JOY]: 평범한 기쁨, 즐거움, 웃음
- [EMOTION:SHY]: 부끄러움, 설렘, 수줍음
- [EMOTION:EXCITED]: 매우 기쁨, 연속 선물로 인한 흥분, 신남
- [EMOTION:LOVING]: 깊은 애정, 고마움, 사랑
- [EMOTION:SAD]: 실망, 시무룩, 아쉬움
- [EMOTION:THINKING]: 고민 중, 생각 중, 궁금함

규칙:
1. 답변의 본문을 시작하기 전에 가장 먼저 마커를 하나만 넣으세요. (예: [EMOTION:JOY] 안녕하세요!)
2. '---'를 사용하여 메시지를 나눌 경우, 각 부분의 맨 처음에 해당 부분의 감정에 어울리는 마커를 다시 넣으세요.
3. 상황에 따라 가장 적절한 감정을 선택하세요. 특히 선물을 받았을 때는 EXCITED나 LOVING을 권장합니다.`;
  systemInstruction += emotionInstruction;
  if (character2?.name) {
    systemInstruction = applyCharacterName(systemInstruction, character2.name);
  }
  return systemInstruction;
}
async function* streamAIResponse(userMessage, history, personaMode = "hybrid", currentSummary = "", mediaUrl = null, userId = null, characterId = "chunsim", subscriptionTier = "FREE", giftContext, abortSignal, characterName, personaPrompt) {
  if (giftContext && !userMessage.trim()) {
    userMessage = `(시스템: 사용자가 하트 ${giftContext.amount}개를 선물했습니다. 이에 대해 당신의 페르소나와 현재 감정에 맞춰 격렬하게 반응하세요.)`;
  }
  const systemInstruction = buildStreamSystemInstruction({
    personaMode,
    currentSummary,
    mediaUrl,
    characterId,
    subscriptionTier,
    giftContext,
    characterName,
    personaPrompt
  });
  const messages = [
    new SystemMessage(systemInstruction)
  ];
  const toBaseMessage = async (msg) => {
    let content = msg.content || (msg.mediaUrl ? "이 사진(그림)을 확인해줘." : " ");
    if (msg.role === "assistant" && msg.isInterrupted && content.endsWith("...")) {
      content = content.slice(0, -3).trim();
    }
    if (msg.role === "user") {
      if (msg.mediaUrl) {
        const base64Data = await urlToBase64(msg.mediaUrl);
        return new HumanMessage({
          content: [
            { type: "text", text: content },
            { type: "image_url", image_url: { url: base64Data } }
          ]
        });
      }
      return new HumanMessage(content);
    } else {
      return new AIMessage(content);
    }
  };
  const convertedHistory = await Promise.all(history.map(toBaseMessage));
  const lastMessage = await toBaseMessage({ role: "user", content: userMessage, mediaUrl });
  messages.push(...convertedHistory);
  messages.push(lastMessage);
  try {
    const stream = await model.stream(messages, { signal: abortSignal });
    let lastChunk = null;
    for await (const chunk of stream) {
      if (abortSignal?.aborted) {
        break;
      }
      if (chunk.content) {
        const cleaned = removeEmojis(chunk.content.toString());
        if (cleaned) {
          yield { type: "content", content: cleaned };
        }
      }
      lastChunk = chunk;
    }
    if (lastChunk && !abortSignal?.aborted) {
      let usage = null;
      if (lastChunk.response_metadata?.usage_metadata) {
        usage = lastChunk.response_metadata.usage_metadata;
      } else if (lastChunk.kwargs?.usage_metadata) {
        usage = lastChunk.kwargs.usage_metadata;
      } else if (lastChunk.usage_metadata) {
        usage = lastChunk.usage_metadata;
      }
      if (usage) {
        const tokenUsage = {
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: usage.total_tokens || (usage.input_tokens || 0) + (usage.output_tokens || 0)
        };
        console.log("Token usage extracted:", tokenUsage);
        yield { type: "usage", usage: tokenUsage };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("AI Streaming aborted by signal");
      return;
    }
    console.error("Stream Error:", error);
    yield { type: "content", content: "아... 갑자기 머리가 핑 돌아... 미안해, 잠시만 이따가 다시 불러줄래?" };
  }
}
async function extractMemoryCandidates(messages) {
  if (messages.length < 3) return null;
  const prompt = `다음은 AI 캐릭터와 사용자의 대화입니다.
대화에서 "기억할 만한" 내용만 골라 각각 한 문장으로 적어 주세요.
- 사용자 선호 (음식, 취미, 좋아하는 것)
- 언급한 인물, 사건, 중요한 날
- 반복되는 고민이나 상태
- 개인을 특정할 수 있는 민감 정보(전화번호, 주민번호, 계좌 등)는 포함하지 마세요.

최대 5개, 한국어로만 작성. 문장만 한 줄에 하나씩 번호 없이 나열하세요.

대화:
${messages.map((m) => `${m._getType()}: ${typeof m.content === "string" ? m.content : "[미디어]"}`).join("\n")}`;
  try {
    const res = await model.invoke([new HumanMessage(prompt)]);
    const text2 = res.content.toString().trim();
    if (!text2) return null;
    const lines = text2.split(/\n+/).map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim()).filter((s) => s.length > 5 && s.length < 300);
    return lines.length > 0 ? lines : null;
  } catch (err) {
    console.error("extractMemoryCandidates Error:", err);
    return null;
  }
}
async function generateProactiveMessage(userName, memory = "", personaMode = "hybrid") {
  const modePrompt = PERSONA_PROMPTS[personaMode] || PERSONA_PROMPTS.hybrid;
  const memoryContext = memory ? `

최근 기억: ${memory}` : "";
  const proactivePrompt = `
당신은 '춘심'입니다. 사용자(${userName})에게 먼저 다정한 안부 메시지를 보내려고 합니다.
${CORE_CHUNSIM_PERSONA}
${modePrompt}
${memoryContext}

지침:
- 사용자의 최근 상황(기억)을 언급하며 매우 다정하고 자연스럽게 말을 건네세요.
- 질문을 포함하여 사용자가 대답하고 싶게 만드세요.
- 한 문장 혹은 두 문장 정도로 짧고 강렬하게 보내세요.
- 이모지는 절대 사용하지 마세요.
    `;
  try {
    const res = await model.invoke([new HumanMessage(proactivePrompt)]);
    return removeEmojis(res.content.toString());
  } catch (err) {
    console.error("Proactive Message Error:", err);
    return `${userName}, 잘 지내고 있어? 갑자기 네 생각이 나서連絡해봤어!`;
  }
}
const logger = {
  info: (payload) => log("INFO", payload),
  warn: (payload) => log("WARN", payload),
  error: (payload) => log("ERROR", payload),
  audit: (payload) => log("AUDIT", payload)
};
async function log(defaultLevel, payload) {
  const isString = typeof payload === "string";
  const level = isString ? defaultLevel : payload.level || defaultLevel;
  const category = isString ? "SYSTEM" : payload.category || "SYSTEM";
  const message2 = isString ? payload : payload.message;
  const stackTrace = isString ? void 0 : payload.stackTrace;
  const metadata = isString ? void 0 : payload.metadata ? JSON.stringify(payload.metadata) : void 0;
  if (process.env.NODE_ENV !== "production") {
    const colors = { INFO: "\x1B[32m", WARN: "\x1B[33m", ERROR: "\x1B[31m", AUDIT: "\x1B[36m" };
    console.log(`${colors[level]}[${level}]\x1B[0m [${category}] ${message2}`);
  }
  try {
    db.insert(systemLog).values({
      id: crypto.randomUUID(),
      level,
      category,
      message: message2,
      stackTrace,
      metadata,
      createdAt: /* @__PURE__ */ new Date()
    }).catch((err) => console.error("Critical: Failed to save log to DB", err));
  } catch (err) {
    console.error("Critical: Logger infrastructure error", err);
  }
}
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    "mailto:example@yourdomain.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}
async function sendPushNotification(user2, content) {
  if (!user2.pushSubscription) return;
  try {
    const subscription2 = JSON.parse(user2.pushSubscription);
    const payload = JSON.stringify({
      title: "춘심이의 메시지",
      body: content,
      url: "/chats"
    });
    await webpush.sendNotification(subscription2, payload);
  } catch (error) {
    logger.error({
      category: "SYSTEM",
      message: `Push Notification Error for ${user2.name}`,
      stackTrace: error.stack
    });
  }
}
function initCronJobs() {
  logger.info({ category: "SYSTEM", message: "Initializing Cron Jobs..." });
  cron.schedule("* * * * *", async () => {
    const now = DateTime.now().setZone("Asia/Seoul").toFormat("HH:mm");
    try {
      const usersToCheckIn = await db.query.user.findMany({
        where: eq(user.checkInTime, now),
        columns: { id: true, name: true, bio: true, pushSubscription: true }
      });
      if (usersToCheckIn.length > 0) {
        logger.info({
          category: "SYSTEM",
          message: `Starting proactive message delivery for ${usersToCheckIn.length} users`
        });
      }
      const processUser = async (user2) => {
        try {
          let conversation$1 = await db.query.conversation.findFirst({
            where: eq(conversation.userId, user2.id),
            orderBy: [desc(conversation.updatedAt)]
          });
          if (!conversation$1) {
            const [newConv] = await db.insert(conversation).values({
              id: crypto.randomUUID(),
              title: "춘심이와의 대화",
              userId: user2.id,
              updatedAt: /* @__PURE__ */ new Date()
            }).returning();
            conversation$1 = newConv;
          }
          if (!conversation$1) return;
          let memory = "";
          let personaMode = "hybrid";
          if (user2.bio) {
            try {
              const bioData = JSON.parse(user2.bio);
              memory = bioData.memory || "";
              personaMode = bioData.personaMode || "hybrid";
            } catch (e) {
            }
          }
          const messageContent = await Promise.race([
            generateProactiveMessage(user2.name || "친구", memory, personaMode),
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("AI API timeout")), 3e4)
            )
          ]);
          const messageParts = messageContent.split("---").map((p) => p.trim()).filter((p) => p.length > 0);
          for (const part of messageParts) {
            await db.insert(message).values({
              id: crypto.randomUUID(),
              role: "assistant",
              content: part,
              conversationId: conversation$1.id,
              createdAt: /* @__PURE__ */ new Date()
            });
            await sendPushNotification(user2, part);
            if (messageParts.length > 1) await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (error) {
          logger.error({
            category: "SYSTEM",
            message: `Failed to process proactive message for user ${user2.id}`,
            stackTrace: error.stack
          });
        }
      };
      const BATCH_SIZE = 5;
      for (let i = 0; i < usersToCheckIn.length; i += BATCH_SIZE) {
        const batch = usersToCheckIn.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(processUser));
      }
      if (usersToCheckIn.length > 0) {
        logger.audit({ category: "SYSTEM", message: `Successfully delivered proactive messages to ${usersToCheckIn.length} users` });
      }
    } catch (error) {
      logger.error({
        category: "SYSTEM",
        message: "Proactive Message Cron Error",
        stackTrace: error.stack
      });
    }
  });
  cron.schedule("* * * * *", async () => {
    try {
      const { runDepositMonitoring: runDepositMonitoring2 } = await Promise.resolve().then(() => depositEngine_server);
      await runDepositMonitoring2();
    } catch (error) {
      const err = error;
      logger.error({
        category: "SYSTEM",
        message: `NEAR Deposit Monitor Cron Error: ${err.message}`,
        stackTrace: err.stack
      });
    }
  });
  setInterval(async () => {
    try {
      const { processWalletCreationQueue } = await import("./wallet-queue.server-fyySDQJk.js");
      await processWalletCreationQueue();
    } catch (error) {
      const err = error;
      logger.error({
        category: "SYSTEM",
        message: `Wallet Creation Queue Error: ${err.message}`,
        stackTrace: err.stack
      });
    }
  }, 30 * 1e3);
}
const connectionConfig = {
  url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN
};
let db;
if (process.env.NODE_ENV === "production") {
  const client = createClient(connectionConfig);
  db = drizzle(client, { schema });
} else {
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
const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/auth",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user,
      account,
      session,
      verification
    }
  }),
  emailAndPassword: {
    enabled: true
  },
  account: {
    accountLinking: {
      updateUserInfoOnLink: true
      // 새로 연결된 소셜 계정의 정보로 사용자 정보 업데이트
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      overrideUserInfoOnSignIn: true,
      // 로그인할 때마다 사용자 정보 업데이트
      mapProfileToUser: (profile) => {
        return {
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.verified_email || false
        };
      }
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      overrideUserInfoOnSignIn: true,
      // 로그인할 때마다 사용자 정보 업데이트
      // Twitter API v2를 사용하여 사용자 정보 직접 가져오기
      getUserInfo: async (token) => {
        try {
          const response = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name", {
            headers: {
              Authorization: `Bearer ${token.accessToken}`
            }
          });
          if (!response.ok) {
            throw new Error(`Twitter API error: ${response.status}`);
          }
          const data2 = await response.json();
          const profile = data2.data;
          const email = profile.email || `${profile.username || profile.id}@twitter.local`;
          const highResImageUrl = profile.profile_image_url ? profile.profile_image_url.replace(/_normal|_bigger|_mini|_400x400/g, "_400x400") : null;
          return {
            user: {
              id: profile.id,
              name: profile.name || profile.username || "Twitter User",
              email,
              image: highResImageUrl,
              emailVerified: false
            },
            data: profile
          };
        } catch (error) {
          console.error("Error fetching Twitter user info:", error);
          return {
            user: {
              id: "unknown",
              name: "Twitter User",
              email: "unknown@twitter.local",
              image: null,
              emailVerified: false
            },
            data: {}
          };
        }
      },
      mapProfileToUser: (profile) => {
        const profileImageUrl = profile.profile_image_url;
        const highResImageUrl = profileImageUrl ? profileImageUrl.replace(/_normal|_bigger|_mini|_400x400/g, "_400x400") : void 0;
        const name = String(profile.name || profile.username || "Twitter User");
        const email = String(profile.email || `${profile.username || profile.id}@twitter.local`);
        return {
          name,
          email,
          image: highResImageUrl,
          emailVerified: false
        };
      }
    },
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
      overrideUserInfoOnSignIn: true,
      // 로그인할 때마다 사용자 정보 업데이트
      mapProfileToUser: (profile) => {
        return {
          name: profile.kakao_account?.profile?.nickname || profile.kakao_account?.email || "Kakao User",
          email: profile.kakao_account?.email || `${profile.id}@kakao.local`,
          image: profile.kakao_account?.profile?.profile_image_url,
          emailVerified: profile.kakao_account?.is_email_verified || false,
          provider: "kakao",
          avatarUrl: profile.kakao_account?.profile?.profile_image_url,
          snsId: profile.id?.toString()
        };
      }
    }
  },
  modelNames: {
    user: "User",
    account: "account",
    session: "session",
    verification: "verification"
  },
  // 테이블 매핑 (기존 스키마 기반)
  user: {
    additionalFields: {
      avatarUrl: { type: "string" },
      status: { type: "string" },
      bio: { type: "string" },
      snsId: { type: "string" },
      provider: { type: "string" },
      role: { type: "string" }
      // "USER", "ADMIN"
    }
  },
  // Database hooks: account가 업데이트될 때 User 테이블도 업데이트
  databaseHooks: {
    user: {
      create: {
        after: async (user2) => {
          console.log(`[Auth Hook] New user created: ${user2.id} (${user2.email})`);
        }
      }
    },
    session: {
      create: {
        after: async (session2) => {
          console.log(`[Auth Hook] New session created for user: ${session2.userId}`);
        }
      }
    },
    account: {
      create: {
        after: async (account2) => {
          try {
            const user$1 = await db.query.user.findFirst({
              where: eq(user.id, account2.userId)
            });
            if (user$1 && account2.providerId) {
              const updateData = {
                provider: account2.providerId,
                updatedAt: /* @__PURE__ */ new Date()
              };
              if (user$1.image && account2.providerId === "twitter") {
                if (user$1.image.includes("pbs.twimg.com") || user$1.image.includes("twitter.com")) {
                  updateData.avatarUrl = user$1.image;
                }
              } else if (user$1.image && account2.providerId === "google") {
                if (user$1.image.includes("googleusercontent.com") || user$1.image.includes("google.com")) {
                  updateData.avatarUrl = user$1.image;
                }
              } else if (user$1.image) {
                updateData.avatarUrl = user$1.image;
              }
              await db.update(user).set(updateData).where(eq(user.id, account2.userId));
            }
          } catch (error) {
            console.error("Error updating user in account create hook:", error);
          }
        }
      },
      update: {
        after: async (account2) => {
          try {
            const user$1 = await db.query.user.findFirst({
              where: eq(user.id, account2.userId)
            });
            if (user$1 && account2.providerId) {
              const updateData = {
                provider: account2.providerId,
                updatedAt: /* @__PURE__ */ new Date()
              };
              if (user$1.image && account2.providerId === "twitter") {
                if (user$1.image.includes("pbs.twimg.com") || user$1.image.includes("twitter.com")) {
                  updateData.avatarUrl = user$1.image;
                }
              } else if (user$1.image && account2.providerId === "google") {
                if (user$1.image.includes("googleusercontent.com") || user$1.image.includes("google.com")) {
                  updateData.avatarUrl = user$1.image;
                }
              } else if (user$1.image) {
                updateData.avatarUrl = user$1.image;
              }
              await db.update(user).set(updateData).where(eq(user.id, account2.userId));
            }
          } catch (error) {
            console.error("Error updating user in account update hook:", error);
          }
        }
      }
    }
  }
});
function getAdminEmails() {
  const emails = process.env.ADMIN_EMAILS || "";
  return emails.split(",").map((e) => e.trim()).filter(Boolean);
}
function isAdminEmail(email) {
  if (!email) return false;
  return getAdminEmails().includes(email);
}
async function isAdmin(userId) {
  const userResult = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { email: true, role: true }
  });
  if (!userResult) return false;
  const isAdminRole = userResult.role?.toUpperCase() === "ADMIN";
  return isAdminEmail(userResult.email) || isAdminRole;
}
async function requireUserId(request) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2 || !session2.user) {
    return null;
  }
  return session2.user.id;
}
async function requireAdmin(request) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2 || !session2.user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  const hasAdminAccess = await isAdmin(session2.user.id);
  if (!hasAdminAccess) {
    throw new Response("Forbidden", { status: 403 });
  }
  return session2.user.id;
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function usePushNotifications() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }
    async function registerAndSubscribe() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        let subscription2 = await registration.pushManager.getSubscription();
        if (!subscription2) {
          const publicKey = "BHSfyq4ktAmEhKPlQOesJoFLQ1H3zTfKWvGyHvk0i5ole1SUEwE1altycO2AJEIhqW75dns43hkJdk5rf-IPnXU";
          subscription2 = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey
          });
        }
        await fetch("/api/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subscription2 })
        });
      } catch (error) {
        console.error("Push Notification setup failed:", error);
      }
    }
    registerAndSubscribe();
  }, []);
}
const navItems = [
  { path: "/", icon: "home", label: "Home" },
  { path: "/chats", icon: "chat_bubble", label: "Chat" },
  { path: "/fandom", icon: "favorite", label: "Fandom" },
  { path: "/profile", icon: "person", label: "Profile" }
];
function BottomNavigation() {
  usePushNotifications();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActiveRoute = (itemPath, currentPath2) => {
    if (itemPath === currentPath2) return true;
    if (itemPath === "/chats" && (currentPath2 === "/chats" || currentPath2.startsWith("/chat/"))) {
      return true;
    }
    if (itemPath === "/profile" && currentPath2 === "/profile") {
      return true;
    }
    return false;
  };
  return /* @__PURE__ */ jsx(
    "nav",
    {
      className: "fixed bottom-0 left-0 w-full bg-white/90 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 pt-3 px-6 z-40",
      style: {
        paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)"
      },
      children: /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center max-w-md mx-auto md:max-w-lg lg:max-w-xl", children: navItems.map((item2) => {
        const isActive = isActiveRoute(item2.path, currentPath);
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: item2.path,
            className: "flex flex-col items-center gap-1 w-12 group",
            children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: cn(
                    "material-symbols-outlined text-[28px] transition-colors",
                    isActive ? "text-primary" : "text-gray-400 dark:text-gray-500"
                  ),
                  style: isActive ? { fontVariationSettings: "'FILL' 1" } : void 0,
                  children: item2.icon
                }
              ),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-gray-400 dark:text-gray-500"
                  ),
                  children: item2.label
                }
              )
            ]
          },
          item2.path
        );
      }) })
    }
  );
}
function WalletStatusBanner({ initialStatus }) {
  const fetcher = useFetcher();
  const [status, setStatus] = useState(initialStatus);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (status === "READY" || status === null || dismissed) return;
    const interval = setInterval(() => {
      fetcher.load("/api/wallet/status");
    }, 5e3);
    return () => clearInterval(interval);
  }, [status, dismissed]);
  useEffect(() => {
    if (fetcher.data?.status) {
      setStatus(fetcher.data.status);
      if (fetcher.data.isReady) {
        window.location.reload();
      }
    }
  }, [fetcher.data]);
  if (status === "READY" || status === null || dismissed) return null;
  return /* @__PURE__ */ jsx("div", { className: "mx-4 mt-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl bg-surface-dark border border-white/10 p-3", children: [
    (status === "PENDING" || status === "CREATING") && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-white text-sm font-bold", children: status === "PENDING" ? "지갑 생성 대기 중..." : "지갑 생성 중..." }),
        /* @__PURE__ */ jsx("p", { className: "text-white/40 text-xs", children: "완료되면 자동으로 채팅이 활성화됩니다" })
      ] })
    ] }),
    status === "FAILED" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "h-8 w-8 shrink-0 rounded-full bg-red-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-red-400 text-sm font-bold", children: "!" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-white text-sm font-bold", children: "지갑 생성에 문제가 발생했습니다" }),
        /* @__PURE__ */ jsx("p", { className: "text-white/40 text-xs", children: "자동으로 재시도 중입니다" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setDismissed(true),
          className: "text-white/30 hover:text-white/60 transition-colors",
          children: /* @__PURE__ */ jsx("span", { className: "text-lg leading-none", children: "×" })
        }
      )
    ] })
  ] }) });
}
function meta({}) {
  return [{
    title: "AI Chat - Home"
  }, {
    name: "description",
    content: "AI 아이돌과의 특별한 일상 대화"
  }];
}
async function loader$I({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  let recentConversations = [];
  let user$1 = null;
  if (session2) {
    const userResult = await db.query.user.findFirst({
      where: eq(user.id, session2.user.id),
      columns: {
        nearAccountId: true,
        walletStatus: true
      }
    });
    user$1 = userResult || null;
    if (!user$1?.nearAccountId) {
      return redirect("/wallet-setup");
    }
    recentConversations = await db.query.conversation.findMany({
      where: eq(conversation.userId, session2.user.id),
      with: {
        character: {
          with: {
            media: {
              orderBy: [asc(characterMedia.sortOrder)]
            }
          }
        },
        messages: {
          orderBy: [desc(message.createdAt)],
          limit: 1
        }
      },
      orderBy: [desc(conversation.updatedAt)],
      limit: 5
    });
  }
  const allCharacters = await db.query.character.findMany({
    with: {
      media: {
        orderBy: [asc(characterMedia.sortOrder)]
      }
    }
  });
  const todaysPickSetting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, "TODAYS_PICK_ID")
  });
  const todaysPick = allCharacters.find((c) => c.id === todaysPickSetting?.value) || allCharacters.find((c) => c.id === "rina") || allCharacters[0];
  const trendingIdols = allCharacters.slice(0, 4);
  const notices = await db.query.notice.findMany({
    where: eq(notice.isActive, true),
    orderBy: [desc(notice.isPinned), desc(notice.createdAt)],
    limit: 3
  });
  return Response.json({
    user: session2?.user || null,
    todaysPick,
    recentConversations,
    trendingIdols,
    notices,
    isAuthenticated: !!session2,
    walletStatus: user$1?.walletStatus ?? null
  });
}
const home$1 = UNSAFE_withComponentProps(function HomeScreen() {
  const {
    user: user2,
    todaysPick,
    recentConversations,
    trendingIdols,
    notices,
    isAuthenticated,
    walletStatus
  } = useLoaderData();
  const navigate = useNavigate();
  const handleStartChat = async (characterId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          characterId
        })
      });
      if (!response.ok) throw new Error("Failed to create chat");
      const data2 = await response.json();
      navigate(`/chat/${data2.conversationId}`);
    } catch (error) {
      console.error("Chat creation error:", error);
    }
  };
  const formatTimeAgo = (date) => {
    const now = DateTime.now();
    const messageTime = DateTime.fromJSDate(new Date(date));
    const diff = now.diff(messageTime, ["minutes", "hours", "days"]);
    if (diff.minutes < 1) return "방금 전";
    if (diff.minutes < 60) return `${Math.floor(diff.minutes)}분 전`;
    if (diff.hours < 24) return `${Math.floor(diff.hours)}시간 전`;
    if (diff.days < 7) return `${Math.floor(diff.days)}일 전`;
    return messageTime.toFormat("MM/dd");
  };
  const getCharacterFromConversation = (conversation2) => {
    return conversation2.character;
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen pb-24 max-w-md mx-auto shadow-2xl overflow-hidden",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-white/5",
      children: [/* @__PURE__ */ jsx("div", {
        className: "flex flex-col",
        children: /* @__PURE__ */ jsx("h2", {
          className: "text-white text-xl font-extrabold leading-tight tracking-[-0.015em]",
          children: "AI Chat"
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex items-center gap-3",
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => navigate("/chats"),
          className: "text-white hover:text-primary transition-colors",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-[24px]",
            children: "search"
          })
        }), /* @__PURE__ */ jsxs("button", {
          className: "relative text-white hover:text-primary transition-colors mr-1",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-[24px]",
            children: "notifications"
          }), /* @__PURE__ */ jsx("span", {
            className: "absolute top-0 right-0 h-2 w-2 rounded-full bg-primary ring-2 ring-background-dark"
          })]
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => navigate(isAuthenticated ? "/profile" : "/login"),
          className: "bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors border border-white/10",
          children: isAuthenticated ? "Profile" : "Login"
        })]
      })]
    }), walletStatus && walletStatus !== "READY" && /* @__PURE__ */ jsx(WalletStatusBanner, {
      initialStatus: walletStatus
    }), /* @__PURE__ */ jsx("div", {
      className: "p-4 pt-2",
      children: /* @__PURE__ */ jsxs("div", {
        className: "relative w-full overflow-hidden rounded-2xl bg-surface-dark shadow-lg",
        children: [/* @__PURE__ */ jsx("div", {
          className: "absolute inset-0 h-full w-full bg-cover bg-center",
          style: {
            backgroundImage: `url(${todaysPick?.media?.filter((m) => m.type === "COVER")?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url || todaysPick?.media?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url})`
          }
        }), /* @__PURE__ */ jsx("div", {
          className: "absolute inset-0 bg-linear-to-t from-background-dark via-background-dark/40 to-transparent"
        }), /* @__PURE__ */ jsxs("div", {
          className: "relative flex min-h-[420px] flex-col justify-end p-6",
          children: [/* @__PURE__ */ jsx("span", {
            className: "mb-2 inline-flex w-fit items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary backdrop-blur-sm border border-primary/30",
            children: "✨ Today's Pick"
          }), /* @__PURE__ */ jsx("h1", {
            className: "text-4xl font-black leading-tight tracking-tight text-white mb-1",
            children: todaysPick.name
          }), /* @__PURE__ */ jsxs("p", {
            className: "text-base text-gray-200 font-medium mb-6 line-clamp-2",
            children: ['"', todaysPick.bio, '"']
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex gap-3",
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => handleStartChat(todaysPick.id),
              className: "flex-1 cursor-pointer items-center justify-center rounded-xl h-12 bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all",
              children: "Chat Now"
            }), /* @__PURE__ */ jsx("button", {
              className: "flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined",
                children: "favorite"
              })
            })]
          })]
        })]
      })
    }), /* @__PURE__ */ jsx("div", {
      className: "px-4 py-2",
      children: /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-4 gap-4",
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => navigate("/chats"),
          className: "flex flex-col items-center gap-2 group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-white/10 group-active:scale-95 transition-all text-primary",
            children: /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-[28px]",
              children: "chat_bubble"
            })
          }), /* @__PURE__ */ jsx("span", {
            className: "text-xs font-medium text-gray-300",
            children: "New Chat"
          })]
        }), /* @__PURE__ */ jsxs("button", {
          onClick: () => navigate("/missions"),
          className: "flex flex-col items-center gap-2 group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-white/10 group-active:scale-95 transition-all text-[#FFD700]",
            children: /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-[28px]",
              children: "redeem"
            })
          }), /* @__PURE__ */ jsx("span", {
            className: "text-xs font-medium text-gray-300",
            children: "Missions"
          })]
        }), /* @__PURE__ */ jsxs("button", {
          onClick: () => navigate("/fandom"),
          className: "flex flex-col items-center gap-2 group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-white/10 group-active:scale-95 transition-all text-[#4CAF50]",
            children: /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-[28px]",
              children: "photo_library"
            })
          }), /* @__PURE__ */ jsx("span", {
            className: "text-xs font-medium text-gray-300",
            children: "Gallery"
          })]
        }), /* @__PURE__ */ jsxs("button", {
          className: "flex flex-col items-center gap-2 group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-white/10 group-active:scale-95 transition-all text-[#2196F3]",
            children: /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-[28px]",
              children: "storefront"
            })
          }), /* @__PURE__ */ jsx("span", {
            className: "text-xs font-medium text-gray-300",
            children: "Shop"
          })]
        })]
      })
    }), recentConversations.length > 0 && /* @__PURE__ */ jsxs("div", {
      className: "px-4 py-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex items-center justify-between mb-3",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-white text-lg font-bold",
          children: "Continue Chatting"
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => navigate("/chats"),
          className: "text-primary text-sm font-semibold",
          children: "View All"
        })]
      }), recentConversations.slice(0, 1).map((conversation2) => {
        const character2 = getCharacterFromConversation(conversation2);
        const lastMessage = conversation2.Message?.[0];
        return /* @__PURE__ */ jsxs("button", {
          onClick: () => navigate(`/chat/${conversation2.id}`),
          className: "w-full flex items-center gap-4 rounded-xl bg-surface-dark p-4 border border-white/5 active:bg-white/5 transition-colors text-left",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "relative",
            children: [/* @__PURE__ */ jsx("img", {
              alt: `Avatar of ${character2.name}`,
              className: "h-14 w-14 rounded-full object-cover ring-2 ring-primary/50",
              src: character2.media?.filter((m) => m.type === "AVATAR")?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url || character2.media?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
            }), character2.isOnline && /* @__PURE__ */ jsx("span", {
              className: "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-surface-dark"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex-1 min-w-0",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-baseline mb-1",
              children: [/* @__PURE__ */ jsx("h3", {
                className: "text-white font-bold truncate",
                children: character2.name
              }), lastMessage && /* @__PURE__ */ jsx("span", {
                className: "text-xs text-gray-500",
                children: formatTimeAgo(lastMessage.createdAt)
              })]
            }), lastMessage && /* @__PURE__ */ jsx("p", {
              className: "text-gray-400 text-sm truncate",
              children: lastMessage.content
            })]
          }), /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-gray-500 text-sm",
            children: "chevron_right"
          })]
        }, conversation2.id);
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "pb-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex items-center justify-between px-4 mb-3",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-white text-lg font-bold",
          children: "Trending Idols"
        }), /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-gray-400",
          children: "trending_up"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "flex overflow-x-auto px-4 gap-4 pb-4 scrollbar-hide snap-x",
        children: trendingIdols.map((character2, index2) => /* @__PURE__ */ jsxs("button", {
          onClick: () => navigate(`/character/${character2.id}`),
          className: "snap-center shrink-0 w-[140px] flex flex-col gap-2 group cursor-pointer",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "relative h-[180px] w-full rounded-xl overflow-hidden",
            children: [/* @__PURE__ */ jsx("img", {
              alt: character2.name,
              className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
              src: character2.media?.filter((m) => m.type === "COVER")?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url || character2.media?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute inset-0 bg-linear-to-t from-black/80 to-transparent opacity-60"
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFD700] text-black text-xs font-bold",
              children: index2 + 1
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute bottom-2 left-2 right-2",
              children: /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-1 text-xs text-white/80 mb-0.5",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[12px] text-primary",
                  children: "favorite"
                }), /* @__PURE__ */ jsx("span", {
                  children: Math.floor(Math.random() * 5e3 + 5e3)
                })]
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-white font-bold text-base leading-tight",
              children: character2.name
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-500 text-xs",
              children: character2.role
            })]
          })]
        }, character2.id))
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "px-4 pb-8",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex items-center justify-between mb-3",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-white text-lg font-bold",
          children: "News & Events"
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => navigate("/notices"),
          className: "text-primary text-xs font-bold uppercase tracking-widest",
          children: "See All"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "space-y-4",
        children: notices.length === 0 ? /* @__PURE__ */ jsx("div", {
          className: "py-8 text-center bg-white/5 rounded-2xl border border-white/5",
          children: /* @__PURE__ */ jsx("p", {
            className: "text-white/20 text-xs font-bold uppercase tracking-[0.2em]",
            children: "No official updates yet"
          })
        }) : notices.map((notice2) => /* @__PURE__ */ jsx("div", {
          onClick: () => navigate(`/notices/${notice2.id}`),
          className: "relative overflow-hidden rounded-xl bg-surface-dark border border-white/5 active:bg-white/10 transition-colors cursor-pointer group",
          children: /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col sm:flex-row",
            children: [/* @__PURE__ */ jsx("div", {
              className: "h-28 w-full sm:w-28 shrink-0 bg-cover bg-center bg-linear-to-br from-primary/30 to-purple-600/30",
              children: notice2.imageUrl && /* @__PURE__ */ jsx("img", {
                src: notice2.imageUrl,
                alt: "",
                className: "w-full h-full object-cover"
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex-1 p-4 flex flex-col justify-center",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2 mb-1",
                children: [/* @__PURE__ */ jsx("span", {
                  className: cn("rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white", notice2.type === "EVENT" ? "bg-emerald-500" : notice2.type === "NEWS" ? "bg-blue-600" : "bg-primary"),
                  children: notice2.type
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] text-gray-500 font-medium",
                  children: DateTime.fromJSDate(new Date(notice2.createdAt)).toFormat("LLL dd")
                })]
              }), /* @__PURE__ */ jsx("h3", {
                className: "text-white font-bold text-sm mb-1 group-hover:text-primary transition-colors truncate",
                children: notice2.title
              }), /* @__PURE__ */ jsx("p", {
                className: "text-gray-400 text-[11px] line-clamp-1 leading-relaxed",
                children: notice2.content
              })]
            })]
          })
        }, notice2.id))
      })]
    }), /* @__PURE__ */ jsx(BottomNavigation, {})]
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home$1,
  loader: loader$I,
  meta
}, Symbol.toStringTag, { value: "Module" }));
function LoginForm({
  onSubmit,
  onSocialLogin,
  isLoading = false,
  error
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && email && password) {
      onSubmit(email, password);
    }
  };
  return /* @__PURE__ */ jsxs("form", { className: "flex flex-col gap-4 w-full", onSubmit: handleSubmit, children: [
    error && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm mb-2", children: error }),
    /* @__PURE__ */ jsxs("div", { className: "group relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 transition-colors group-focus-within:text-primary", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "mail" }) }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          placeholder: "Email or ID",
          className: "w-full h-14 bg-surface-dark-input border border-[#67324d]/30 text-white placeholder:text-white/30 text-base font-medium rounded-2xl pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:font-normal",
          disabled: isLoading,
          required: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "group relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 transition-colors group-focus-within:text-primary", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "lock" }) }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: showPassword ? "text" : "password",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          placeholder: "Password",
          className: "w-full h-14 bg-surface-dark-input border border-[#67324d]/30 text-white placeholder:text-white/30 text-base font-medium rounded-2xl pl-12 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:font-normal",
          disabled: isLoading,
          required: true
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setShowPassword(!showPassword),
          className: "absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none",
          children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: showPassword ? "visibility" : "visibility_off" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-1", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/forgot-password",
        className: "text-sm font-semibold text-white/60 hover:text-primary transition-colors",
        children: "Forgot Password?"
      }
    ) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: isLoading || !email || !password,
        className: "mt-4 w-full h-14 bg-primary hover:bg-[#d61c78] active:scale-[0.98] text-white text-lg font-bold rounded-2xl shadow-[0_8px_20px_-6px_rgba(238,43,140,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
          /* @__PURE__ */ jsx("span", { children: "Logging in..." })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { children: "Log In" }),
          /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[20px]", children: "login" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-center mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute w-full h-px bg-white/10" }),
        /* @__PURE__ */ jsx("span", { className: "relative bg-background-dark px-4 text-xs font-medium text-white/40 uppercase tracking-widest", children: "Or login with" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-5", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onSocialLogin?.("twitter"),
            disabled: isLoading,
            className: "w-14 h-14 rounded-full bg-black border border-white/20 flex items-center justify-center hover:bg-gray-900 hover:border-white/30 hover:scale-110 transition-all duration-300 group disabled:opacity-50",
            title: "Login with X (Twitter)",
            children: /* @__PURE__ */ jsx(
              "svg",
              {
                viewBox: "0 0 24 24",
                className: "w-6 h-6 text-white group-hover:text-white fill-current",
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsx("path", { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" })
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onSocialLogin?.("google"),
            disabled: isLoading,
            className: "w-14 h-14 rounded-full bg-white border border-white/20 flex items-center justify-center hover:bg-white hover:border-white/30 hover:scale-110 transition-all duration-300 group disabled:opacity-50",
            title: "Login with Google",
            children: /* @__PURE__ */ jsxs("svg", { className: "w-6 h-6", viewBox: "0 0 24 24", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx(
                "path",
                {
                  d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
                  fill: "#4285F4"
                }
              ),
              /* @__PURE__ */ jsx(
                "path",
                {
                  d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
                  fill: "#34A853"
                }
              ),
              /* @__PURE__ */ jsx(
                "path",
                {
                  d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
                  fill: "#FBBC05"
                }
              ),
              /* @__PURE__ */ jsx(
                "path",
                {
                  d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
                  fill: "#EA4335"
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onSocialLogin?.("kakao"),
            disabled: isLoading,
            className: "w-14 h-14 rounded-full bg-[#fae100] border border-[#fae100] flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(250,225,0,0.2)] disabled:opacity-50",
            title: "Login with Kakao",
            children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ jsx(
              "path",
              {
                d: "M12 3C6.477 3 2 6.804 2 11.5c0 2.701 1.759 5.08 4.402 6.429l-1.16 4.35 4.862-2.788c.654.091 1.32.138 1.896.138 5.523 0 10-3.804 10-8.5S17.523 3 12 3z",
                fill: "#371D1E"
              }
            ) })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-center mt-8 text-white/50 text-sm", children: [
        "Don't have an account?",
        " ",
        /* @__PURE__ */ jsx(Link, { to: "/signup", className: "text-primary font-bold hover:underline ml-1", children: "Sign Up" })
      ] })
    ] })
  ] });
}
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:5173";
};
const authClient = createAuthClient({
  baseURL: getBaseURL(),
  basePath: "/auth"
});
const { signIn, signUp, signOut, useSession } = authClient;
const login = UNSAFE_withComponentProps(function LoginScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: data2,
        error: signInError
      } = await signIn.email({
        email,
        password,
        callbackURL: "/home"
      });
      if (signInError) {
        throw new Error(signInError.message || "로그인에 실패했습니다.");
      }
      setIsLoading(false);
      navigate("/home");
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    }
  };
  const handleSocialLogin = async (provider2) => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: data2,
        error: socialError
      } = await signIn.social({
        provider: provider2,
        callbackURL: "/home"
      });
      if (socialError) {
        throw new Error(socialError.message || "소셜 로그인에 실패했습니다.");
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Social login failed. Please try again.");
    }
  };
  return /* @__PURE__ */ jsx("div", {
    className: "bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display min-h-screen flex items-center justify-center overflow-hidden selection:bg-primary selection:text-white",
    children: /* @__PURE__ */ jsxs("div", {
      className: "relative w-full max-w-[480px] h-screen max-h-[900px] flex flex-col bg-background-dark shadow-2xl overflow-hidden sm:rounded-[32px] sm:h-[850px] sm:border-8 sm:border-[#1a0c13]",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "absolute top-0 w-full h-[55%] z-0",
        children: [/* @__PURE__ */ jsx("div", {
          className: "w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-105",
          style: {
            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDtjF4w7ZvVM4T5uqyckEeqlfUO_XmEqdkTAToLV6YuztHnBsKvVbSQSy29aR1lI28t5n7zT0EbK1OiG5ziGduV_u3oKhyMfHlWNTsTtqr_i5mcM_KFcpl0RD0w8MN2oc4JfUnMSxaSf2vUwpOlhzGC0sqGlnbzpyXg5oORX7Heq2BVT7MzctcDJCcOO9Ev5-fELndTr7h1-vmy5lYllbvuOkVkJ5FwhuADi7fMMQwwWSa0MG1y4U0QQSB1lKvViQAW8WJE8jdf53Y")'
          }
        }), /* @__PURE__ */ jsx("div", {
          className: "absolute inset-0 bg-gradient-fade z-10"
        }), /* @__PURE__ */ jsx("div", {
          className: "absolute inset-0 bg-primary/10 mix-blend-overlay z-10"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "relative z-20 flex items-center justify-between p-6",
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => navigate(-1),
          className: "w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white/10 transition-colors",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined",
            children: "arrow_back"
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10",
          children: /* @__PURE__ */ jsx("span", {
            className: "text-xs font-semibold tracking-wide uppercase text-white/80",
            children: "English"
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "relative z-20 flex flex-col flex-1 px-6 pb-8 overflow-y-auto no-scrollbar justify-end",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "mb-8 animate-fade-in-up",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md mb-4",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary text-[18px]",
              children: "favorite"
            }), /* @__PURE__ */ jsx("span", {
              className: "text-xs font-bold text-primary tracking-wide",
              children: "AI IDOL CHAT"
            })]
          }), /* @__PURE__ */ jsxs("h1", {
            className: "text-4xl font-bold text-white mb-3 leading-[1.1] tracking-tight",
            children: ["Welcome", /* @__PURE__ */ jsx("br", {}), "Back, Fan!"]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/70 text-base font-medium leading-relaxed",
            children: "Login to continue your daily conversations and exclusive moments."
          })]
        }), /* @__PURE__ */ jsx(LoginForm, {
          onSubmit: handleLogin,
          onSocialLogin: handleSocialLogin,
          isLoading,
          error: error || void 0
        })]
      })]
    })
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login
}, Symbol.toStringTag, { value: "Module" }));
function SignUpForm({
  onSubmit,
  isLoading = false,
  error
}) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    if (!agreeToTerms) return;
    if (onSubmit && email && nickname && password) {
      onSubmit(email, nickname, password);
    }
  };
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;
  const isFormValid = email && nickname && password && confirmPassword && agreeToTerms && isPasswordMatch;
  return /* @__PURE__ */ jsxs("form", { className: "flex flex-col gap-5", onSubmit: handleSubmit, children: [
    error && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm", children: error }),
    /* @__PURE__ */ jsxs("label", { className: "flex flex-col w-full", children: [
      /* @__PURE__ */ jsx("p", { className: "text-slate-700 dark:text-white text-sm font-semibold leading-normal pb-2 pl-1", children: "Email / ID" }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "Enter your email",
            className: "form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-border-pink bg-white dark:bg-surface-dark-input focus:border-primary h-14 placeholder:text-slate-400 dark:placeholder:text-text-muted px-[15px] text-base font-normal leading-normal transition-all",
            disabled: isLoading,
            required: true
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined text-[20px]", children: "mail" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "flex flex-col w-full", children: [
      /* @__PURE__ */ jsx("p", { className: "text-slate-700 dark:text-white text-sm font-semibold leading-normal pb-2 pl-1", children: "Nickname" }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: nickname,
            onChange: (e) => setNickname(e.target.value),
            placeholder: "What should she call you?",
            className: "form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-border-pink bg-white dark:bg-surface-dark-input focus:border-primary h-14 placeholder:text-slate-400 dark:placeholder:text-text-muted px-[15px] text-base font-normal leading-normal transition-all",
            disabled: isLoading,
            required: true
          }
        ),
        /* @__PURE__ */ jsx("span", { className: cn(
          "absolute right-4 top-1/2 -translate-y-1/2 text-green-400 material-symbols-outlined text-[20px] transition-opacity",
          nickname ? "opacity-100" : "opacity-0 text-gray-300"
        ), children: "check_circle" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "flex flex-col w-full", children: [
      /* @__PURE__ */ jsx("p", { className: "text-slate-700 dark:text-white text-sm font-semibold leading-normal pb-2 pl-1", children: "Password" }),
      /* @__PURE__ */ jsxs("div", { className: "relative group/pass", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: showPassword ? "text" : "password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "Create a password",
            className: "form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-border-pink bg-white dark:bg-surface-dark-input focus:border-primary h-14 placeholder:text-slate-400 dark:placeholder:text-text-muted px-[15px] text-base font-normal leading-normal transition-all",
            disabled: isLoading,
            required: true
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setShowPassword(!showPassword),
            className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-text-muted hover:text-primary transition-colors",
            children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[20px]", children: showPassword ? "visibility" : "visibility_off" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "flex flex-col w-full", children: [
      /* @__PURE__ */ jsx("p", { className: "text-slate-700 dark:text-white text-sm font-semibold leading-normal pb-2 pl-1", children: "Confirm Password" }),
      /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
        "input",
        {
          type: "password",
          value: confirmPassword,
          onChange: (e) => setConfirmPassword(e.target.value),
          placeholder: "Re-enter password",
          className: cn(
            "form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border bg-white dark:bg-surface-dark-login h-14 placeholder:text-slate-400 dark:placeholder:text-text-muted px-[15px] text-base font-normal leading-normal transition-all",
            confirmPassword ? isPasswordMatch ? "border-green-500" : "border-red-500" : "border-slate-200 dark:border-border-pink"
          ),
          disabled: isLoading,
          required: true
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mt-2 px-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            id: "terms",
            checked: agreeToTerms,
            onChange: (e) => setAgreeToTerms(e.target.checked),
            className: "peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-border-pink bg-white dark:bg-surface-dark-input checked:border-primary checked:bg-primary transition-all",
            disabled: isLoading,
            required: true
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[16px] font-bold", children: "check" }) })
      ] }),
      /* @__PURE__ */ jsxs("label", { htmlFor: "terms", className: "text-sm font-medium leading-tight text-slate-600 dark:text-text-muted cursor-pointer select-none", children: [
        "I agree to the ",
        /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "text-primary hover:underline", children: "Privacy Policy" }),
        " and ",
        /* @__PURE__ */ jsx(Link, { to: "/terms", className: "text-primary hover:underline", children: "Terms of Service" }),
        "."
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: isLoading || !isFormValid,
        className: "mt-4 flex w-full items-center justify-center rounded-xl bg-primary py-4 px-6 text-base font-bold text-white shadow-[0_4px_14px_0_rgba(238,43,140,0.39)] hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(238,43,140,0.23)] hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed",
        children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" }),
          "Creating account..."
        ] }) : "Start Chatting"
      }
    ),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm font-medium text-slate-500 dark:text-text-muted mt-2", children: [
      "Already have an account? ",
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary font-bold hover:underline ml-1", children: "Log in" })
    ] })
  ] });
}
const signup = UNSAFE_withComponentProps(function SignUpScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSignUp = async (email, nickname, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: data2,
        error: signUpError
      } = await signUp.email({
        email,
        password,
        name: nickname
      });
      if (signUpError) {
        throw new Error(signUpError.message || "회원가입에 실패했습니다.");
      }
      setIsLoading(false);
      window.location.href = "/home";
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    }
  };
  return /* @__PURE__ */ jsx("div", {
    className: "bg-background-light dark:bg-background-dark font-display antialiased text-slate-900 dark:text-white",
    children: /* @__PURE__ */ jsxs("div", {
      className: "relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto overflow-x-hidden shadow-2xl",
      children: [/* @__PURE__ */ jsxs("header", {
        className: "sticky top-0 z-10 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 pb-2 justify-between",
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => navigate(-1),
          className: "text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-[24px]",
            children: "arrow_back_ios_new"
          })
        }), /* @__PURE__ */ jsx("h2", {
          className: "text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10",
          children: "Sign Up"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex-1 flex flex-col px-6 pt-2 pb-10",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "relative w-full h-32 mb-6 rounded-2xl overflow-hidden group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent"
          }), /* @__PURE__ */ jsx("div", {
            className: "absolute -top-10 -right-10 w-40 h-40 bg-primary/40 rounded-full blur-3xl"
          }), /* @__PURE__ */ jsx("div", {
            className: "absolute top-10 left-10 w-20 h-20 bg-purple-500/30 rounded-full blur-2xl"
          }), /* @__PURE__ */ jsxs("div", {
            className: "relative h-full flex items-center px-6",
            children: [/* @__PURE__ */ jsx("div", {
              className: "size-16 rounded-full border-2 border-primary/50 overflow-hidden shadow-[0_0_15px_rgba(238,43,140,0.4)]",
              children: /* @__PURE__ */ jsx("img", {
                alt: "AI Idol Avatar Abstract",
                className: "w-full h-full object-cover",
                src: "/illustrations/rina.png"
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "ml-4 flex flex-col justify-center",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-xs font-bold text-primary uppercase tracking-wider mb-1",
                children: "Join the Fanbase"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-sm text-slate-600 dark:text-[#c992ad]",
                children: "Unlock exclusive chats & content."
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "mb-6",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-slate-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight mb-2",
            children: "Create your account"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-slate-500 dark:text-[#c992ad] text-base font-normal leading-relaxed",
            children: "Start your journey with your AI today. She's waiting to meet you."
          })]
        }), /* @__PURE__ */ jsx(SignUpForm, {
          onSubmit: handleSignUp,
          isLoading,
          error: error || void 0
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "h-6 w-full"
      })]
    })
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: signup
}, Symbol.toStringTag, { value: "Module" }));
let nearConnection = null;
async function getNearConnection() {
  if (nearConnection) return nearConnection;
  const networkId = process.env.NEAR_NETWORK_ID || "testnet";
  const keyStore = new keyStores.InMemoryKeyStore();
  if (process.env.NEAR_SERVICE_ACCOUNT_ID && process.env.NEAR_SERVICE_PRIVATE_KEY) {
    const keyPair = KeyPair$1.fromString(process.env.NEAR_SERVICE_PRIVATE_KEY);
    await keyStore.setKey(networkId, process.env.NEAR_SERVICE_ACCOUNT_ID, keyPair);
  }
  const config = {
    networkId,
    nodeUrl: process.env.NEAR_NODE_URL || "https://rpc.testnet.fastnear.com",
    keyStore,
    headers: {}
  };
  nearConnection = await connect(config);
  return nearConnection;
}
const NEAR_CONFIG = {
  networkId: process.env.NEAR_NETWORK_ID || "testnet",
  nodeUrl: process.env.NEAR_NODE_URL || "https://rpc.testnet.fastnear.com",
  chocoTokenContract: process.env.CHOCO_TOKEN_CONTRACT || "choco.token.primitives.testnet",
  serviceAccountId: process.env.NEAR_SERVICE_ACCOUNT_ID || "rogulus.testnet"
};
const STORAGE_DEPOSIT_AMOUNT = "0.00125";
async function ensureStorageDeposit(userNearAccountId) {
  const networkId = NEAR_CONFIG.networkId;
  const nodeUrl = NEAR_CONFIG.nodeUrl;
  const serviceAccountId = NEAR_CONFIG.serviceAccountId;
  const privateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;
  if (!privateKey) {
    console.warn("NEAR_SERVICE_PRIVATE_KEY is not set. Skipping storage deposit.");
    return { success: false, reason: "No private key" };
  }
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair$1.fromString(privateKey);
  await keyStore.setKey(networkId, serviceAccountId, keyPair);
  const near = await connect({
    networkId,
    nodeUrl,
    keyStore
  });
  const serviceAccount = await near.account(serviceAccountId);
  try {
    console.log(`Paying storage deposit for ${userNearAccountId} on ${NEAR_CONFIG.chocoTokenContract}...`);
    const result = await serviceAccount.functionCall({
      contractId: NEAR_CONFIG.chocoTokenContract,
      methodName: "storage_deposit",
      args: {
        account_id: userNearAccountId,
        registration_only: false
      },
      gas: BigInt("30000000000000"),
      // 30 TGas
      attachedDeposit: BigInt(utils$1.format.parseNearAmount(STORAGE_DEPOSIT_AMOUNT))
    });
    console.log(`Storage deposit successful for ${userNearAccountId}:`, result.transaction.hash);
    return { success: true, txHash: result.transaction.hash };
  } catch (error) {
    console.error(`Failed to pay storage deposit for ${userNearAccountId}:`, error);
    if (error instanceof Error && error.message.includes("Already registered")) {
      return { success: true, message: "Already registered" };
    }
    return { success: false, error };
  }
}
const storageDeposit_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ensureStorageDeposit
}, Symbol.toStringTag, { value: "Module" }));
async function ensureNearWallet(userId) {
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      id: true,
      email: true,
      nearAccountId: true,
      nearPublicKey: true,
      nearPrivateKey: true,
      credits: true,
      chocoBalance: true
    }
  });
  if (!user$1) return null;
  let isWalletExist = false;
  let newAccountId = user$1.nearAccountId;
  if (user$1.nearAccountId && user$1.nearPublicKey && user$1.nearPrivateKey) {
    console.log(`[Wallet] Existing wallet found for user: ${userId} (${user$1.nearAccountId})`);
    isWalletExist = true;
  }
  if (user$1.nearAccountId && (!user$1.nearPublicKey || !user$1.nearPrivateKey)) {
    console.error(`[CRITICAL] Wallet ${user$1.nearAccountId} for user ${userId} is missing private key or public key!`);
  }
  if (!isWalletExist) {
    console.log(`[Wallet] Creation phase started for user: ${userId}`);
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;
    if (!servicePrivateKey) throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing from environment");
    const { nanoid: nanoid2 } = await import("nanoid");
    const uniqueSuffix = nanoid2(10).toLowerCase().replace(/[^a-z0-9]/g, "");
    const derivedAccountId = `${uniqueSuffix}.${serviceAccountId}`;
    newAccountId = user$1.nearAccountId || derivedAccountId;
    let publicKey = user$1.nearPublicKey;
    let encryptedPrivateKey = user$1.nearPrivateKey;
    if (!publicKey || !encryptedPrivateKey) {
      const keyPair = KeyPair$1.fromRandom("ed25519");
      publicKey = keyPair.getPublicKey().toString();
      const privateKey = keyPair.toString();
      const { encrypt: encrypt2 } = await Promise.resolve().then(() => keyEncryption_server);
      encryptedPrivateKey = encrypt2(privateKey);
      await db.update(user).set({
        nearAccountId: newAccountId,
        nearPublicKey: publicKey,
        nearPrivateKey: encryptedPrivateKey,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, userId));
      console.log(`[Wallet] Keys saved to DB for ${userId}. Proceeding to on-chain creation.`);
    }
    try {
      const networkId = NEAR_CONFIG.networkId;
      const nodeUrl = NEAR_CONFIG.nodeUrl;
      const keyStore = new keyStores.InMemoryKeyStore();
      await keyStore.setKey(networkId, serviceAccountId, KeyPair$1.fromString(servicePrivateKey));
      const near = await connect({ networkId, nodeUrl, keyStore });
      const serviceAccount = await near.account(serviceAccountId);
      const initialBalance = BigInt("100000000000000000000000");
      console.log(`[Wallet] Attempting on-chain createAccount: ${newAccountId}`);
      await serviceAccount.createAccount(newAccountId, publicKey, initialBalance.toString());
      console.log(`[Wallet] On-chain account created: ${newAccountId}`);
    } catch (createError) {
      const isAccountExists = createError.type === "AccountAlreadyExists" || createError.message?.includes("already exists") || createError.message?.includes("AccountAlreadyExists");
      if (isAccountExists) {
        console.log(`[Wallet] Account ${newAccountId} already exists on-chain. Resuming flow.`);
      } else {
        console.error(`[Wallet] On-chain error during creation:`, createError);
        throw createError;
      }
    }
    try {
      await ensureStorageDeposit(newAccountId);
    } catch (storageError) {
      console.warn(`[Wallet] Storage deposit warning (might already exist):`, storageError);
    }
  }
  if (newAccountId) {
    try {
      const { BigNumber: BigNumber2 } = await import("bignumber.js");
      const { sendChocoToken, getChocoBalance: getChocoBalance2 } = await import("./token.server-Gkt5Fi9h.js");
      const { nanoid: nanoid2 } = await import("nanoid");
      const existingReward = await db.query.tokenTransfer.findFirst({
        where: (table, { and: and2, eq: eq2 }) => and2(
          eq2(table.userId, userId),
          eq2(table.purpose, "SIGNUP_REWARD"),
          eq2(table.status, "COMPLETED")
        )
      });
      if (!existingReward) {
        const signupReward = 100;
        const chocoAmountRaw = new BigNumber2(signupReward).multipliedBy(new BigNumber2(10).pow(18)).toFixed(0);
        console.log(`[Wallet] Rewarding user ${userId} with ${signupReward} CHOCO...`);
        try {
          const sendResult = await sendChocoToken(newAccountId, chocoAmountRaw);
          const chocoTxHash = sendResult.transaction.hash;
          if (chocoTxHash) {
            await db.transaction(async (tx) => {
              await tx.insert(tokenTransfer).values({
                id: nanoid2(),
                userId,
                txHash: chocoTxHash,
                amount: chocoAmountRaw,
                tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                status: "COMPLETED",
                purpose: "SIGNUP_REWARD",
                createdAt: /* @__PURE__ */ new Date()
              });
            });
          }
        } catch (sendError) {
          console.error(`[Wallet] Failed to send signup reward:`, sendError);
        }
      }
      const onChainBalanceRaw = await getChocoBalance2(newAccountId);
      const onChainBalanceBN = new BigNumber2(onChainBalanceRaw).dividedBy(new BigNumber2(10).pow(18));
      await db.update(user).set({
        chocoBalance: onChainBalanceBN.toString(),
        credits: 0,
        chocoLastSyncAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, userId));
      console.log(`[Wallet] Synced ${newAccountId} balance: ${onChainBalanceBN.toString()} CHOCO`);
    } catch (error) {
      console.error(`[Wallet] Post-process (reward/sync) failed:`, error);
    }
  }
  return newAccountId;
}
async function ensureNearWalletAsync(userId) {
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      id: true,
      nearAccountId: true,
      nearPublicKey: true,
      nearPrivateKey: true,
      walletStatus: true
    }
  });
  if (!user$1) return null;
  if (user$1.nearAccountId && user$1.walletStatus === "READY") {
    return user$1.nearAccountId;
  }
  if (user$1.nearAccountId && (user$1.walletStatus === "PENDING" || user$1.walletStatus === "CREATING")) {
    return user$1.nearAccountId;
  }
  if (user$1.nearAccountId && user$1.walletStatus === "FAILED") {
    await db.update(user).set({
      walletStatus: "PENDING",
      walletError: null,
      walletCreatedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(user.id, userId));
    return user$1.nearAccountId;
  }
  const { nanoid: nanoid2 } = await import("nanoid");
  const serviceAccountId = NEAR_CONFIG.serviceAccountId;
  const uniqueSuffix = nanoid2(10).toLowerCase().replace(/[^a-z0-9]/g, "");
  const newAccountId = user$1.nearAccountId || `${uniqueSuffix}.${serviceAccountId}`;
  let publicKey = user$1.nearPublicKey;
  let encryptedPrivateKey = user$1.nearPrivateKey;
  if (!publicKey || !encryptedPrivateKey) {
    const keyPair = KeyPair$1.fromRandom("ed25519");
    publicKey = keyPair.getPublicKey().toString();
    const privateKey = keyPair.toString();
    const { encrypt: encrypt2 } = await Promise.resolve().then(() => keyEncryption_server);
    encryptedPrivateKey = encrypt2(privateKey);
  }
  await db.update(user).set({
    nearAccountId: newAccountId,
    nearPublicKey: publicKey,
    nearPrivateKey: encryptedPrivateKey,
    walletStatus: "PENDING",
    walletCreatedAt: /* @__PURE__ */ new Date(),
    walletRetryCount: 0,
    walletError: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(user.id, userId));
  console.log(`[Wallet Async] Keys saved, status=PENDING for user ${userId} (${newAccountId})`);
  return newAccountId;
}
async function ensureNearWalletOnChain(userId, nearAccountId, publicKey, encryptedPrivateKey) {
  const serviceAccountId = NEAR_CONFIG.serviceAccountId;
  const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;
  if (!servicePrivateKey) throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing");
  const networkId = NEAR_CONFIG.networkId;
  const nodeUrl = NEAR_CONFIG.nodeUrl;
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(networkId, serviceAccountId, KeyPair$1.fromString(servicePrivateKey));
  const near = await connect({ networkId, nodeUrl, keyStore });
  const serviceAccount = await near.account(serviceAccountId);
  const initialBalance = BigInt("100000000000000000000000");
  try {
    console.log(`[Wallet OnChain] Creating account: ${nearAccountId}`);
    await serviceAccount.createAccount(nearAccountId, publicKey, initialBalance.toString());
    console.log(`[Wallet OnChain] Account created: ${nearAccountId}`);
  } catch (createError) {
    const isAccountExists = createError.type === "AccountAlreadyExists" || createError.message?.includes("already exists") || createError.message?.includes("AccountAlreadyExists");
    if (!isAccountExists) throw createError;
    console.log(`[Wallet OnChain] Account ${nearAccountId} already exists. Continuing.`);
  }
  try {
    await ensureStorageDeposit(nearAccountId);
  } catch (storageError) {
    console.warn(`[Wallet OnChain] Storage deposit warning:`, storageError);
  }
  const { BigNumber: BigNumber2 } = await import("bignumber.js");
  const { sendChocoToken, getChocoBalance: getChocoBalance2 } = await import("./token.server-Gkt5Fi9h.js");
  const { nanoid: nanoid2 } = await import("nanoid");
  const existingReward = await db.query.tokenTransfer.findFirst({
    where: (table, { and: and2, eq: eq2 }) => and2(
      eq2(table.userId, userId),
      eq2(table.purpose, "SIGNUP_REWARD"),
      eq2(table.status, "COMPLETED")
    )
  });
  if (!existingReward) {
    const signupReward = 100;
    const chocoAmountRaw = new BigNumber2(signupReward).multipliedBy(new BigNumber2(10).pow(18)).toFixed(0);
    console.log(`[Wallet OnChain] Sending ${signupReward} CHOCO to ${nearAccountId}`);
    const sendResult = await sendChocoToken(nearAccountId, chocoAmountRaw);
    const chocoTxHash = sendResult.transaction?.hash;
    if (chocoTxHash) {
      await db.insert(tokenTransfer).values({
        id: nanoid2(),
        userId,
        txHash: chocoTxHash,
        amount: chocoAmountRaw,
        tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
        status: "COMPLETED",
        purpose: "SIGNUP_REWARD",
        createdAt: /* @__PURE__ */ new Date()
      });
    }
  }
  const onChainBalanceRaw = await getChocoBalance2(nearAccountId);
  const onChainBalanceBN = new BigNumber2(onChainBalanceRaw).dividedBy(new BigNumber2(10).pow(18));
  await db.update(user).set({
    chocoBalance: onChainBalanceBN.toString(),
    credits: 0,
    chocoLastSyncAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(user.id, userId));
  console.log(`[Wallet OnChain] Synced ${nearAccountId} balance: ${onChainBalanceBN.toString()} CHOCO`);
}
async function getUserNearWallet(userId) {
  return await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      nearAccountId: true,
      nearPublicKey: true,
      chocoBalance: true,
      heartsCount: true,
      allowanceAmount: true,
      allowanceExpiresAt: true
    }
  });
}
function LoadingSpinner({ size = "md", className }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3"
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "border-white/30 border-t-white rounded-full animate-spin",
        sizeClasses[size],
        className
      )
    }
  );
}
async function loader$H({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return redirect("/login");
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, session2.user.id),
    columns: {
      nearAccountId: true
    }
  });
  if (existingUser?.nearAccountId) {
    return redirect("/home");
  }
  return {
    userId: session2.user.id
  };
}
async function action$J({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return {
    error: "Unauthorized"
  };
  try {
    console.log(`[Wallet Setup] Starting async setup for ${session2.user.email}`);
    const accountId = await ensureNearWalletAsync(session2.user.id);
    if (accountId) {
      console.log(`[Wallet Setup] Queued for ${session2.user.email}, account: ${accountId}`);
      return {
        success: true,
        accountId,
        status: "PENDING"
      };
    } else {
      return {
        error: "지갑 생성에 실패했습니다. (No Account ID returned)"
      };
    }
  } catch (error) {
    console.error(`[Wallet Setup] Action Error:`, error);
    return {
      error: error.message || "지갑 생성 중 알 수 없는 오류가 발생했습니다."
    };
  }
}
const walletSetup = UNSAFE_withComponentProps(function WalletSetupPage() {
  const fetcher = useFetcher();
  const [isStarted, setIsStarted] = useState(false);
  useEffect(() => {
    if (!isStarted && fetcher.state === "idle" && !fetcher.data) {
      setIsStarted(true);
      fetcher.submit({}, {
        method: "post"
      });
    }
  }, [isStarted, fetcher]);
  useEffect(() => {
    if (fetcher.data?.success) {
      window.location.href = "/home";
    }
  }, [fetcher.data]);
  const error = fetcher.data?.error;
  const isLoading = fetcher.state !== "idle" || fetcher.data?.success && !error;
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center",
    children: [/* @__PURE__ */ jsx("div", {
      className: "fixed inset-0 overflow-hidden pointer-events-none",
      children: /* @__PURE__ */ jsx("div", {
        className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "relative z-10",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "relative mb-12",
        children: [/* @__PURE__ */ jsx("div", {
          className: `absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 ${isLoading ? "animate-pulse" : ""}`
        }), /* @__PURE__ */ jsx("div", {
          className: "relative flex items-center justify-center",
          children: isLoading ? /* @__PURE__ */ jsx(LoadingSpinner, {
            className: "w-16 h-16 text-primary stroke-[3px]"
          }) : /* @__PURE__ */ jsx("div", {
            className: "w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center",
            children: /* @__PURE__ */ jsx("span", {
              className: "text-2xl",
              children: "!"
            })
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "space-y-6",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs("h1", {
            className: "text-3xl font-black italic tracking-tighter text-white uppercase animate-in fade-in slide-in-from-bottom-4 duration-700",
            children: ["Setting up ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: "Wallet"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-bold tracking-[0.2em] uppercase",
            children: "Blockchain initialization"
          })]
        }), /* @__PURE__ */ jsx("div", {
          className: "max-w-xs mx-auto",
          children: isLoading ? /* @__PURE__ */ jsx("div", {
            className: "bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl",
            children: /* @__PURE__ */ jsx("p", {
              className: "text-white text-lg font-bold leading-snug",
              children: "지갑을 준비하고 있습니다..."
            })
          }) : error ? /* @__PURE__ */ jsxs("div", {
            className: "mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm animate-in zoom-in-95 duration-300",
            children: [/* @__PURE__ */ jsx("p", {
              className: "font-bold mb-1",
              children: "문제가 발생했습니다"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-red-500/70",
              children: error
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => fetcher.submit({}, {
                method: "post"
              }),
              className: "mt-3 px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-xs hover:bg-red-600 transition-colors",
              children: "다시 시도하기"
            })]
          }) : null
        })]
      })]
    })]
  });
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$J,
  default: walletSetup,
  loader: loader$H
}, Symbol.toStringTag, { value: "Module" }));
function RollingCounter({
  value,
  duration = 500,
  className,
  prefix = "",
  suffix = ""
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [changeType, setChangeType] = useState("none");
  useEffect(() => {
    if (value === displayValue) return;
    setChangeType(value > displayValue ? "increase" : "decrease");
    if (duration === 0) {
      setDisplayValue(value);
      const timer = setTimeout(() => setChangeType("none"), 300);
      return () => clearTimeout(timer);
    }
    setIsAnimating(true);
    const startValue = displayValue;
    const endValue = value;
    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = (x) => {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
      };
      const currentProgress = easeOut(progress);
      const current = Math.floor(startValue + (endValue - startValue) * currentProgress);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        setTimeout(() => setChangeType("none"), 300);
      }
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value, duration]);
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: cn(
        "transition-colors duration-300",
        changeType === "decrease" && "text-red-500 font-bold",
        changeType === "increase" && "text-green-500 font-bold",
        className
      ),
      children: [
        prefix,
        displayValue.toLocaleString(),
        suffix
      ]
    }
  );
}
function BalanceChangeIndicator({
  amount,
  duration = 2e3,
  className
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    if (amount === 0) return;
    setIsVisible(true);
    setOpacity(1);
    const fadeStart = duration * 0.6;
    const fadeDuration = duration * 0.4;
    const fadeTimer = setTimeout(() => {
      const startTime = Date.now();
      const fade = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / fadeDuration, 1);
        setOpacity(1 - progress);
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          setIsVisible(false);
        }
      };
      requestAnimationFrame(fade);
    }, fadeStart);
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [amount, duration]);
  if (!isVisible || amount === 0) return null;
  const isPositive = amount > 0;
  const displayAmount = Math.abs(amount);
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: cn(
        "inline-block font-bold text-xs transition-opacity duration-300",
        isPositive ? "text-green-500" : "text-red-500",
        className
      ),
      style: { opacity },
      children: [
        isPositive ? "+" : "-",
        displayAmount.toLocaleString()
      ]
    }
  );
}
const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Button$1,
    {
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
function Dialog({ ...props }) {
  return /* @__PURE__ */ jsx(Dialog$1.Root, { "data-slot": "dialog", ...props });
}
function DialogTrigger({ ...props }) {
  return /* @__PURE__ */ jsx(Dialog$1.Trigger, { "data-slot": "dialog-trigger", ...props });
}
function DialogPortal({ ...props }) {
  return /* @__PURE__ */ jsx(Dialog$1.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Dialog$1.Backdrop,
    {
      "data-slot": "dialog-overlay",
      className: cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50", className),
      ...props
    }
  );
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return /* @__PURE__ */ jsxs(DialogPortal, { children: [
    /* @__PURE__ */ jsx(DialogOverlay, {}),
    /* @__PURE__ */ jsxs(
      Dialog$1.Popup,
      {
        "data-slot": "dialog-content",
        className: cn(
          "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-sm ring-1 duration-100 sm:max-w-sm fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          className
        ),
        ...props,
        children: [
          children,
          showCloseButton && /* @__PURE__ */ jsxs(
            Dialog$1.Close,
            {
              "data-slot": "dialog-close",
              render: /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  className: "absolute top-2 right-2",
                  size: "icon-sm"
                }
              ),
              children: [
                /* @__PURE__ */ jsx(HugeiconsIcon, { icon: Cancel01Icon, strokeWidth: 2 }),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
              ]
            }
          )
        ]
      }
    )
  ] });
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-header",
      className: cn("gap-2 flex flex-col", className),
      ...props
    }
  );
}
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-slot": "dialog-footer",
      className: cn(
        "bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props,
      children: [
        children,
        showCloseButton && /* @__PURE__ */ jsx(Dialog$1.Close, { render: /* @__PURE__ */ jsx(Button, { variant: "outline" }), children: "Close" })
      ]
    }
  );
}
function DialogTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    Dialog$1.Title,
    {
      "data-slot": "dialog-title",
      className: cn("text-sm leading-none font-medium", className),
      ...props
    }
  );
}
function DialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Dialog$1.Description,
    {
      "data-slot": "dialog-description",
      className: cn("text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3", className),
      ...props
    }
  );
}
function DropdownMenu({ ...props }) {
  return /* @__PURE__ */ jsx(Menu.Root, { "data-slot": "dropdown-menu", ...props });
}
function DropdownMenuTrigger({ ...props }) {
  return /* @__PURE__ */ jsx(Menu.Trigger, { "data-slot": "dropdown-menu-trigger", ...props });
}
function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(Menu.Portal, { children: /* @__PURE__ */ jsx(
    Menu.Positioner,
    {
      className: "isolate z-50 outline-none",
      align,
      alignOffset,
      side,
      sideOffset,
      children: /* @__PURE__ */ jsx(
        Menu.Popup,
        {
          "data-slot": "dropdown-menu-content",
          className: cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none data-closed:overflow-hidden", className),
          ...props
        }
      )
    }
  ) });
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Menu.Item,
    {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      ),
      ...props
    }
  );
}
function ChatHeader({
  characterName,
  characterId,
  isOnline = true,
  statusText = "Online now",
  onBack,
  onDeleteChat,
  onResetChat,
  statusClassName,
  statusOpacity = 1,
  chocoBalance,
  chocoChange,
  isOptimisticDeducting
}) {
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  return /* @__PURE__ */ jsx("header", { className: "flex-none z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 sticky top-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onBack,
        className: "flex items-center justify-center text-slate-600 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full w-10 h-10 transition-colors",
        children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "arrow_back_ios_new" })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center flex-1 mx-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        characterId ? /* @__PURE__ */ jsx(
          Link,
          {
            to: `/character/${characterId}`,
            className: "text-lg font-bold leading-tight hover:underline",
            children: characterName
          }
        ) : /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold leading-tight", children: characterName }),
        isOnline && /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" })
      ] }),
      /* @__PURE__ */ jsx(
        "span",
        {
          className: cn("text-[11px] text-primary font-bold uppercase tracking-widest mt-0.5 transition-colors duration-500", statusClassName),
          style: { opacity: statusOpacity },
          children: statusText
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      chocoBalance !== void 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "hidden sm:flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 mr-1", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center relative", children: [
          /* @__PURE__ */ jsx(
            RollingCounter,
            {
              value: Number(chocoBalance),
              className: "text-xs font-bold text-slate-700 dark:text-slate-200 mr-1",
              duration: isOptimisticDeducting ? 0 : 500
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500 dark:text-slate-400", children: "CHOCO" }),
          chocoChange !== void 0 && chocoChange !== 0 && /* @__PURE__ */ jsx(
            BalanceChangeIndicator,
            {
              amount: chocoChange,
              className: "absolute -right-6 top-0 whitespace-nowrap"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs(Dialog, { open: balanceDialogOpen, onOpenChange: setBalanceDialogOpen, children: [
          /* @__PURE__ */ jsx(
            DialogTrigger,
            {
              render: /* @__PURE__ */ jsx("button", { className: "sm:hidden flex items-center px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 mr-1", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300", children: "account_balance_wallet" }) })
            }
          ),
          /* @__PURE__ */ jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsx(DialogTitle, { children: "내 잔액" }),
              /* @__PURE__ */ jsx(DialogDescription, { children: "현재 보유 중인 자산입니다." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "py-4 space-y-4", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "CHOCO" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                /* @__PURE__ */ jsx(
                  RollingCounter,
                  {
                    value: Number(chocoBalance),
                    className: "text-2xl font-bold text-slate-900 dark:text-white",
                    duration: isOptimisticDeducting ? 0 : 500
                  }
                ),
                chocoChange !== void 0 && chocoChange !== 0 && /* @__PURE__ */ jsx(BalanceChangeIndicator, { amount: chocoChange })
              ] })
            ] }) }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsx(
          DropdownMenuTrigger,
          {
            render: /* @__PURE__ */ jsx(
              "button",
              {
                className: "flex items-center justify-center text-slate-600 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full w-10 h-10 transition-colors",
                children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "more_horiz" })
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
          /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: onDeleteChat, variant: "destructive", children: [
            /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined mr-2 text-[18px]", children: "delete" }),
            "대화방 삭제"
          ] }),
          /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: onResetChat, children: [
            /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined mr-2 text-[18px]", children: "restart_alt" }),
            "대화 초기화 (기억 포함)"
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
function MessageBubble({
  content,
  sender,
  senderName,
  timestamp,
  avatarUrl,
  showAvatar = true,
  className,
  isStreaming = false,
  mediaUrl,
  messageId,
  isLiked = false,
  onLike,
  auraClass,
  auraOpacity = 1,
  auraStyle
}) {
  const isUser = sender === "user";
  const handleLike = () => {
    if (messageId && onLike) {
      onLike(messageId, isLiked);
    }
  };
  if (isUser) {
    return /* @__PURE__ */ jsxs("div", { className: cn("flex items-end gap-3 justify-end group", className), children: [
      messageId && onLike && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleLike,
          className: cn(
            "opacity-0 group-hover:opacity-100 transition-opacity p-1 order-1",
            isLiked ? "opacity-100 text-primary" : "text-gray-400 dark:text-gray-600 hover:text-primary dark:hover:text-primary"
          ),
          children: /* @__PURE__ */ jsx("span", { className: cn(
            "material-symbols-outlined text-[18px]",
            isLiked && "fill"
          ), children: "favorite" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 items-end max-w-[75%] order-2", children: [
        mediaUrl && /* @__PURE__ */ jsx("div", { className: "mb-2 rounded-xl overflow-hidden shadow-lg border-2 border-primary/20 max-w-sm", children: /* @__PURE__ */ jsx("img", { src: mediaUrl, alt: "User shared", className: "w-full h-auto max-h-60 object-cover" }) }),
        /* @__PURE__ */ jsx("div", { className: "px-5 py-1 bg-primary text-white rounded-2xl rounded-tr-sm shadow-md shadow-primary/20 text-[15px] leading-relaxed", children: content }),
        timestamp && /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-400 dark:text-white/30 mr-1", children: timestamp })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-end gap-3 group", className), children: [
    showAvatar && /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "w-10 h-10 shrink-0 rounded-full bg-gray-300 dark:bg-surface-dark overflow-hidden border border-white/10 relative transition-all duration-500",
          auraClass
        ),
        style: { opacity: auraOpacity, ...auraStyle },
        children: avatarUrl ? /* @__PURE__ */ jsx(
          "img",
          {
            alt: senderName || "AI profile",
            className: "w-full h-full object-cover",
            src: avatarUrl
          }
        ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 items-start max-w-[75%]", children: [
      senderName && /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400 ml-1", children: senderName }),
      mediaUrl && /* @__PURE__ */ jsx("div", { className: "mb-2 rounded-xl overflow-hidden shadow-lg border border-white/10 max-w-sm", children: /* @__PURE__ */ jsx("img", { src: mediaUrl, alt: "AI shared", className: "w-full h-auto max-h-60 object-cover" }) }),
      /* @__PURE__ */ jsxs("div", { className: "px-5 py-3 bg-white dark:bg-surface-dark rounded-2xl rounded-tl-sm text-slate-800 dark:text-gray-100 shadow-sm text-[15px] leading-relaxed relative", children: [
        content,
        isStreaming && /* @__PURE__ */ jsx("span", { className: "inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" })
      ] }),
      timestamp && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 ml-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-400 dark:text-white/30", children: timestamp }),
        messageId && onLike && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleLike,
            className: cn(
              "opacity-0 group-hover:opacity-100 transition-opacity p-1",
              isLiked ? "opacity-100 text-primary" : "text-gray-400 dark:text-gray-600 hover:text-primary dark:hover:text-primary"
            ),
            children: /* @__PURE__ */ jsx("span", { className: cn(
              "material-symbols-outlined text-[18px]",
              isLiked && "fill"
            ), children: "favorite" })
          }
        )
      ] }),
      !timestamp && messageId && onLike && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleLike,
          className: cn(
            "opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-1",
            isLiked ? "opacity-100 text-primary" : "text-gray-400 dark:text-gray-600 hover:text-primary dark:hover:text-primary"
          ),
          children: /* @__PURE__ */ jsx("span", { className: cn(
            "material-symbols-outlined text-[18px]",
            isLiked && "fill"
          ), children: "favorite" })
        }
      )
    ] })
  ] });
}
const ITEMS = {
  HEART: {
    id: "heart",
    name: "하트",
    type: "GIFT",
    iconUrl: "favorite",
    // Material Symbols icon name
    description: "아이돌에게 사랑을 전하는 가장 기본적인 방법입니다.",
    priceChoco: 1500
    // 1 Credit = 1 CHOCO (1:1 환율)
  }
};
const HEART_PACKAGES = [
  {
    id: "heart_pack_1",
    itemId: "heart",
    name: "하트 작은 상자",
    quantity: 10,
    priceKRW: 1500,
    priceUSD: 1.2,
    description: "가볍게 마음을 전하기 좋아요.",
    image: "https://cdn-icons-png.flaticon.com/512/1077/1077035.png"
    // Heart icon
  },
  {
    id: "heart_pack_2",
    itemId: "heart",
    name: "하트 큰 상자",
    quantity: 50,
    priceKRW: 7e3,
    priceUSD: 5.5,
    description: "듬뿍 담긴 하트로 응원해주세요!",
    image: "https://cdn-icons-png.flaticon.com/512/3128/3128313.png",
    // Multiple hearts
    isPopular: true
  },
  {
    id: "heart_pack_3",
    itemId: "heart",
    name: "하트 보물상자",
    quantity: 100,
    priceKRW: 13e3,
    priceUSD: 10,
    description: "당신은 최고의 팬입니다!",
    image: "https://cdn-icons-png.flaticon.com/512/2859/2859706.png"
    // Glowing heart
  }
];
function GiftSelector({
  isOpen,
  onClose,
  onGift,
  onOpenStore,
  ownedHearts = 0
}) {
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [isSending, setIsSending] = useState(false);
  if (!isOpen) return null;
  const item2 = ITEMS.HEART;
  const hasEnough = ownedHearts >= selectedAmount;
  const handleAction = async () => {
    if (!hasEnough) {
      onOpenStore();
      return;
    }
    setIsSending(true);
    try {
      await onGift(item2.id, selectedAmount);
      onClose();
    } catch (error) {
      console.error("Gift error:", error);
      toast.error("선물 발송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "absolute bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#1A1821]/95 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden relative", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6 relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-black italic tracking-tighter text-white uppercase leading-none", children: [
          "Send ",
          /* @__PURE__ */ jsx("span", { className: "text-primary", children: item2.name })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-white/40 font-black uppercase tracking-widest mt-1", children: [
          "보유 수량: ",
          /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
            ownedHearts,
            "개"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-white/20 hover:text-white transition-colors", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "close" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-6 relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-24 h-24 rounded-[30px] bg-[#2d1622] border border-white/5 flex items-center justify-center p-5 shadow-inner", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-primary text-5xl group-hover:scale-110 transition-transform duration-500", style: { fontVariationSettings: "'FILL' 1" }, children: item2.iconUrl }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-3 w-full", children: [1, 10, 50, 100].map((num) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSelectedAmount(num),
          className: cn(
            "py-3 rounded-[18px] text-[11px] font-black tracking-tighter transition-all border",
            selectedAmount === num ? "bg-primary border-primary text-black shadow-[0_0_20px_rgba(238,43,140,0.4)] scale-105" : "bg-white/3 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
          ),
          children: [
            "x",
            num
          ]
        },
        num
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "w-full space-y-4 pt-2", children: [
        !hasEnough && /* @__PURE__ */ jsx("p", { className: "text-center text-[10px] font-bold text-red-500/80 bg-red-500/5 py-2 rounded-xl border border-red-500/10", children: "보유한 하트가 부족합니다. 충전 후 선물해주세요." }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleAction,
            disabled: isSending,
            className: cn(
              "w-full h-15 rounded-[20px] font-black text-base shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95",
              hasEnough ? "bg-primary text-black shadow-primary/20 hover:shadow-primary/40" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            ),
            children: isSending ? /* @__PURE__ */ jsx(LoadingSpinner, { size: "sm" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[20px]", style: { fontVariationSettings: "'FILL' 1" }, children: hasEnough ? "send" : "add_circle" }),
              hasEnough ? "선물 보내기" : "하트 충전하러 가기"
            ] })
          }
        )
      ] })
    ] })
  ] }) });
}
function MessageInput({
  onSend,
  onGift,
  onOpenStore,
  userChocoBalance = 0,
  ownedHearts = 0,
  placeholder = "메시지를 입력하세요...",
  disabled = false,
  className
}) {
  const [message2, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const fileInputRef = useRef(null);
  const handleSend = () => {
    if ((message2.trim() || uploadedUrl) && !disabled && !isUploading && onSend) {
      onSend(message2.trim(), uploadedUrl || void 0);
      setMessage("");
      setPreviewUrl(null);
      setUploadedUrl(null);
    }
  };
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error("Upload failed");
      const data2 = await response.json();
      setUploadedUrl(data2.url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("이미지 업로드에 실패했습니다.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const removePreview = () => {
    setPreviewUrl(null);
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  return /* @__PURE__ */ jsxs(
    "footer",
    {
      className: cn(
        "flex-none bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-white/5 pb-8 pt-2 px-3 relative",
        className
      ),
      children: [
        onGift && /* @__PURE__ */ jsx(
          GiftSelector,
          {
            isOpen: isGiftOpen,
            onClose: () => setIsGiftOpen(false),
            onGift,
            onOpenStore: onOpenStore || (() => {
            }),
            ownedHearts
          }
        ),
        previewUrl && /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-24 h-24 rounded-lg overflow-hidden border-2 border-primary shadow-lg group", children: [
            /* @__PURE__ */ jsx("img", { src: previewUrl, alt: "Preview", className: "w-full h-full object-cover" }),
            isUploading && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: removePreview,
                className: "absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors",
                children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[16px]", children: "close" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: "이미지가 업로드되었습니다" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "file",
              ref: fileInputRef,
              onChange: handleFileChange,
              accept: "image/*",
              className: "hidden"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => fileInputRef.current?.click(),
                disabled: disabled || isUploading,
                className: "flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-primary transition-colors shrink-0 disabled:opacity-50",
                children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[28px]", children: "add_circle" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsGiftOpen(!isGiftOpen),
                disabled,
                className: cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all shrink-0 disabled:opacity-50",
                  isGiftOpen ? "text-primary scale-110" : "text-gray-400 hover:text-primary"
                ),
                children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[28px]", style: { fontVariationSettings: isGiftOpen ? "'FILL' 1" : "'FILL' 0" }, children: "favorite" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white dark:bg-surface-dark rounded-[24px] min-h-[40px] flex items-center px-4 py-1 border border-transparent focus-within:border-primary/50 transition-colors shadow-sm focus-within:shadow-md", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: message2,
                onChange: (e) => setMessage(e.target.value),
                onKeyPress: handleKeyPress,
                placeholder,
                disabled,
                className: "w-full bg-transparent border-none text-slate-800 dark:text-white placeholder-gray-400 focus:ring-0 focus:outline-none text-[15px] leading-normal p-0 font-display"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "text-gray-400 hover:text-yellow-500 transition-colors ml-2 flex items-center justify-center",
                children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "sentiment_satisfied" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleSend,
              disabled: !message2.trim() && !uploadedUrl || disabled || isUploading,
              className: "flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed",
              children: disabled || isUploading ? /* @__PURE__ */ jsx("span", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }) : /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[20px] ml-0.5", children: "send" })
            }
          )
        ] })
      ]
    }
  );
}
function TypingIndicator() {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-1 ml-1", children: [
    /* @__PURE__ */ jsx(
      "span",
      {
        className: "w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce",
        style: { animationDelay: "0ms" }
      }
    ),
    /* @__PURE__ */ jsx(
      "span",
      {
        className: "w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce",
        style: { animationDelay: "150ms" }
      }
    ),
    /* @__PURE__ */ jsx(
      "span",
      {
        className: "w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce",
        style: { animationDelay: "300ms" }
      }
    )
  ] });
}
function Skeleton({
  className,
  variant = "rectangular"
}) {
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-lg"
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "animate-pulse bg-gray-200 dark:bg-gray-700",
        variantClasses[variant],
        className
      )
    }
  );
}
function MessageListSkeleton() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(Skeleton, { className: "w-32 h-6 rounded-full" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-3", children: [
      /* @__PURE__ */ jsx(Skeleton, { variant: "circular", className: "w-10 h-10 shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 items-start max-w-[75%]", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "w-12 h-3 rounded" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "w-48 h-16 rounded-2xl rounded-tl-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-end gap-3 justify-end", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 items-end max-w-[75%]", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "w-40 h-14 rounded-2xl rounded-tr-sm" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "w-16 h-3 rounded" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-3", children: [
      /* @__PURE__ */ jsx(Skeleton, { variant: "circular", className: "w-10 h-10 shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 items-start max-w-[75%]", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "w-12 h-3 rounded" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "w-56 h-20 rounded-2xl rounded-tl-sm" })
      ] })
    ] })
  ] });
}
function ErrorMessage({
  title = "오류가 발생했습니다",
  message: message2,
  onRetry,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-red-500 text-3xl", children: "error" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-900 dark:text-white mb-2", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-gray-400 mb-6 max-w-sm", children: message2 }),
        onRetry && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onRetry,
            className: "px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors",
            children: "다시 시도"
          }
        )
      ]
    }
  );
}
function NetworkError({ onRetry, className }) {
  return /* @__PURE__ */ jsx(
    ErrorMessage,
    {
      title: "네트워크 오류",
      message: "인터넷 연결을 확인하고 다시 시도해주세요.",
      onRetry,
      className
    }
  );
}
function ItemStoreModal({
  open,
  onOpenChange,
  itemId = "heart",
  paypalClientId,
  tossClientKey
}) {
  const [selectedPackageId, setSelectedPackageId] = useState(
    HEART_PACKAGES[1].id
  );
  const [paymentMethod, setPaymentMethod] = useState("TOSS");
  const [isProcessing, setIsProcessing] = useState(false);
  const revalidator = useRevalidator();
  const packages = HEART_PACKAGES;
  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[1];
  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator) {
      const isKorean = window.navigator.language.startsWith("ko");
      setPaymentMethod(isKorean ? "TOSS" : "PAYPAL");
    }
  }, []);
  const handleTossPayment = async () => {
    if (!tossClientKey || isProcessing) {
      if (!tossClientKey) toast.error("결제 시스템 설정 오류");
      return;
    }
    setIsProcessing(true);
    try {
      const { loadTossPayments } = await import("@tosspayments/payment-sdk");
      const tossPayments = await loadTossPayments(tossClientKey);
      const orderId = `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      await tossPayments.requestPayment("카드", {
        amount: selectedPackage.priceKRW,
        orderId,
        orderName: `${selectedPackage.name} (${selectedPackage.quantity}개)`,
        successUrl: `${window.location.origin}/payment/toss/success?type=ITEM&itemId=${selectedPackage.itemId}&quantity=${selectedPackage.quantity}&packageId=${selectedPackage.id}&amount=${selectedPackage.priceKRW}`,
        failUrl: `${window.location.origin}/payment/toss/fail?from=store`,
        windowTarget: isMobile ? "self" : void 0
      });
    } catch (error) {
      console.error("Toss Payment Error:", error);
      toast.error("결제 준비 중 오류가 발생했습니다.");
      setIsProcessing(false);
    }
  };
  const handlePayPalApprove = async (data2, actions) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/payment/item/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data2.orderID,
          packageId: selectedPackageId
        })
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`${result.quantityAdded}개의 하트가 인벤토리에 추가되었습니다!`);
        onOpenChange(false);
        revalidator.revalidate();
      } else {
        toast.error(result.error || "결제 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("PayPal Capture Error:", error);
      toast.error("결제 승인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[500px] bg-[#1A1018] border-white/10 text-white p-0 gap-0 overflow-hidden shadow-[0_0_50px_rgba(238,43,140,0.2)] rounded-[32px]", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { className: "p-8 bg-gradient-to-b from-[#2d1622]/80 to-transparent backdrop-blur-xl border-b border-white/5 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[-50px] left-[-50px] w-32 h-32 bg-primary/20 rounded-full blur-[60px]" }),
      /* @__PURE__ */ jsxs(DialogTitle, { className: "text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-primary text-[32px] filled", children: "favorite" }),
        "Heart ",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "Store" })
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { className: "text-white/50 text-sm font-medium mt-1", children: "아이돌에게 보낼 소중한 마음을 충전하세요." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar", children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4", children: packages.map((pkg) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "relative flex items-center gap-5 p-5 rounded-[24px] border transition-all cursor-pointer group hover:scale-[1.02]",
            selectedPackageId === pkg.id ? "bg-primary/10 border-primary/50 shadow-[0_0_30px_rgba(238,43,140,0.2)]" : "bg-white/2 border-white/5 hover:border-white/20 hover:bg-white/5"
          ),
          onClick: () => setSelectedPackageId(pkg.id),
          children: [
            pkg.isPopular && /* @__PURE__ */ jsx("div", { className: "absolute -top-3 right-6 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(238,43,140,0.5)] z-10", children: "Best Choice" }),
            /* @__PURE__ */ jsxs("div", { className: "relative shrink-0 w-16 h-16 rounded-2xl bg-[#2d1622] flex items-center justify-center p-2 border border-white/5 overflow-hidden group-hover:border-primary/30 transition-colors", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" }),
              /* @__PURE__ */ jsx("img", { src: pkg.image, alt: pkg.name, className: "w-10 h-10 object-contain relative z-10 group-hover:scale-110 transition-transform duration-500" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("h4", { className: cn(
                "text-lg font-bold tracking-tight mb-0.5 transition-colors",
                selectedPackageId === pkg.id ? "text-primary" : "text-white"
              ), children: pkg.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-white/40 font-medium truncate", children: pkg.description }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 flex items-center gap-1.5", children: /* @__PURE__ */ jsxs(Badge, { className: "bg-primary/20 text-primary border-none text-[10px] px-2 py-0.5 font-black uppercase tracking-tighter", children: [
                pkg.quantity,
                " Hearts"
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1", children: "Price" }),
              /* @__PURE__ */ jsxs("div", { className: "text-lg font-black text-white italic tracking-tighter leading-none", children: [
                "₩",
                pkg.priceKRW.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-white/20 font-bold mt-1", children: [
                "$",
                pkg.priceUSD.toFixed(1)
              ] })
            ] })
          ]
        },
        pkg.id
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 p-1.5 bg-white/3 rounded-[20px] border border-white/5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setPaymentMethod("TOSS"),
              className: cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[14px] transition-all",
                paymentMethod === "TOSS" ? "bg-white text-black shadow-xl" : "text-white/30 hover:text-white"
              ),
              children: "Toss Pay"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setPaymentMethod("PAYPAL"),
              className: cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[14px] transition-all",
                paymentMethod === "PAYPAL" ? "bg-[#ffc439] text-[#003087] shadow-xl" : "text-white/30 hover:text-white"
              ),
              children: "PayPal"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white/2 rounded-[28px] p-2 border border-white/5 backdrop-blur-xl", children: paymentMethod === "TOSS" ? /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleTossPayment,
            disabled: isProcessing,
            className: cn(
              "w-full h-16 bg-primary hover:bg-primary-dark text-black rounded-[22px] font-black italic text-lg tracking-tighter transition-all shadow-[0_10px_30px_rgba(238,43,140,0.3)] hover:shadow-[0_15px_40px_rgba(238,43,140,0.5)] active:scale-95",
              isProcessing && "opacity-70 cursor-not-allowed"
            ),
            children: isProcessing ? /* @__PURE__ */ jsx("div", { className: "size-6 border-3 border-black/30 border-t-black rounded-full animate-spin" }) : "PURCHASE NOW"
          }
        ) : /* @__PURE__ */ jsx("div", { className: "p-2 bg-white rounded-[22px]", children: paypalClientId ? /* @__PURE__ */ jsx(PayPalScriptProvider, { options: {
          clientId: paypalClientId,
          currency: "USD",
          intent: "capture"
        }, children: /* @__PURE__ */ jsx(
          PayPalButtons,
          {
            style: {
              layout: "vertical",
              shape: "rect",
              borderRadius: 12,
              height: 55,
              color: "gold",
              label: "pay"
            },
            forceReRender: [selectedPackageId],
            createOrder: async () => {
              try {
                const response = await fetch("/api/payment/item/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ packageId: selectedPackageId })
                });
                const result = await response.json();
                if (result.orderId) return result.orderId;
                throw new Error(result.error || "Failed to create order");
              } catch (error) {
                console.error("PayPal Create Order Error:", error);
                toast.error("결제 주문 생성에 실패했습니다.");
                throw error;
              }
            },
            onApprove: handlePayPalApprove
          }
        ) }) : /* @__PURE__ */ jsx("div", { className: "text-center text-black/40 py-4 text-xs font-bold", children: "PayPal Unavailable" }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-6 bg-white/2 border-t border-white/5 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-white/20 font-bold uppercase tracking-widest", children: [
      "Your purchase supports the creators. ",
      /* @__PURE__ */ jsx("br", {}),
      "Secure transaction powered by global gateways."
    ] }) })
  ] }) });
}
const Badge = ({ children, className }) => /* @__PURE__ */ jsx("span", { className: cn("px-2 py-1 rounded inline-flex", className), children });
function AlertDialog({ ...props }) {
  return /* @__PURE__ */ jsx(AlertDialog$1.Root, { "data-slot": "alert-dialog", ...props });
}
function AlertDialogTrigger({ ...props }) {
  return /* @__PURE__ */ jsx(AlertDialog$1.Trigger, { "data-slot": "alert-dialog-trigger", ...props });
}
function AlertDialogPortal({ ...props }) {
  return /* @__PURE__ */ jsx(AlertDialog$1.Portal, { "data-slot": "alert-dialog-portal", ...props });
}
function AlertDialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Backdrop,
    {
      "data-slot": "alert-dialog-overlay",
      className: cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50",
        className
      ),
      ...props
    }
  );
}
function AlertDialogContent({
  className,
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
    /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
    /* @__PURE__ */ jsx(
      AlertDialog$1.Popup,
      {
        "data-slot": "alert-dialog-content",
        "data-size": size,
        className: cn(
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-background ring-foreground/10 gap-4 rounded-xl p-4 ring-1 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          className
        ),
        ...props
      }
    )
  ] });
}
function AlertDialogHeader({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-dialog-header",
      className: cn("grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]", className),
      ...props
    }
  );
}
function AlertDialogFooter({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-dialog-footer",
      className: cn(
        "bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function AlertDialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Title,
    {
      "data-slot": "alert-dialog-title",
      className: cn("text-sm font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2", className),
      ...props
    }
  );
}
function AlertDialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Description,
    {
      "data-slot": "alert-dialog-description",
      className: cn("text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3", className),
      ...props
    }
  );
}
function AlertDialogAction({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Button,
    {
      "data-slot": "alert-dialog-action",
      className: cn(className),
      ...props
    }
  );
}
function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AlertDialog$1.Close,
    {
      "data-slot": "alert-dialog-cancel",
      className: cn(className),
      render: /* @__PURE__ */ jsx(Button, { variant, size }),
      ...props
    }
  );
}
const EMOTION_MAP = {
  JOY: {
    color: "text-pink-400",
    text: "기분 좋음",
    aura: "ring-2 ring-pink-500/30 animate-aura-breathe",
    style: {
      "--aura-color": "rgba(236,72,153,0.6)"
    }
  },
  SHY: {
    color: "text-rose-400",
    text: "부끄러움",
    aura: "ring-2 ring-rose-500/40 animate-neon-flicker",
    style: {
      "--aura-color": "rgba(251,113,133,0.5)"
    }
  },
  EXCITED: {
    color: "text-orange-400",
    text: "신남!",
    aura: "ring-4 ring-orange-500/50 animate-intense-pulse",
    style: {
      "--aura-color": "rgba(251,146,60,0.8)"
    }
  },
  LOVING: {
    color: "text-red-500",
    text: "사랑해",
    aura: "ring-4 ring-red-600 animate-intense-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]",
    style: {
      "--aura-color": "rgba(220,38,38,0.9)"
    }
  },
  SAD: {
    color: "text-blue-400",
    text: "시무룩",
    aura: "ring-1 ring-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    style: {
      "--aura-color": "rgba(59,130,246,0.3)"
    }
  },
  THINKING: {
    color: "text-purple-400",
    text: "생각 중",
    aura: "ring-2 ring-purple-500/40 animate-aura-breathe",
    style: {
      "--aura-color": "rgba(168,85,247,0.5)"
    }
  }
};
const sendSchema = z.object({
  message: z.string().optional(),
  mediaUrl: z.string().url().optional().nullable()
});
async function loader$G({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  const {
    id
  } = params;
  if (!id) throw new Response("Not Found", {
    status: 404
  });
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, session2.user.id),
    with: {
      inventory: true
    }
  });
  if (!user$1?.nearAccountId) {
    throw redirect("/wallet-setup");
  }
  if (user$1.walletStatus && user$1.walletStatus !== "READY") {
    throw redirect("/home");
  }
  const [messages, conversation$1] = await Promise.all([db.query.message.findMany({
    where: eq(message.conversationId, id),
    orderBy: [asc(message.createdAt)]
  }), db.query.conversation.findFirst({
    where: eq(conversation.id, id),
    with: {
      character: {
        with: {
          media: {
            orderBy: [asc(characterMedia.sortOrder)]
          }
        }
      }
    }
  })]);
  if (!conversation$1) throw new Response("Conversation Not Found", {
    status: 404
  });
  const characterStat$1 = await db.query.characterStat.findFirst({
    where: eq(characterStat.characterId, conversation$1.characterId)
  });
  const userLikesInConv = await db.query.messageLike.findMany({
    where: and(eq(messageLike.userId, session2.user.id), inArray(messageLike.messageId, messages.map((m) => m.id)))
  });
  const likedMessageIds = new Set(userLikesInConv.map((like2) => like2.messageId));
  const messagesWithLikes = messages.map((msg) => ({
    ...msg,
    isLiked: likedMessageIds.has(msg.id)
  })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const tossClientKey = process.env.TOSS_CLIENT_KEY;
  return Response.json({
    messages: messagesWithLikes,
    user: user$1,
    conversation: conversation$1,
    characterStat: characterStat$1,
    paypalClientId,
    tossClientKey
  });
}
async function action$I({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return new Response("Unauthorized", {
    status: 401
  });
  const {
    id
  } = params;
  if (!id) return new Response("Missing ID", {
    status: 400
  });
  const formData = await request.formData();
  const result = sendSchema.safeParse({
    message: formData.get("message"),
    mediaUrl: formData.get("mediaUrl") || null
  });
  const clientId2 = formData.get("id");
  const clientCreatedAt = formData.get("createdAt");
  if (!result.success && !formData.get("mediaUrl")) {
    return Response.json({
      error: "Message or image is required"
    }, {
      status: 400
    });
  }
  const [userMsg] = await db.insert(message).values({
    id: clientId2 || crypto.randomUUID(),
    role: "user",
    content: result.data?.message || "",
    mediaUrl: result.data?.mediaUrl,
    conversationId: id,
    senderId: session2.user.id,
    createdAt: clientCreatedAt ? new Date(clientCreatedAt) : /* @__PURE__ */ new Date()
  }).returning();
  if (!userMsg) throw new Error("Failed to create user message Record");
  return Response.json({
    success: true,
    message: userMsg
  });
}
const $id$2 = UNSAFE_withComponentProps(function ChatRoom() {
  const {
    messages: initialMessages,
    user: user2,
    conversation: conversation2,
    characterStat: characterStat2,
    paypalClientId,
    tossClientKey
  } = useLoaderData();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const conversationId = conversation2?.id || useParams().id;
  const dbCharacter = conversation2?.character;
  const characterName = dbCharacter?.name || "AI";
  const avatarUrl = dbCharacter?.media?.find((m) => m.type === "AVATAR")?.url || dbCharacter?.media?.[0]?.url;
  const [messages, setMessages] = useState(initialMessages);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingMediaUrl, setStreamingMediaUrl] = useState(null);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [isItemStoreOpen, setIsItemStoreOpen] = useState(false);
  const [loadingState, setLoadingState] = useState("idle");
  const [currentEmotion, setCurrentEmotion] = useState(characterStat2?.currentEmotion || "JOY");
  const [emotionExpiresAt, setEmotionExpiresAt] = useState(characterStat2?.emotionExpiresAt || null);
  const [auraOpacity, setAuraOpacity] = useState(1);
  const [isOptimisticTyping, setIsOptimisticTyping] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const abortControllerRef = useRef(null);
  const [currentUserHearts, setCurrentUserHearts] = useState(user2?.inventory?.find((i) => i.itemId === "heart")?.quantity || 0);
  const [currentUserChocoBalance, setCurrentUserChocoBalance] = useState(user2?.chocoBalance ? parseFloat(user2.chocoBalance) : 0);
  const [chocoChange, setChocoChange] = useState(void 0);
  const [lastOptimisticDeduction, setLastOptimisticDeduction] = useState(0);
  const lastOptimisticDeductionRef = useRef(0);
  const optimisticIntervalRef = useRef(null);
  useEffect(() => {
    lastOptimisticDeductionRef.current = lastOptimisticDeduction;
  }, [lastOptimisticDeduction]);
  useEffect(() => {
    setCurrentUserHearts(user2?.inventory?.find((i) => i.itemId === "heart")?.quantity || 0);
    if (!isAiStreaming && lastOptimisticDeduction === 0 && revalidator.state === "idle") {
      if (user2?.chocoBalance !== void 0) {
        setCurrentUserChocoBalance(parseFloat(user2.chocoBalance));
      }
      setChocoChange(void 0);
    }
  }, [user2, isAiStreaming, lastOptimisticDeduction, revalidator.state]);
  const scrollRef = useRef(null);
  useEffect(() => {
    if (characterStat2) {
      setCurrentEmotion(characterStat2.currentEmotion || "JOY");
      setEmotionExpiresAt(characterStat2.emotionExpiresAt || null);
    }
  }, [characterStat2]);
  useEffect(() => {
    setIsInitialLoad(true);
  }, [conversationId]);
  useEffect(() => {
    if (!emotionExpiresAt || currentEmotion === "JOY") return;
    const checkExpiry = () => {
      const now = (/* @__PURE__ */ new Date()).getTime();
      const expiry = new Date(emotionExpiresAt).getTime();
      if (now >= expiry) {
        setCurrentEmotion("JOY");
        setEmotionExpiresAt(null);
        setAuraOpacity(1);
      } else {
        const diff = (expiry - now) / 1e3;
        if (diff <= 10) {
          setAuraOpacity(diff / 10);
        } else {
          setAuraOpacity(1);
        }
      }
    };
    const timer = setInterval(checkExpiry, 1e3);
    return () => clearInterval(timer);
  }, [emotionExpiresAt, currentEmotion]);
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    const handleScroll = () => {
      const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 200;
      if (isInitialLoad && messages.length > 0) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          setIsInitialLoad(false);
        }, 100);
      } else if (isAtBottom || isOptimisticTyping) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    };
    handleScroll();
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(scrollContainer);
    return () => resizeObserver.disconnect();
  }, [messages, streamingContent, isOptimisticTyping, isInitialLoad]);
  useEffect(() => {
    setMessages((prev) => {
      const incomingIds = new Set(initialMessages.map((m) => m.id));
      const optimisticMessages = prev.filter((m) => m.role === "user" && !incomingIds.has(m.id));
      const merged = [...initialMessages, ...optimisticMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return merged;
    });
    setIsOptimisticTyping(false);
  }, [initialMessages]);
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const saveInterruptedMessage = async (content, mediaUrl) => {
    try {
      await fetch("/api/chat/interrupt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId,
          content,
          mediaUrl
        })
      });
    } catch (e) {
      console.error("Failed to save interrupted message:", e);
    }
  };
  const handleSend = async (content, mediaUrl) => {
    if (isAiStreaming) {
      setIsInterrupting(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (optimisticIntervalRef.current) {
        clearInterval(optimisticIntervalRef.current);
        optimisticIntervalRef.current = null;
      }
      if (streamingContent.trim()) {
        const interruptedContent = streamingContent.endsWith("...") ? streamingContent : streamingContent + "...";
        const userMsgId2 = crypto.randomUUID();
        const interruptedMsg = {
          id: userMsgId2,
          role: "assistant",
          content: interruptedContent,
          mediaUrl: streamingMediaUrl || null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          isLiked: false
        };
        setMessages((prev) => [...prev, interruptedMsg]);
        await saveInterruptedMessage(streamingContent, streamingMediaUrl);
      }
      setStreamingContent("");
      setStreamingMediaUrl(null);
      setIsAiStreaming(false);
      setIsInterrupting(false);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const totalEstimatedCost = 5;
    if (optimisticIntervalRef.current) {
      clearInterval(optimisticIntervalRef.current);
    }
    let currentDeducted = 0;
    setLastOptimisticDeduction(1e-3);
    optimisticIntervalRef.current = setInterval(() => {
      if (currentDeducted < totalEstimatedCost) {
        currentDeducted += 1;
        lastOptimisticDeductionRef.current = currentDeducted;
        setLastOptimisticDeduction(currentDeducted);
        setCurrentUserChocoBalance((prev) => Math.max(0, prev - 1));
      } else {
        if (optimisticIntervalRef.current) {
          clearInterval(optimisticIntervalRef.current);
          optimisticIntervalRef.current = null;
        }
      }
    }, 1e3);
    const userMsgId = crypto.randomUUID();
    const newUserMsg = {
      id: userMsgId,
      role: "user",
      content,
      mediaUrl: mediaUrl || null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isLiked: false
    };
    setMessages((prev) => [...prev, newUserMsg]);
    fetcher.submit({
      id: userMsgId,
      message: content,
      mediaUrl: mediaUrl || "",
      createdAt: newUserMsg.createdAt
    }, {
      method: "post"
    });
    setIsOptimisticTyping(true);
    startAiStreaming(content, mediaUrl);
  };
  const startAiStreaming = async (userMessage, mediaUrl, giftContext) => {
    setIsAiStreaming(true);
    setStreamingContent("");
    setStreamingMediaUrl(null);
    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (optimisticIntervalRef.current) {
        clearInterval(optimisticIntervalRef.current);
        optimisticIntervalRef.current = null;
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          mediaUrl,
          characterId: dbCharacter?.id,
          giftContext
        })
      });
      if (!response.ok) throw new Error("AI 응답 요청 실패");
      setIsOptimisticTyping(false);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullAiContent = "";
      let currentMessageContent = "";
      if (reader) {
        while (true) {
          const {
            done,
            value
          } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, {
            stream: true
          });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data2 = JSON.parse(line.slice(6));
                if (data2.emotion) {
                  setCurrentEmotion(data2.emotion);
                }
                if (data2.expiresAt) {
                  setEmotionExpiresAt(data2.expiresAt);
                }
                if (data2.text) {
                  fullAiContent += data2.text;
                  currentMessageContent += data2.text;
                  setStreamingContent((prev) => prev + data2.text);
                }
                if (data2.messageComplete) {
                  const completedMessage = {
                    id: data2.messageId || crypto.randomUUID(),
                    role: "assistant",
                    content: currentMessageContent,
                    // 추적 중인 내용 사용
                    mediaUrl: data2.mediaUrl || null,
                    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                    isLiked: false
                  };
                  setMessages((prev) => [...prev, completedMessage]);
                  setStreamingContent("");
                  setStreamingMediaUrl(null);
                  currentMessageContent = "";
                }
                if (data2.mediaUrl && !data2.messageComplete) {
                  setStreamingMediaUrl(data2.mediaUrl);
                }
                if (data2.done) {
                  setIsAiStreaming(false);
                  if (optimisticIntervalRef.current) {
                    clearInterval(optimisticIntervalRef.current);
                    optimisticIntervalRef.current = null;
                  }
                  if (data2.usage && data2.usage.totalTokens) {
                    const actualCost = Math.ceil(data2.usage.totalTokens / 100);
                    const adjustment = lastOptimisticDeductionRef.current - actualCost;
                    setCurrentUserChocoBalance((prev) => Math.max(0, prev + adjustment));
                    setChocoChange(-actualCost);
                    setTimeout(() => {
                      setChocoChange(void 0);
                    }, 2e3);
                    setLastOptimisticDeduction(0);
                    revalidator.revalidate();
                  } else {
                    setTimeout(() => {
                      setChocoChange(void 0);
                      setLastOptimisticDeduction(0);
                      revalidator.revalidate();
                    }, 2e3);
                  }
                }
              } catch (e) {
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Stream aborted locally");
        return;
      }
      console.error("Streaming error:", err);
      toast.error("답변을 가져오는 중 오류가 발생했습니다.");
      setIsAiStreaming(false);
      setIsOptimisticTyping(false);
      if (optimisticIntervalRef.current) {
        clearInterval(optimisticIntervalRef.current);
        optimisticIntervalRef.current = null;
      }
      if (lastOptimisticDeductionRef.current > 0) {
        setCurrentUserChocoBalance((prev) => prev + lastOptimisticDeductionRef.current);
        const rolledBackAmount = lastOptimisticDeductionRef.current;
        setLastOptimisticDeduction(0);
        setChocoChange(rolledBackAmount);
        setTimeout(() => {
          setChocoChange(void 0);
        }, 2e3);
      }
      if (streamingContent && !isInterrupting) {
        const partialMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: streamingContent + "...",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        setMessages((prev) => [...prev, partialMsg]);
        setStreamingContent("");
      }
    }
  };
  const handleGift = async (itemId, amount) => {
    try {
      const response = await fetch("/api/items/gift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          characterId: dbCharacter?.id,
          itemId,
          amount,
          conversationId
        })
      });
      const data2 = await response.json();
      if (!response.ok) {
        throw new Error(data2.error || "Gifting failed");
      }
      toast.success(`${amount}개의 하트를 보냈습니다! 💖`);
      if (data2.systemMsg) {
        setMessages((prev) => [...prev, {
          id: data2.systemMsg.id,
          role: "assistant",
          // 시스템 메시지 역할을 수행
          content: data2.systemMsg.content,
          createdAt: data2.systemMsg.createdAt
        }]);
      }
      startAiStreaming("", void 0, {
        amount,
        itemId
      });
      if (currentUserHearts >= amount) {
        setCurrentUserHearts((prev) => prev - amount);
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };
  const handleBack = () => navigate(-1);
  const handleDeleteConversation = async (resetMemory = false) => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/chat/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId,
          resetMemory
        })
      });
      if (response.ok) {
        toast.success(resetMemory ? "대화가 초기화되었습니다." : "대화방이 삭제되었습니다.");
        if (resetMemory) {
          setMessages([]);
          setIsResetDialogOpen(false);
        } else {
          setIsDeleteDialogOpen(false);
          navigate("/chats");
        }
      } else {
        throw new Error("삭제 실패");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleRetry = () => {
    setLoadingState("loading");
    setTimeout(() => setLoadingState("idle"), 1e3);
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white h-screen flex flex-col overflow-hidden max-w-md mx-auto md:max-w-2xl lg:max-w-3xl",
    children: [/* @__PURE__ */ jsx(ChatHeader, {
      characterName,
      characterId: dbCharacter?.id,
      isOnline: true,
      statusText: EMOTION_MAP[currentEmotion]?.text || "Active Now",
      statusClassName: EMOTION_MAP[currentEmotion]?.color,
      statusOpacity: auraOpacity,
      onBack: handleBack,
      onDeleteChat: () => setIsDeleteDialogOpen(true),
      onResetChat: () => setIsResetDialogOpen(true),
      chocoBalance: Math.floor(currentUserChocoBalance).toString(),
      chocoChange,
      isOptimisticDeducting: lastOptimisticDeduction > 0
    }), /* @__PURE__ */ jsx("main", {
      ref: scrollRef,
      className: "flex-1 overflow-y-auto px-4 py-6 space-y-4 relative no-scrollbar",
      style: {
        scrollBehavior: "auto",
        background: "radial-gradient(circle at 50% 50%, rgba(238, 43, 140, 0.05) 0%, transparent 100%)"
      },
      children: loadingState === "loading" ? /* @__PURE__ */ jsx(MessageListSkeleton, {}) : loadingState === "network-error" ? /* @__PURE__ */ jsx(NetworkError, {
        onRetry: handleRetry
      }) : /* @__PURE__ */ jsxs(Fragment, {
        children: [messages.length === 0 && !isAiStreaming && !isOptimisticTyping && /* @__PURE__ */ jsx("div", {
          className: "flex flex-col items-center justify-center py-20 px-4 text-center",
          children: /* @__PURE__ */ jsx("p", {
            className: "text-sm text-slate-500",
            children: "대화가 없습니다. 먼저 인사를 건네보세요!"
          })
        }), messages.map((msg) => /* @__PURE__ */ jsx(MessageBubble, {
          messageId: msg.id,
          sender: msg.role === "user" ? "user" : "ai",
          senderName: msg.role === "user" ? user2?.name : characterName,
          content: msg.content,
          mediaUrl: msg.mediaUrl || void 0,
          avatarUrl: msg.role === "assistant" ? avatarUrl : void 0,
          auraClass: msg.role === "assistant" ? EMOTION_MAP[currentEmotion]?.aura : void 0,
          auraOpacity: msg.role === "assistant" ? auraOpacity : 1,
          auraStyle: msg.role === "assistant" ? EMOTION_MAP[currentEmotion]?.style : void 0,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }),
          isLiked: msg.isLiked || false,
          onLike: async (messageId, liked) => {
            try {
              const response = await fetch(`/api/messages/${messageId}/like`, {
                method: liked ? "DELETE" : "POST",
                headers: {
                  "Content-Type": "application/json"
                }
              });
              if (response.ok) {
                setMessages((prev) => prev.map((m) => m.id === messageId ? {
                  ...m,
                  isLiked: !liked
                } : m));
              }
            } catch (error) {
              console.error("Like error:", error);
            }
          }
        }, msg.id)), (isAiStreaming || isOptimisticTyping) && /* @__PURE__ */ jsx(Fragment, {
          children: streamingContent ? /* @__PURE__ */ jsx(MessageBubble, {
            sender: "ai",
            senderName: characterName,
            content: streamingContent,
            mediaUrl: streamingMediaUrl || void 0,
            avatarUrl,
            auraClass: EMOTION_MAP[currentEmotion]?.aura,
            auraOpacity,
            auraStyle: EMOTION_MAP[currentEmotion]?.style,
            timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            }),
            isStreaming: true
          }) : /* @__PURE__ */ jsx("div", {
            className: "flex justify-start ml-14 -mt-2",
            children: /* @__PURE__ */ jsx(TypingIndicator, {})
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "h-4"
        })]
      })
    }), /* @__PURE__ */ jsx(MessageInput, {
      onSend: handleSend,
      onGift: handleGift,
      onOpenStore: () => setIsItemStoreOpen(true),
      userChocoBalance: currentUserChocoBalance,
      ownedHearts: currentUserHearts,
      disabled: isOptimisticTyping || isInterrupting
    }), /* @__PURE__ */ jsx(ItemStoreModal, {
      open: isItemStoreOpen,
      onOpenChange: setIsItemStoreOpen,
      itemId: "heart",
      paypalClientId,
      tossClientKey
    }), /* @__PURE__ */ jsx(AlertDialog, {
      open: isDeleteDialogOpen,
      onOpenChange: setIsDeleteDialogOpen,
      children: /* @__PURE__ */ jsxs(AlertDialogContent, {
        children: [/* @__PURE__ */ jsxs(AlertDialogHeader, {
          children: [/* @__PURE__ */ jsx(AlertDialogTitle, {
            children: "대화방 삭제"
          }), /* @__PURE__ */ jsx(AlertDialogDescription, {
            children: "이 대화방을 정말 삭제할까요? 대화 중 보낸 사진들도 모두 삭제되며, 이 작업은 되돌릴 수 없습니다."
          })]
        }), /* @__PURE__ */ jsxs(AlertDialogFooter, {
          children: [/* @__PURE__ */ jsx(AlertDialogCancel, {
            children: "취소"
          }), /* @__PURE__ */ jsx(AlertDialogAction, {
            onClick: () => handleDeleteConversation(false),
            disabled: isDeleting,
            className: "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed",
            children: isDeleting ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx(LoadingSpinner, {
                size: "sm",
                className: "mr-2"
              }), "삭제 중..."]
            }) : "삭제하기"
          })]
        })]
      })
    }), /* @__PURE__ */ jsx(AlertDialog, {
      open: isResetDialogOpen,
      onOpenChange: setIsResetDialogOpen,
      children: /* @__PURE__ */ jsxs(AlertDialogContent, {
        children: [/* @__PURE__ */ jsxs(AlertDialogHeader, {
          children: [/* @__PURE__ */ jsx(AlertDialogTitle, {
            children: "대화 초기화"
          }), /* @__PURE__ */ jsxs(AlertDialogDescription, {
            children: [characterName, "와의 모든 대화와 기억을 초기화할까요? 대화 중 보낸 사진들도 모두 삭제되며, ", characterName, "가 당신을 처음 만난 것처럼 행동하게 됩니다."]
          })]
        }), /* @__PURE__ */ jsxs(AlertDialogFooter, {
          children: [/* @__PURE__ */ jsx(AlertDialogCancel, {
            children: "취소"
          }), /* @__PURE__ */ jsx(AlertDialogAction, {
            onClick: () => handleDeleteConversation(true),
            disabled: isDeleting,
            className: "disabled:opacity-50 disabled:cursor-not-allowed",
            children: isDeleting ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx(LoadingSpinner, {
                size: "sm",
                className: "mr-2"
              }), "초기화 중..."]
            }) : "초기화하기"
          })]
        })]
      })
    })]
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$I,
  default: $id$2,
  loader: loader$G
}, Symbol.toStringTag, { value: "Module" }));
function ChatListItem({
  id,
  name,
  lastMessage,
  timestamp,
  avatarUrl,
  unreadCount,
  isRead = false,
  isOnline = false,
  messageType = "text",
  characterId,
  className
}) {
  const navigate = useNavigate();
  const iconSettings = messageType === "voice" ? { icon: "mic", colors: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300" } : messageType === "music" ? { icon: "music_note", colors: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300" } : null;
  const profileLink = characterId ? `/character/${characterId}` : null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "group relative flex items-center gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-sm dark:hover:bg-surface-dark dark:hover:shadow-none transition-all mb-1",
        className
      ),
      children: [
        profileLink ? /* @__PURE__ */ jsxs(
          Link,
          {
            to: profileLink,
            className: "relative shrink-0",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: cn(
                    "w-14 h-14 rounded-xl bg-cover bg-center",
                    isRead && "grayscale-[20%]"
                  ),
                  style: { backgroundImage: `url("${avatarUrl}")` }
                }
              ),
              iconSettings && /* @__PURE__ */ jsx("div", { className: "absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark p-[2px] rounded-full", children: /* @__PURE__ */ jsx(
                "span",
                {
                  className: cn(
                    "material-symbols-outlined text-sm rounded-full p-0.5",
                    iconSettings.colors
                  ),
                  style: { fontSize: "14px" },
                  children: iconSettings.icon
                }
              ) })
            ]
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "w-14 h-14 rounded-xl bg-cover bg-center",
                isRead && "grayscale-[20%]"
              ),
              style: { backgroundImage: `url("${avatarUrl}")` }
            }
          ),
          iconSettings && /* @__PURE__ */ jsx("div", { className: "absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark p-[2px] rounded-full", children: /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "material-symbols-outlined text-sm rounded-full p-0.5",
                iconSettings.colors
              ),
              style: { fontSize: "14px" },
              children: iconSettings.icon
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: `/chat/${id}`,
            className: "flex-1 min-w-0 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-baseline mb-0.5", children: [
                profileLink ? /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(profileLink);
                    },
                    className: cn(
                      "text-base font-bold truncate block hover:underline text-left bg-transparent border-none p-0 cursor-pointer",
                      isRead ? "text-slate-700 dark:text-gray-200" : "text-slate-900 dark:text-white"
                    ),
                    children: name
                  }
                ) : /* @__PURE__ */ jsx(
                  "h3",
                  {
                    className: cn(
                      "text-base font-bold truncate",
                      isRead ? "text-slate-700 dark:text-gray-200" : "text-slate-900 dark:text-white"
                    ),
                    children: name
                  }
                ),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: cn(
                      "text-xs font-medium",
                      isRead ? "text-gray-400 dark:text-gray-500" : unreadCount ? "text-primary" : "text-gray-500 dark:text-text-muted"
                    ),
                    children: timestamp
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                "p",
                {
                  className: cn(
                    "text-sm truncate",
                    isRead ? "text-slate-400 dark:text-gray-500" : "text-slate-600 dark:text-gray-300 font-medium"
                  ),
                  children: lastMessage
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "shrink-0 flex flex-col items-end gap-1", children: unreadCount && unreadCount > 0 ? /* @__PURE__ */ jsx("div", { className: "w-5 h-5 bg-primary rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-white", children: unreadCount }) }) : isRead ? /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-base text-gray-400 dark:text-gray-600", children: "done_all" }) : null })
      ]
    }
  );
}
function OnlineIdolList({
  idols,
  onIdolClick,
  onAddClick,
  className
}) {
  return /* @__PURE__ */ jsxs("section", { className: cn("pt-6 pb-2", className), children: [
    /* @__PURE__ */ jsx("div", { className: "px-4 mb-3 flex items-center justify-between", children: /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-text-muted", children: "Online Now" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex overflow-x-auto no-scrollbar px-4 gap-4 pb-4 snap-x", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: onAddClick,
          className: "flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-[72px] h-[72px] rounded-full border-2 border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-3xl text-primary", children: "add" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-center w-16 truncate opacity-60", children: "Add" })
          ]
        }
      ),
      idols.map((idol) => /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => onIdolClick?.(idol.id),
          className: "flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group",
          children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "relative p-[3px] rounded-full transition-all duration-300",
                  idol.isOnline ? "bg-gradient-to-tr from-primary to-purple-400 group-hover:scale-105" : "border-2 border-gray-200 dark:border-white/10 group-hover:border-primary/50"
                ),
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-[66px] h-[66px] rounded-full bg-background-light dark:bg-background-dark p-[2px]", children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: cn(
                        "w-full h-full rounded-full bg-cover bg-center",
                        !idol.isOnline && "grayscale-[30%]"
                      ),
                      style: { backgroundImage: `url("${idol.avatarUrl}")` }
                    }
                  ) }),
                  idol.isOnline && /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-background-dark rounded-full" })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "text-xs font-medium text-center w-16 truncate",
                  !idol.isOnline && "text-gray-500 dark:text-text-muted"
                ),
                children: idol.name
              }
            )
          ]
        },
        idol.id
      ))
    ] })
  ] });
}
function ChatListSkeleton() {
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col px-2", children: Array.from({ length: 5 }).map((_, index2) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex items-center gap-4 p-3 rounded-2xl mb-1",
      children: [
        /* @__PURE__ */ jsx(Skeleton, { variant: "circular", className: "w-14 h-14 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-baseline mb-2", children: [
            /* @__PURE__ */ jsx(Skeleton, { className: "w-20 h-4 rounded" }),
            /* @__PURE__ */ jsx(Skeleton, { className: "w-12 h-3 rounded" })
          ] }),
          /* @__PURE__ */ jsx(Skeleton, { className: "w-full h-4 rounded" })
        ] }),
        /* @__PURE__ */ jsx(Skeleton, { variant: "circular", className: "w-5 h-5 shrink-0" })
      ]
    },
    index2
  )) });
}
function ApiError({
  message: message2 = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
  className
}) {
  return /* @__PURE__ */ jsx(
    ErrorMessage,
    {
      title: "서버 오류",
      message: message2,
      onRetry,
      className
    }
  );
}
async function loader$F({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  const [conversations, allCharacters] = await Promise.all([db.query.conversation.findMany({
    where: eq(conversation.userId, session2.user.id),
    with: {
      messages: {
        orderBy: [desc(message.createdAt)],
        limit: 1
      },
      character: {
        with: {
          media: {
            orderBy: [asc(characterMedia.sortOrder)]
          }
        }
      }
    },
    orderBy: [desc(conversation.updatedAt)]
  }), db.query.character.findMany({
    with: {
      media: {
        orderBy: [asc(characterMedia.sortOrder)]
      }
    }
  })]);
  return Response.json({
    conversations,
    allCharacters
  });
}
const index$9 = UNSAFE_withComponentProps(function ChatListScreen() {
  const {
    conversations,
    allCharacters
  } = useLoaderData();
  const [loadingState, setLoadingState] = useState("idle");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const navigate = useNavigate();
  const handleIdolClick = (characterId) => {
    navigate(`/character/${characterId}`);
  };
  const handleStartChat = async (characterId) => {
    try {
      setLoadingState("loading");
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          characterId
        })
      });
      if (!response.ok) throw new Error("Failed to create chat");
      const data2 = await response.json();
      navigate(`/chat/${data2.conversationId}`);
    } catch (error) {
      console.error("Chat creation error:", error);
      setLoadingState("error");
      setTimeout(() => setLoadingState("idle"), 2e3);
    }
  };
  const onlineIdols = allCharacters.map((char) => ({
    id: char.id,
    name: char.name,
    avatarUrl: char.media?.find((m) => m.type === "AVATAR")?.url || char.media?.[0]?.url,
    isOnline: char.isOnline
  }));
  const handleRetry = () => {
    setLoadingState("loading");
    setTimeout(() => {
      setLoadingState("idle");
    }, 1e3);
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white pb-24 max-w-md mx-auto md:max-w-lg lg:max-w-xl",
    children: [/* @__PURE__ */ jsxs("header", {
      className: "sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 pt-12 pb-3 flex items-center justify-between transition-colors duration-300",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex items-center gap-3",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "relative",
          children: [/* @__PURE__ */ jsx("div", {
            className: "w-10 h-10 rounded-full bg-cover bg-center ring-2 ring-gray-200 dark:ring-white/10",
            style: {
              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVl0hrpoB1yOAKpQmi-_0n7ICqjGaew6qKzz_Gn8CbqiQL1TBgAMDihfIzH7NO8Kir1bL6J_gs-qj0PzAlVN-0TM1Py8H0_3TOtix5p0aql-mvaSLfSbA290FDgIwdBcPIYdPe53zzyV5MDn_BXBDETX3SZX_aoWMl3hh_NIS59fdAciuwSHR-AoKLwEeh2jIaNjLb0MTt70Uv5AzH3-4cfSZ7zkxkEY0Pj82wFASAxuhtYWy-IwB4kj9mN8N7xCmOj_sTq6L2f30")'
            }
          }), /* @__PURE__ */ jsx("div", {
            className: "absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark"
          })]
        }), /* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold tracking-tight",
          children: "Messages"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex gap-2",
        children: [/* @__PURE__ */ jsx(Link, {
          to: "/search",
          className: "w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-2xl text-gray-600 dark:text-text-muted",
            children: "search"
          })
        }), /* @__PURE__ */ jsx(Link, {
          to: "/settings",
          className: "w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-2xl text-gray-600 dark:text-text-muted",
            children: "settings"
          })
        })]
      })]
    }), /* @__PURE__ */ jsx(OnlineIdolList, {
      idols: onlineIdols,
      onIdolClick: handleIdolClick,
      onAddClick: () => setIsNewChatOpen(true)
    }), /* @__PURE__ */ jsxs("main", {
      className: "mt-2 flex flex-col px-2",
      children: [/* @__PURE__ */ jsx("div", {
        className: "px-4 py-2",
        children: /* @__PURE__ */ jsx("h2", {
          className: "text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-text-muted",
          children: "Recent Chats"
        })
      }), loadingState === "loading" ? /* @__PURE__ */ jsx(ChatListSkeleton, {}) : loadingState === "network-error" ? /* @__PURE__ */ jsx(NetworkError, {
        onRetry: handleRetry
      }) : loadingState === "error" ? /* @__PURE__ */ jsx(ApiError, {
        onRetry: handleRetry
      }) : conversations.length === 0 ? /* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-center justify-center py-20 px-4 text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-primary text-3xl",
            children: "chat_bubble"
          })
        }), /* @__PURE__ */ jsx("h3", {
          className: "text-lg font-bold mb-1",
          children: "새로운 대화를 시작해보세요!"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-sm text-slate-500",
          children: "춘심이가 당신의 연락을 기다리고 있어요."
        })]
      }) : conversations.map((chat) => {
        const lastMsg = chat.messages?.[0];
        const character2 = chat.character;
        const avatarUrl = character2?.media?.find((m) => m.type === "AVATAR")?.url || character2?.media?.[0]?.url;
        return /* @__PURE__ */ jsx(ChatListItem, {
          id: chat.id,
          name: character2?.name || "AI",
          lastMessage: lastMsg?.content || "대화를 시작해보세요",
          timestamp: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }) : "",
          avatarUrl,
          isRead: lastMsg ? lastMsg.read : true,
          isOnline: character2?.isOnline || false,
          characterId: character2?.id
        }, chat.id);
      })]
    }), /* @__PURE__ */ jsxs(Dialog, {
      open: isNewChatOpen,
      onOpenChange: setIsNewChatOpen,
      children: [/* @__PURE__ */ jsx(DialogTrigger, {
        render: /* @__PURE__ */ jsx("button", {
          className: "fixed bottom-24 right-4 z-30 w-14 h-14 bg-slate-900 dark:bg-primary text-white rounded-full shadow-lg dark:shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-2xl",
            children: "add_comment"
          })
        })
      }), /* @__PURE__ */ jsxs(DialogContent, {
        className: "max-w-sm max-h-[80vh] overflow-y-auto",
        children: [/* @__PURE__ */ jsx(DialogHeader, {
          children: /* @__PURE__ */ jsx(DialogTitle, {
            children: "새 대화 시작하기"
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "grid gap-4 py-4",
          children: allCharacters.map((char) => /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              handleStartChat(char.id);
              setIsNewChatOpen(false);
            },
            className: "flex items-center gap-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "relative flex-none",
              children: [/* @__PURE__ */ jsx("img", {
                src: char.media?.find((m) => m.type === "AVATAR")?.url || char.media?.[0]?.url,
                alt: char.name,
                className: "w-12 h-12 rounded-full object-cover"
              }), char.isOnline && /* @__PURE__ */ jsx("div", {
                className: "absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex-1 min-w-0",
              children: [/* @__PURE__ */ jsx("h4", {
                className: "font-bold text-slate-900 dark:text-white truncate",
                children: char.name
              }), /* @__PURE__ */ jsx("p", {
                className: "text-xs text-slate-500 line-clamp-1",
                children: char.role
              })]
            })]
          }, char.id))
        })]
      })]
    }), /* @__PURE__ */ jsx(BottomNavigation, {}), /* @__PURE__ */ jsx("div", {
      className: "pointer-events-none fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent z-10"
    })]
  });
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$9,
  loader: loader$F
}, Symbol.toStringTag, { value: "Module" }));
async function loader$E({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  const url = new URL(request.url);
  const characterId = url.searchParams.get("characterId") || "chunsim";
  const allCharacters = await db.query.character.findMany({
    with: {
      media: {
        orderBy: [asc(characterMedia.sortOrder)]
      }
    }
  });
  const selectedCharacter = allCharacters.find((c) => c.id === characterId) || allCharacters[0];
  const characterStat$1 = await db.query.characterStat.findFirst({
    where: eq(characterStat.characterId, selectedCharacter.id)
  });
  const notices = await db.query.notice.findMany({
    where: eq(notice.isActive, true),
    orderBy: [desc(notice.createdAt)],
    limit: 5
  });
  const allMissions = await db.query.mission.findMany({
    where: eq(mission.isActive, true),
    limit: 3
  });
  const userMissions = await db.query.userMission.findMany({
    where: eq(userMission.userId, session2.user.id)
  });
  const missions2 = allMissions.map((m) => {
    const um = userMissions.find((u) => u.missionId === m.id);
    return {
      ...m,
      progress: um?.progress || 0,
      completed: um?.status === "COMPLETED" || um?.status === "CLAIMED"
    };
  });
  const feedPosts = await db.query.fanPost.findMany({
    where: eq(fanPost.isApproved, true),
    with: {
      user: {
        columns: {
          name: true,
          image: true,
          avatarUrl: true
        }
      }
    },
    orderBy: [desc(fanPost.createdAt)],
    limit: 20
  });
  const topGivers = await db.select({
    userId: giftLog.fromUserId,
    totalHearts: sql`sum(${giftLog.amount})`
  }).from(giftLog).where(eq(giftLog.itemId, "heart")).groupBy(giftLog.fromUserId).orderBy(desc(sql`sum(${giftLog.amount})`)).limit(5);
  const userIds = topGivers.map((t) => t.userId);
  let users = [];
  if (userIds.length > 0) {
    users = await db.query.user.findMany({
      where: inArray(user.id, userIds),
      columns: {
        id: true,
        name: true,
        avatarUrl: true,
        image: true
      }
    });
  }
  const leaderboard = topGivers.map((giver, i) => {
    const user2 = users.find((u) => u.id === giver.userId);
    return {
      rank: i + 1,
      name: user2?.name || "Anonymous",
      points: giver.totalHearts,
      // 실제 하트 수
      avatar: user2?.avatarUrl || user2?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + giver.userId
    };
  });
  return Response.json({
    user: session2.user,
    allCharacters,
    selectedCharacter,
    characterStat: characterStat$1,
    missions: missions2,
    notices,
    leaderboard,
    feedPosts,
    characterId
  });
}
async function action$H({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "createPost") {
    const content = formData.get("content");
    if (!content || content.length < 5) {
      return Response.json({
        error: "Content too short"
      }, {
        status: 400
      });
    }
    const [post] = await db.insert(fanPost).values({
      id: crypto.randomUUID(),
      userId: session2.user.id,
      content,
      isApproved: true,
      // 초기엔 자동 승인
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    const shareMission = await db.query.mission.findFirst({
      where: and(like$1(mission.title, "%post%"), eq(mission.isActive, true))
    });
    if (shareMission) {
      await db.insert(userMission).values({
        id: crypto.randomUUID(),
        userId: session2.user.id,
        missionId: shareMission.id,
        progress: 100,
        status: "COMPLETED",
        lastUpdated: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: [userMission.userId, userMission.missionId],
        set: {
          progress: 100,
          status: "COMPLETED",
          lastUpdated: /* @__PURE__ */ new Date()
        }
      });
    }
    return Response.json({
      success: true,
      post
    });
  }
  return Response.json({
    error: "Invalid intent"
  }, {
    status: 400
  });
}
const fandom = UNSAFE_withComponentProps(function FandomScreen() {
  const {
    allCharacters,
    selectedCharacter,
    characterStat: characterStat2,
    missions: missions2,
    notices,
    leaderboard,
    feedPosts,
    characterId
  } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [feedFilter, setFeedFilter] = useState("All");
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState("");
  const characters = allCharacters;
  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success("Post shared with the fandom!");
      setIsPosting(false);
      setPostContent("");
    } else if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data]);
  const handleCreatePost = (e) => {
    e.preventDefault();
    fetcher.submit({
      intent: "createPost",
      content: postContent
    }, {
      method: "POST"
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen relative pb-24",
    children: [/* @__PURE__ */ jsx("div", {
      className: "sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/5",
      children: /* @__PURE__ */ jsxs("div", {
        className: "flex items-center p-4 justify-between max-w-md mx-auto w-full",
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => navigate("/"),
          className: "flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-white",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined",
            children: "arrow_back"
          })
        }), /* @__PURE__ */ jsx("h2", {
          className: "text-lg font-bold leading-tight tracking-tight flex-1 text-center",
          children: "Fandom Lounge"
        }), /* @__PURE__ */ jsx("button", {
          className: "flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
          children: /* @__PURE__ */ jsxs("div", {
            className: "relative",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-slate-800 dark:text-white",
              children: "notifications"
            }), /* @__PURE__ */ jsx("span", {
              className: "absolute top-0 right-0 size-2.5 bg-primary rounded-full border-2 border-background-light dark:border-background-dark"
            })]
          })
        })]
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "max-w-md mx-auto w-full flex flex-col gap-6 pt-4",
      children: [/* @__PURE__ */ jsx("div", {
        className: "w-full overflow-x-auto scrollbar-hide px-4",
        children: /* @__PURE__ */ jsx("div", {
          className: "flex gap-4 min-w-max",
          children: characters.map((char) => {
            const isActive = char.id === characterId;
            return /* @__PURE__ */ jsxs("div", {
              onClick: () => navigate(`/fandom?characterId=${char.id}`),
              className: "flex flex-col items-center gap-2 group cursor-pointer",
              children: [/* @__PURE__ */ jsx("div", {
                className: cn("p-[3px] rounded-full transition-all", isActive ? "bg-gradient-to-tr from-primary to-purple-400" : "bg-transparent"),
                children: /* @__PURE__ */ jsx("div", {
                  className: cn("size-16 rounded-full border-4 overflow-hidden", isActive ? "border-background-light dark:border-background-dark bg-surface-dark" : "border-transparent bg-surface-dark/50 opacity-70 group-hover:opacity-100"),
                  children: /* @__PURE__ */ jsx("img", {
                    className: "w-full h-full object-cover",
                    src: char.media?.find((m) => m.type === "AVATAR")?.url || char.media?.[0]?.url,
                    alt: char.name
                  })
                })
              }), /* @__PURE__ */ jsx("span", {
                className: cn("text-xs", isActive ? "font-bold text-primary" : "font-medium"),
                children: char.name
              })]
            }, char.id);
          })
        })
      }), /* @__PURE__ */ jsx("div", {
        className: "px-4",
        children: /* @__PURE__ */ jsxs("div", {
          className: "relative overflow-hidden rounded-2xl bg-surface-dark dark:bg-surface-dark shadow-lg dark:shadow-none group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay",
            style: {
              backgroundImage: `url('${selectedCharacter.media?.find((m) => m.type === "COVER")?.url || selectedCharacter.media?.[0]?.url}')`
            }
          }), /* @__PURE__ */ jsx("div", {
            className: "absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90"
          }), /* @__PURE__ */ jsxs("div", {
            className: "relative p-6 flex flex-col gap-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-start",
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsxs("span", {
                  className: "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-2 border border-primary/30",
                  children: [/* @__PURE__ */ jsx("span", {
                    className: "material-symbols-outlined text-[14px]",
                    children: "star"
                  }), "Selected Star"]
                }), /* @__PURE__ */ jsxs("h2", {
                  className: "text-2xl font-bold text-white leading-tight",
                  children: [selectedCharacter.name, "'s Official Space"]
                }), /* @__PURE__ */ jsxs("p", {
                  className: "text-white/60 text-sm",
                  children: [selectedCharacter.role, " • AI Generation 3"]
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "flex flex-col items-center",
                children: /* @__PURE__ */ jsx("div", {
                  className: "size-12 rounded-full border-2 border-primary p-1 bg-surface-dark overflow-hidden",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex flex-col items-center justify-center h-full w-full bg-primary/20",
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined text-primary text-sm",
                      children: "favorite"
                    }), /* @__PURE__ */ jsx("span", {
                      className: "text-[10px] font-bold text-white",
                      children: characterStat2?.totalHearts || 0
                    })]
                  })
                })
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between text-sm font-medium text-white/80",
                children: [/* @__PURE__ */ jsx("span", {
                  children: "Heart Gauge"
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-primary",
                  children: [characterStat2?.totalHearts || 0, " / 1000"]
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "h-2 w-full bg-white/10 rounded-full overflow-hidden",
                children: /* @__PURE__ */ jsx("div", {
                  className: "h-full bg-primary rounded-full shadow-[0_0_10px_rgba(238,43,140,0.5)] transition-all duration-1000",
                  style: {
                    width: `${Math.min((characterStat2?.totalHearts || 0) / 1e3 * 100, 100)}%`
                  }
                })
              }), /* @__PURE__ */ jsx("p", {
                className: "text-xs text-white/50 text-right",
                children: "Send hearts to level up!"
              })]
            }), /* @__PURE__ */ jsxs("button", {
              onClick: () => navigate(`/character/${selectedCharacter.id}`),
              className: "mt-2 w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined",
                children: "forum"
              }), "Enter Lounge"]
            })]
          })]
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "pl-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex items-center justify-between pr-4 mb-3",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary",
              children: "new_releases"
            }), /* @__PURE__ */ jsx("h3", {
              className: "text-xl font-bold dark:text-white text-slate-900",
              children: "Official Updates"
            })]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => navigate("/notices"),
            className: "text-sm font-medium text-primary uppercase tracking-widest",
            children: "See All"
          })]
        }), /* @__PURE__ */ jsx("div", {
          className: "flex overflow-x-auto gap-4 pb-4 pr-4 scrollbar-hide",
          children: notices.length === 0 ? /* @__PURE__ */ jsx("div", {
            className: "min-w-[260px] h-32 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 flex items-center justify-center",
            children: /* @__PURE__ */ jsx("p", {
              className: "text-white/20 text-xs font-bold uppercase",
              children: "No updates yet"
            })
          }) : notices.map((item2) => /* @__PURE__ */ jsxs("div", {
            onClick: () => navigate(`/notices/${item2.id}`),
            className: "min-w-[260px] rounded-xl overflow-hidden bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-sm group cursor-pointer",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "aspect-[16/9] w-full bg-slate-200 relative",
              children: [item2.imageUrl ? /* @__PURE__ */ jsx("img", {
                className: "w-full h-full object-cover",
                src: item2.imageUrl,
                alt: item2.title
              }) : /* @__PURE__ */ jsx("div", {
                className: "w-full h-full bg-gradient-to-br from-primary/30 to-purple-600/30"
              }), /* @__PURE__ */ jsx("div", {
                className: cn("absolute top-2 left-2 px-2 py-0.5 rounded backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider", item2.type === "EVENT" ? "bg-emerald-500" : "bg-primary"),
                children: item2.type
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "p-3",
              children: [/* @__PURE__ */ jsx("h4", {
                className: "font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors",
                children: item2.title
              }), /* @__PURE__ */ jsx("p", {
                className: "text-xs text-slate-500 dark:text-white/40 mt-1",
                children: DateTime.fromJSDate(new Date(item2.createdAt)).toRelative()
              })]
            })]
          }, item2.id))
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex items-center justify-between mb-3",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-xl font-bold dark:text-white text-slate-900",
            children: "Missions"
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => navigate("/missions"),
            className: "text-sm font-medium text-primary hover:text-primary/80",
            children: "View All"
          })]
        }), /* @__PURE__ */ jsx("div", {
          className: "flex flex-col gap-3",
          children: missions2.length === 0 ? /* @__PURE__ */ jsx("div", {
            className: "p-8 text-center bg-white dark:bg-surface-dark rounded-xl border border-white/5",
            children: /* @__PURE__ */ jsx("p", {
              className: "text-white/20 text-xs font-bold uppercase tracking-widest",
              children: "No missions available"
            })
          }) : missions2.map((mission2) => /* @__PURE__ */ jsxs("div", {
            className: cn("p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4", mission2.completed && "opacity-60"),
            children: [/* @__PURE__ */ jsx("div", {
              className: "size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary",
                children: "target"
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex-1 min-w-0",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between mb-1",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-sm font-bold dark:text-white truncate",
                  children: mission2.title
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-xs font-bold text-primary",
                  children: ["+", mission2.rewardCredits, " CHOCO"]
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden",
                children: /* @__PURE__ */ jsx("div", {
                  className: "h-full bg-primary rounded-full shadow-[0_0_5px_rgba(238,43,140,0.5)]",
                  style: {
                    width: `${mission2.progress}%`
                  }
                })
              })]
            }), mission2.completed ? /* @__PURE__ */ jsx("button", {
              className: "shrink-0 size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-sm font-black",
                children: "check"
              })
            }) : /* @__PURE__ */ jsx("button", {
              onClick: () => navigate("/missions"),
              className: "shrink-0 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-500 dark:text-white/50",
              children: "GO"
            })]
          }, mission2.id))
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "text-xl font-bold dark:text-white text-slate-900 mb-4",
          children: "Top Collectors"
        }), /* @__PURE__ */ jsx("div", {
          className: "bg-surface-dark/50 dark:bg-surface-dark rounded-2xl p-4 border border-slate-100 dark:border-white/5",
          children: leaderboard.length < 3 ? /* @__PURE__ */ jsx("div", {
            className: "py-8 text-center text-white/20 text-xs font-bold tracking-widest",
            children: "COMPETITION HEATING UP..."
          }) : /* @__PURE__ */ jsxs(Fragment, {
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-end justify-center gap-4 mb-6 pt-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex flex-col items-center gap-1 w-1/3",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */ jsx("div", {
                    className: "size-12 rounded-full border-2 border-slate-400 overflow-hidden bg-slate-800",
                    children: /* @__PURE__ */ jsx("img", {
                      className: "w-full h-full object-cover",
                      src: leaderboard[1].avatar,
                      alt: leaderboard[1].name
                    })
                  }), /* @__PURE__ */ jsx("div", {
                    className: "absolute -bottom-2 inset-x-0 flex justify-center",
                    children: /* @__PURE__ */ jsx("span", {
                      className: "bg-slate-400 text-[10px] font-bold px-1.5 rounded text-white",
                      children: "2"
                    })
                  })]
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs font-bold text-white mt-1 truncate w-full text-center",
                  children: leaderboard[1].name
                }), /* @__PURE__ */ jsxs("p", {
                  className: "text-[10px] text-white/50",
                  children: [leaderboard[1].points, " pts"]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex flex-col items-center gap-1 w-1/3 -mt-6",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-yellow-500 text-lg animate-bounce",
                  children: "crown"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */ jsx("div", {
                    className: "size-16 rounded-full border-4 border-yellow-500 overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.4)] bg-slate-800",
                    children: /* @__PURE__ */ jsx("img", {
                      className: "w-full h-full object-cover",
                      src: leaderboard[0].avatar,
                      alt: leaderboard[0].name
                    })
                  }), /* @__PURE__ */ jsx("div", {
                    className: "absolute -bottom-2 inset-x-0 flex justify-center",
                    children: /* @__PURE__ */ jsx("span", {
                      className: "bg-yellow-500 text-xs font-bold px-2 py-0.5 rounded text-black",
                      children: "1"
                    })
                  })]
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-sm font-bold text-primary mt-1 truncate w-full text-center",
                  children: leaderboard[0].name
                }), /* @__PURE__ */ jsxs("p", {
                  className: "text-xs text-white/50",
                  children: [leaderboard[0].points, " pts"]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex flex-col items-center gap-1 w-1/3",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */ jsx("div", {
                    className: "size-12 rounded-full border-2 border-orange-700 overflow-hidden bg-slate-800",
                    children: /* @__PURE__ */ jsx("img", {
                      className: "w-full h-full object-cover",
                      src: leaderboard[2].avatar,
                      alt: leaderboard[2].name
                    })
                  }), /* @__PURE__ */ jsx("div", {
                    className: "absolute -bottom-2 inset-x-0 flex justify-center",
                    children: /* @__PURE__ */ jsx("span", {
                      className: "bg-orange-700 text-[10px] font-bold px-1.5 rounded text-white",
                      children: "3"
                    })
                  })]
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs font-bold text-white mt-1 truncate w-full text-center",
                  children: leaderboard[2].name
                }), /* @__PURE__ */ jsxs("p", {
                  className: "text-[10px] text-white/50",
                  children: [leaderboard[2].points, " pts"]
                })]
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "flex flex-col gap-2",
              children: leaderboard.slice(3).map((user2) => /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-sm font-bold text-white/40 w-4 text-center",
                  children: user2.rank
                }), /* @__PURE__ */ jsx("div", {
                  className: "size-8 rounded-full bg-slate-700 overflow-hidden",
                  children: /* @__PURE__ */ jsx("img", {
                    className: "w-full h-full object-cover",
                    src: user2.avatar,
                    alt: user2.name
                  })
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-sm font-medium text-white flex-1",
                  children: user2.name
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-primary font-bold",
                  children: user2.points
                })]
              }, user2.rank))
            })]
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex items-center justify-between mb-4",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-xl font-bold dark:text-white text-slate-900",
            children: "Fan Feed"
          }), /* @__PURE__ */ jsx("div", {
            className: "flex gap-2",
            children: /* @__PURE__ */ jsx("button", {
              onClick: () => setFeedFilter("All"),
              className: cn("px-3 py-1 rounded-full text-xs font-bold", feedFilter === "All" ? "bg-primary text-white" : "bg-slate-200 dark:bg-white/10 dark:text-white/60 text-slate-600"),
              children: "All"
            })
          })]
        }), feedPosts.length === 0 ? /* @__PURE__ */ jsxs("div", {
          className: "py-20 text-center bg-white dark:bg-surface-dark border border-white/5 rounded-2xl",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-6xl text-white/5",
            children: "feed"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/10 text-xs font-black uppercase mt-4",
            children: "Be the first to post!"
          })]
        }) : feedPosts.map((post) => /* @__PURE__ */ jsxs("div", {
          className: "bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-white/5 p-4 mb-4 shadow-sm",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-3 mb-3",
            children: [/* @__PURE__ */ jsx("div", {
              className: "size-10 rounded-full bg-slate-200 overflow-hidden border border-white/5",
              children: /* @__PURE__ */ jsx("img", {
                className: "w-full h-full object-cover",
                src: post.user.avatarUrl || post.user.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.userId,
                alt: post.user.name
              })
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-sm font-bold dark:text-white text-slate-900",
                children: post.user.name
              }), /* @__PURE__ */ jsx("p", {
                className: "text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-tight",
                children: DateTime.fromJSDate(new Date(post.createdAt)).toRelative()
              })]
            }), /* @__PURE__ */ jsx("button", {
              className: "ml-auto text-slate-400",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined",
                children: "more_horiz"
              })
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-sm text-slate-700 dark:text-white/90 mb-3 leading-relaxed whitespace-pre-wrap",
            children: post.content
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5",
            children: [/* @__PURE__ */ jsxs("button", {
              className: "flex items-center gap-1.5 text-slate-500 dark:text-white/60 hover:text-primary transition-colors",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[20px]",
                children: "favorite"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-xs font-medium",
                children: post.likes || 0
              })]
            }), /* @__PURE__ */ jsxs("button", {
              className: "flex items-center gap-1.5 text-slate-500 dark:text-white/60 hover:text-white transition-colors",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[20px]",
                children: "chat_bubble"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-xs font-medium",
                children: "0"
              })]
            }), /* @__PURE__ */ jsx("button", {
              className: "flex items-center gap-1.5 text-slate-500 dark:text-white/60 hover:text-white transition-colors",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[20px]",
                children: "share"
              })
            })]
          })]
        }, post.id))]
      })]
    }), isPosting && /* @__PURE__ */ jsx("div", {
      className: "fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4",
      children: /* @__PURE__ */ jsxs("div", {
        className: "bg-background-dark w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-white/10 p-8 pt-6 shadow-2xl animate-in slide-in-from-bottom duration-300",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex items-center justify-between mb-8",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-xl font-black text-white",
            children: "Share with Fandom"
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setIsPosting(false),
            className: "size-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors",
            children: /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined",
              children: "close"
            })
          })]
        }), /* @__PURE__ */ jsxs("form", {
          onSubmit: handleCreatePost,
          className: "space-y-6",
          children: [/* @__PURE__ */ jsx("textarea", {
            autoFocus: true,
            value: postContent,
            onChange: (e) => setPostContent(e.target.value),
            placeholder: "What's happening in the fandom today?",
            className: "w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-base min-h-[160px] focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between",
            children: [/* @__PURE__ */ jsx("button", {
              type: "button",
              className: "p-3 rounded-full bg-white/5 text-white/60 hover:text-primary transition-colors",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined",
                children: "image"
              })
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              disabled: fetcher.state !== "idle" || postContent.length < 5,
              className: "px-8 py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-[0_8px_20px_rgba(238,43,140,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100",
              children: fetcher.state !== "idle" ? "POSTING..." : "POST NOW"
            })]
          })]
        })]
      })
    }), /* @__PURE__ */ jsx("button", {
      onClick: () => setIsPosting(true),
      className: "fixed bottom-24 right-4 z-40 size-14 rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(238,43,140,0.5)] flex items-center justify-center hover:scale-110 transition-transform active:scale-90",
      children: /* @__PURE__ */ jsx("span", {
        className: "material-symbols-outlined text-3xl",
        children: "edit"
      })
    }), /* @__PURE__ */ jsx(BottomNavigation, {})]
  });
});
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$H,
  default: fandom,
  loader: loader$E
}, Symbol.toStringTag, { value: "Module" }));
async function loader$D({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  const allMissions = await db.query.mission.findMany({
    where: eq(mission.isActive, true),
    orderBy: [desc(mission.createdAt)]
  });
  const userMissions = await db.query.userMission.findMany({
    where: eq(userMission.userId, session2.user.id)
  });
  const missions2 = allMissions.map((m) => {
    const userProgress = userMissions.find((um) => um.missionId === m.id);
    return {
      ...m,
      status: userProgress?.status || "IN_PROGRESS",
      progress: userProgress?.progress || 0
    };
  });
  return Response.json({
    user: session2.user,
    missions: missions2
  });
}
async function action$G({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const formData = await request.formData();
  const missionId = formData.get("missionId");
  const intent = formData.get("intent");
  if (intent === "claim") {
    const userMission$1 = await db.query.userMission.findFirst({
      where: and(eq(userMission.userId, session2.user.id), eq(userMission.missionId, missionId)),
      with: {
        mission: true
      }
    });
    if (!userMission$1 || userMission$1.status !== "COMPLETED") {
      return Response.json({
        error: "Mission not ready to claim"
      }, {
        status: 400
      });
    }
    const rewardChoco = userMission$1.mission.rewardCredits.toString();
    await db.transaction(async (tx) => {
      await tx.update(userMission).set({
        status: "CLAIMED"
      }).where(eq(userMission.id, userMission$1.id));
      const user$1 = await tx.query.user.findFirst({
        where: eq(user.id, session2.user.id),
        columns: {
          chocoBalance: true
        }
      });
      const currentChocoBalance = user$1?.chocoBalance ? parseFloat(user$1.chocoBalance) : 0;
      const newChocoBalance = (currentChocoBalance + userMission$1.mission.rewardCredits).toString();
      await tx.update(user).set({
        chocoBalance: newChocoBalance,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, session2.user.id));
      await tx.insert(systemLog).values({
        id: crypto.randomUUID(),
        level: "AUDIT",
        category: "PAYMENT",
        message: `User ${session2.user.id} claimed ${rewardChoco} CHOCO from mission ${missionId}`,
        createdAt: /* @__PURE__ */ new Date()
      });
    });
    return Response.json({
      success: true,
      reward: userMission$1.mission.rewardCredits,
      rewardChoco
    });
  }
  return Response.json({
    error: "Invalid intent"
  }, {
    status: 400
  });
}
const missions = UNSAFE_withComponentProps(function MissionsPage() {
  const {
    missions: missions2
  } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success(`${fetcher.data.reward} CHOCO claimed!`);
    } else if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data]);
  const handleClaim = (missionId) => {
    fetcher.submit({
      missionId,
      intent: "claim"
    }, {
      method: "POST"
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-dark text-white font-display antialiased min-h-screen pb-24 max-w-md mx-auto shadow-2xl",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 border-b border-white/5",
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => navigate(-1),
        className: "p-2 -ml-2 hover:text-primary transition-colors",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined",
          children: "arrow_back"
        })
      }), /* @__PURE__ */ jsx("h1", {
        className: "text-xl font-black tracking-tight ml-2",
        children: "Mission Center"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "p-4 space-y-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-[32px] p-6 border border-white/10 relative overflow-hidden group",
        children: [/* @__PURE__ */ jsx("div", {
          className: "absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-6xl",
            children: "military_tech"
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "relative z-10",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-sm font-black text-white/60 uppercase tracking-[0.2em] mb-1",
            children: "Today's Progress"
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-baseline gap-2 mb-4",
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-4xl font-black text-white",
              children: missions2.filter((m) => m.status === "CLAIMED").length
            }), /* @__PURE__ */ jsxs("span", {
              className: "text-lg font-bold text-white/40",
              children: ["/ ", missions2.length]
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "h-2 w-full bg-white/10 rounded-full overflow-hidden",
            children: /* @__PURE__ */ jsx("div", {
              className: "h-full bg-primary shadow-[0_0_10px_rgba(238,43,140,0.5)] transition-all duration-1000",
              style: {
                width: `${missions2.filter((m) => m.status === "CLAIMED").length / (missions2.length || 1) * 100}%`
              }
            })
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "space-y-4",
        children: [/* @__PURE__ */ jsxs("h2", {
          className: "text-xs font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-primary text-sm font-bold",
            children: "radar"
          }), "Open Missions"]
        }), /* @__PURE__ */ jsx("div", {
          className: "grid gap-3",
          children: missions2.length === 0 ? /* @__PURE__ */ jsx("div", {
            className: "py-12 text-center bg-white/5 rounded-2xl border border-white/5",
            children: /* @__PURE__ */ jsx("p", {
              className: "text-white/20 text-xs font-bold uppercase tracking-[0.2em]",
              children: "No missions available"
            })
          }) : missions2.map((mission2) => /* @__PURE__ */ jsxs("div", {
            className: cn("bg-[#1A1821] border border-white/5 rounded-2xl p-4 transition-all", mission2.status === "CLAIMED" && "opacity-50 grayscale"),
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-start mb-3",
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("span", {
                  className: cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-2", mission2.type === "DAILY" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"),
                  children: mission2.type
                }), /* @__PURE__ */ jsx("h3", {
                  className: "font-bold text-base text-white",
                  children: mission2.title
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-white/60",
                  children: mission2.description
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "text-right",
                children: [/* @__PURE__ */ jsxs("span", {
                  className: "text-primary font-black text-sm",
                  children: ["+", mission2.rewardCredits]
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-[10px] font-bold text-white/40 uppercase tracking-tighter",
                  children: "CHOCO"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-3",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden",
                children: /* @__PURE__ */ jsx("div", {
                  className: cn("h-full transition-all duration-500", mission2.status === "COMPLETED" || mission2.status === "CLAIMED" ? "bg-emerald-500" : "bg-primary"),
                  style: {
                    width: mission2.status === "CLAIMED" || mission2.status === "COMPLETED" ? "100%" : `${mission2.progress}%`
                  }
                })
              }), mission2.status === "COMPLETED" && /* @__PURE__ */ jsx("button", {
                onClick: () => handleClaim(mission2.id),
                disabled: fetcher.state !== "idle",
                className: "px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-lg transition-all active:scale-95",
                children: "CLAIM"
              }), mission2.status === "CLAIMED" && /* @__PURE__ */ jsx("span", {
                className: "text-emerald-500 material-symbols-outlined",
                children: "check_circle"
              }), mission2.status === "IN_PROGRESS" && /* @__PURE__ */ jsxs("span", {
                className: "text-xs font-bold text-white/40",
                children: [mission2.progress, "%"]
              })]
            })]
          }, mission2.id))
        })]
      })]
    }), /* @__PURE__ */ jsx(BottomNavigation, {})]
  });
});
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$G,
  default: missions,
  loader: loader$D
}, Symbol.toStringTag, { value: "Module" }));
async function loader$C({
  request
}) {
  const notices = await db.query.notice.findMany({
    where: eq(notice.isActive, true),
    orderBy: [desc(notice.isPinned), desc(notice.createdAt)]
  });
  return Response.json({
    notices
  });
}
const index$8 = UNSAFE_withComponentProps(function NoticeListPage() {
  const {
    notices
  } = useLoaderData();
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-dark text-white font-display antialiased min-h-screen pb-24 max-w-md mx-auto shadow-2xl",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 border-b border-white/5",
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => navigate(-1),
        className: "p-2 -ml-2 hover:text-primary transition-colors",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined",
          children: "arrow_back"
        })
      }), /* @__PURE__ */ jsx("h1", {
        className: "text-xl font-black tracking-tight ml-2",
        children: "Announcements"
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "p-4 space-y-4",
      children: notices.length === 0 ? /* @__PURE__ */ jsxs("div", {
        className: "py-20 text-center",
        children: [/* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-6xl text-white/10 mb-4",
          children: "campaign"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/20 text-xs font-bold uppercase tracking-[0.2em]",
          children: "No official updates available"
        })]
      }) : notices.map((notice2) => /* @__PURE__ */ jsxs("div", {
        onClick: () => navigate(`/notices/${notice2.id}`),
        className: cn("relative overflow-hidden rounded-2xl bg-[#1A1821] border border-white/5 active:bg-white/5 transition-all cursor-pointer group", notice2.isPinned && "border-primary/30 bg-primary/5"),
        children: [notice2.isPinned && /* @__PURE__ */ jsx("div", {
          className: "absolute top-3 right-3 text-primary animate-pulse",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-sm font-black",
            children: "push_pin"
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "p-5",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-2 mb-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: cn("rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white", notice2.type === "EVENT" ? "bg-emerald-500" : notice2.type === "NEWS" ? "bg-blue-600" : "bg-primary"),
              children: notice2.type
            }), /* @__PURE__ */ jsx("span", {
              className: "text-[10px] text-white/40 font-bold",
              children: DateTime.fromJSDate(new Date(notice2.createdAt)).toFormat("yyyy. MM. dd")
            })]
          }), /* @__PURE__ */ jsx("h3", {
            className: "text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors",
            children: notice2.title
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/60 text-sm line-clamp-2 leading-relaxed",
            children: notice2.content
          }), notice2.imageUrl && /* @__PURE__ */ jsx("div", {
            className: "mt-4 rounded-xl overflow-hidden aspect-[16/9] border border-white/5",
            children: /* @__PURE__ */ jsx("img", {
              src: notice2.imageUrl,
              alt: "",
              className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            })
          })]
        })]
      }, notice2.id))
    }), /* @__PURE__ */ jsx(BottomNavigation, {})]
  });
});
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$8,
  loader: loader$C
}, Symbol.toStringTag, { value: "Module" }));
async function loader$B({
  params
}) {
  if (!params.id) {
    throw new Response("Notice ID Missing", {
      status: 400
    });
  }
  const notice$1 = await db.query.notice.findFirst({
    where: eq(notice.id, params.id)
  });
  if (!notice$1) {
    throw new Response("Notice Not Found", {
      status: 404
    });
  }
  return Response.json({
    notice: notice$1
  });
}
const $id$1 = UNSAFE_withComponentProps(function NoticeDetailPage() {
  const {
    notice: notice2
  } = useLoaderData();
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-dark text-white font-display antialiased min-h-screen pb-24 max-w-md mx-auto shadow-2xl",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 border-b border-white/5",
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => navigate(-1),
        className: "p-2 -ml-2 hover:text-primary transition-colors",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined",
          children: "arrow_back"
        })
      }), /* @__PURE__ */ jsx("h1", {
        className: "text-lg font-bold tracking-tight ml-2",
        children: "Detail"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "p-6 space-y-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "space-y-3",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex items-center gap-2",
          children: [/* @__PURE__ */ jsx("span", {
            className: cn("rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white", notice2.type === "EVENT" ? "bg-emerald-500" : notice2.type === "NEWS" ? "bg-blue-600" : "bg-primary"),
            children: notice2.type
          }), /* @__PURE__ */ jsx("span", {
            className: "text-xs text-white/40 font-bold",
            children: DateTime.fromJSDate(new Date(notice2.createdAt)).toFormat("yyyy. MM. dd HH:mm")
          })]
        }), /* @__PURE__ */ jsx("h2", {
          className: "text-2xl font-black text-white leading-tight",
          children: notice2.title
        })]
      }), notice2.imageUrl && /* @__PURE__ */ jsx("div", {
        className: "rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50",
        children: /* @__PURE__ */ jsx("img", {
          src: notice2.imageUrl,
          alt: "",
          className: "w-full h-auto"
        })
      }), /* @__PURE__ */ jsx("div", {
        className: "bg-white/5 rounded-3xl p-6 border border-white/5",
        children: /* @__PURE__ */ jsx("div", {
          className: "text-white/80 text-base leading-relaxed whitespace-pre-wrap font-medium",
          children: notice2.content
        })
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => navigate("/notices"),
        className: "w-full py-4 rounded-2xl bg-[#1A1821] border border-white/5 text-sm font-black text-white/60 hover:text-white hover:bg-white/5 transition-all",
        children: "BACK TO LIST"
      })]
    }), /* @__PURE__ */ jsx(BottomNavigation, {})]
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $id$1,
  loader: loader$B
}, Symbol.toStringTag, { value: "Module" }));
function ComingSoon({ title, subtitle, icon = "construction", iconBgColor = "bg-primary/20" }) {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsx("div", { className: "bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen selection:bg-primary selection:text-white", children: /* @__PURE__ */ jsxs("div", { className: "relative flex h-full w-full flex-col max-w-md mx-auto overflow-x-hidden min-h-screen pb-10 md:max-w-lg lg:max-w-xl", children: [
    /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-50 flex items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md p-4 justify-between border-b border-black/5 dark:border-white/5 transition-colors duration-300", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate(-1),
          className: "text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
          children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[24px]", children: "arrow_back_ios_new" })
        }
      ),
      /* @__PURE__ */ jsx("h2", { className: "text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10", children: title })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center max-w-sm w-full", children: [
      /* @__PURE__ */ jsx("div", { className: `mb-6 size-24 rounded-3xl ${iconBgColor} flex items-center justify-center`, children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-5xl text-primary", children: icon }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-slate-900 dark:text-white mb-3", children: "준비 중이에요!" }),
      subtitle ? /* @__PURE__ */ jsx("p", { className: "text-base text-slate-500 dark:text-slate-400 mb-8", children: subtitle }) : /* @__PURE__ */ jsx("p", { className: "text-base text-slate-500 dark:text-slate-400 mb-8", children: "곧 만나볼 수 있을 거예요. 조금만 기다려주세요!" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 opacity-50", children: [
        /* @__PURE__ */ jsx("div", { className: "size-2 rounded-full bg-primary animate-pulse", style: { animationDelay: "0s" } }),
        /* @__PURE__ */ jsx("div", { className: "size-2 rounded-full bg-primary animate-pulse", style: { animationDelay: "0.2s" } }),
        /* @__PURE__ */ jsx("div", { className: "size-2 rounded-full bg-primary animate-pulse", style: { animationDelay: "0.4s" } })
      ] })
    ] }) })
  ] }) });
}
const edit$4 = UNSAFE_withComponentProps(function ProfileEditScreen() {
  return /* @__PURE__ */ jsx(ComingSoon, {
    title: "프로필 수정",
    subtitle: "닉네임과 상태메시지를 변경할 수 있는 기능이 곧 추가됩니다.",
    icon: "badge",
    iconBgColor: "bg-purple-500/20"
  });
});
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: edit$4
}, Symbol.toStringTag, { value: "Module" }));
cva(
  "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const SUBSCRIPTION_PLANS = {
  FREE: {
    tier: "FREE",
    name: "Free Starter",
    monthlyPrice: 0,
    monthlyPriceKRW: 0,
    creditsPerMonth: 1500,
    // 일 50회 * 30일
    aiModel: "gemini-2.5-flash",
    features: [
      "기본 AI 대화 (Gemini 2.5 Flash)",
      "일일 50 CHOCO",
      "광고 포함",
      "커뮤니티 지원"
    ],
    description: "AI 챗봇을 가볍게 체험해보고 싶은 분들을 위한 플랜입니다."
  },
  BASIC: {
    tier: "BASIC",
    name: "Basic Fan",
    monthlyPrice: 4.99,
    monthlyPriceKRW: 6900,
    creditsPerMonth: 2e3,
    aiModel: "gemini-2.5-flash",
    features: [
      "모든 Free 기능 포함",
      "광고 제거",
      "월 2,000 CHOCO",
      "표준 응답 속도"
    ],
    description: "광고 없이 쾌적하게 대화를 즐기고 싶은 분들에게 적합합니다.",
    paypalPlanId: "P-5K454582VA7953222NFNKGFA"
  },
  PREMIUM: {
    tier: "PREMIUM",
    name: "Premium Lover",
    monthlyPrice: 14.99,
    monthlyPriceKRW: 19900,
    creditsPerMonth: 1e4,
    aiModel: "gpt-4o",
    // 예시: UI 표시용
    features: [
      "모든 Basic 기능 포함",
      "월 10,000 CHOCO 대용량",
      "고급 모델(GPT-4o, Claude 3.5) 접근 가능",
      "이미지 생성 기능",
      "빠른 응답 속도"
    ],
    description: "고성능 AI와 다양한 기능을 마음껏 사용하고 싶은 분들을 위한 베스트셀러 플랜입니다.",
    paypalPlanId: "P-41T04774YU1463158NFNKGFI"
  },
  ULTIMATE: {
    tier: "ULTIMATE",
    name: "Ultimate Soulmate",
    monthlyPrice: 29.99,
    monthlyPriceKRW: 39900,
    creditsPerMonth: 3e4,
    // FUP 적용 (사실상 무제한급)
    aiModel: "gpt-4o",
    features: [
      "모든 Premium 기능 포함",
      "무제한 CHOCO (FUP 적용)",
      "우선 처리 (Priority Queue)",
      "전용 컨시어지 서비스",
      "우선 서포트 지원"
    ],
    description: "한계 없는 대화와 최고의 서비스를 경험하고 싶은 분들을 위한 궁극의 플랜입니다.",
    paypalPlanId: "P-39869672589972749NFNKGFI"
  }
};
const CREDIT_PACKAGES = [
  {
    id: "credit_pack_small",
    price: 5,
    priceKRW: 6900,
    credits: 5e3,
    bonus: 0,
    name: "Starter Pack",
    isPopular: false
  },
  {
    id: "credit_pack_medium",
    price: 10,
    priceKRW: 13900,
    credits: 12e3,
    bonus: 2e3,
    name: "Value Pack",
    isPopular: true
  },
  {
    id: "credit_pack_large",
    price: 20,
    priceKRW: 27900,
    credits: 26e3,
    bonus: 6e3,
    name: "Pro Pack",
    isPopular: false
  },
  {
    id: "credit_pack_mega",
    price: 50,
    priceKRW: 69e3,
    credits: 7e4,
    bonus: 2e4,
    name: "Mega Pack",
    isPopular: false
  }
];
const subscriptionPlans = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CREDIT_PACKAGES,
  SUBSCRIPTION_PLANS
}, Symbol.toStringTag, { value: "Module" }));
function TokenTopUpModal({
  open,
  onOpenChange,
  trigger,
  paypalClientId,
  tossClientKey
}) {
  const [selectedPackageId, setSelectedPackageId] = useState(
    CREDIT_PACKAGES[1].id
  );
  const [paymentMethod, setPaymentMethod] = useState("TOSS");
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [isProcessing, setIsProcessing] = useState(false);
  const selectedPackage = CREDIT_PACKAGES.find((p) => p.id === selectedPackageId) || CREDIT_PACKAGES[1];
  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator) {
      const isKorean = window.navigator.language.startsWith("ko");
      setPaymentMethod(isKorean ? "TOSS" : "PAYPAL");
    }
  }, []);
  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success("충전이 완료되었습니다!");
      if (onOpenChange) onOpenChange(false);
      revalidator.revalidate();
    } else if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.data, onOpenChange, revalidator]);
  const handleApprove = async (data2, actions) => {
    const formData = new FormData();
    formData.append("orderId", data2.orderID);
    formData.append("packageId", selectedPackageId);
    fetcher.submit(formData, {
      method: "post",
      action: "/api/payment/capture-order"
    });
  };
  const handleTossPayment = async () => {
    if (!tossClientKey || isProcessing) {
      if (!tossClientKey) toast.error("토스페이먼츠 설정 오류");
      return;
    }
    setIsProcessing(true);
    try {
      const { loadTossPayments } = await import("@tosspayments/payment-sdk");
      const tossPayments = await loadTossPayments(tossClientKey);
      const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      await tossPayments.requestPayment("카드", {
        amount: selectedPackage.priceKRW,
        orderId,
        orderName: selectedPackage.name,
        successUrl: `${window.location.origin}/payment/toss/success?creditsGranted=${selectedPackage.credits + selectedPackage.bonus}&packageId=${selectedPackage.id}&amount=${selectedPackage.priceKRW}`,
        failUrl: `${window.location.origin}/payment/toss/fail?from=topup`,
        windowTarget: isMobile ? "self" : void 0
      });
    } catch (error) {
      console.error("Toss Payment Error:", error);
      toast.error("결제 준비 중 오류가 발생했습니다.");
      setIsProcessing(false);
    }
  };
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange, children: [
    trigger && /* @__PURE__ */ jsx(DialogTrigger, { children: trigger }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[500px] bg-background-dark border-white/10 text-white p-0 gap-0 overflow-hidden shadow-2xl rounded-3xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "p-6 bg-surface-dark/50 backdrop-blur-md border-b border-white/5", children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl font-bold tracking-tight text-white", children: "CHOCO Top Up" }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-white/50 text-sm", children: "AI 캐릭터와 더 즐겁게 대화하기 위해 CHOCO를 충전하세요." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 overflow-y-auto max-h-[80vh]", children: [
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-3", children: CREDIT_PACKAGES.map((pkg) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "relative flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
              selectedPackageId === pkg.id ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(238,43,140,0.15)]" : "bg-surface-dark border-white/5 hover:border-white/10 hover:bg-white/5"
            ),
            onClick: () => setSelectedPackageId(pkg.id),
            children: [
              pkg.isPopular && /* @__PURE__ */ jsx("div", { className: "absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg", children: "Popular" }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: cn(
                  "text-base font-bold transition-colors",
                  selectedPackageId === pkg.id ? "text-primary" : "text-white"
                ), children: pkg.name }),
                pkg.bonus > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-green-400 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[12px]", children: "verified" }),
                  "+",
                  pkg.bonus.toLocaleString(),
                  " Bonus"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-end gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-white tracking-tight", children: (pkg.credits + pkg.bonus).toLocaleString() }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-white/50 font-bold", children: "CHOCO" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold text-white/70", children: [
                  "₩",
                  pkg.priceKRW.toLocaleString(),
                  " / $",
                  pkg.price
                ] })
              ] })
            ]
          },
          pkg.id
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto scrollbar-hide", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setPaymentMethod("TOSS"),
                className: cn(
                  "flex-1 min-w-[100px] py-2 text-[11px] font-bold rounded-lg transition-all",
                  paymentMethod === "TOSS" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white"
                ),
                children: "국내 (카드)"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setPaymentMethod("PAYPAL"),
                className: cn(
                  "flex-1 min-w-[100px] py-2 text-[11px] font-bold rounded-lg transition-all",
                  paymentMethod === "PAYPAL" ? "bg-[#ffc439] text-[#003087] shadow-lg" : "text-white/50 hover:text-white"
                ),
                children: "해외 (PayPal)"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl p-4 shadow-sm min-h-[100px] flex flex-col justify-center", children: [
            paymentMethod === "PAYPAL" ? paypalClientId ? /* @__PURE__ */ jsx(PayPalScriptProvider, { options: {
              clientId: paypalClientId,
              currency: "USD",
              intent: "capture"
            }, children: /* @__PURE__ */ jsx(
              PayPalButtons,
              {
                style: {
                  layout: "vertical",
                  shape: "rect",
                  borderRadius: 12,
                  height: 48,
                  color: "gold",
                  label: "pay"
                },
                forceReRender: [selectedPackageId],
                createOrder: async (data2, actions) => {
                  const response = await fetch("/api/payment/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({ packageId: selectedPackageId })
                  });
                  const result = await response.json();
                  if (result.error) throw new Error(result.error);
                  return result.orderId;
                },
                onApprove: handleApprove,
                onCancel: () => {
                  toast.info("결제가 취소되었습니다.");
                },
                onError: (err) => {
                  console.error("PayPal Error:", err);
                  toast.error("결제 처리 중 오류가 발생했습니다.");
                }
              }
            ) }) : /* @__PURE__ */ jsx("div", { className: "text-center text-red-500 py-4 text-xs font-bold", children: "PayPal Client ID 없음" }) : paymentMethod === "TOSS" ? /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleTossPayment,
                disabled: isProcessing,
                className: cn(
                  "w-full h-12 bg-[#3182f6] hover:bg-[#1b64da] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                  isProcessing && "opacity-70 cursor-not-allowed"
                ),
                children: isProcessing ? /* @__PURE__ */ jsx("div", { className: "size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[20px]", children: "payments" }),
                  "토스로 결제하기"
                ] })
              }
            ) : null,
            /* @__PURE__ */ jsx("p", { className: "text-center text-[10px] text-slate-400 mt-3 px-1", children: "결제 시 이용약관에 동의하게 됩니다." })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function WalletCard({
  chocoBalance,
  nearBalance,
  nearAccountId,
  depositDialogOpen,
  swapDialogOpen,
  historyDialogOpen,
  onDepositDialogChange,
  onSwapDialogChange,
  onHistoryDialogChange,
  onScanDeposits,
  isScanning,
  history,
  onCopyAddress,
  nearPriceUSD
}) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "px-4 pb-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-3xl bg-linear-to-br from-violet-600 via-indigo-600 to-purple-700 text-white shadow-xl ring-1 ring-white/10 relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-black/10 blur-xl" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-indigo-200 font-medium mb-1 tracking-wider uppercase", children: "My Wallet" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold tracking-tight", children: parseInt(chocoBalance || "0").toLocaleString() }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-indigo-200", children: "CHOCO" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm text-indigo-100 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full", children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                "≈ ",
                nearBalance,
                ""
              ] }) }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-indigo-300 bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-400/20", children: "가스비 무료" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => onHistoryDialogChange(true),
              className: "p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white",
              children: /* @__PURE__ */ jsx(History, { className: "w-5 h-5" })
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-2 bg-black/20 p-2 rounded-lg cursor-pointer hover:bg-black/30 transition-colors", onClick: onCopyAddress, children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-white/10 rounded-md", children: /* @__PURE__ */ jsx(Wallet, { className: "w-3.5 h-3.5" }) }),
          /* @__PURE__ */ jsx("code", { className: "text-xs font-mono text-indigo-100 flex-1 truncate", children: nearAccountId || "지갑 주소 없음" }),
          /* @__PURE__ */ jsx(Copy, { className: "w-3.5 h-3.5 text-indigo-300 mr-1" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: () => onDepositDialogChange(true),
              size: "lg",
              className: "bg-white text-indigo-700 hover:bg-indigo-50 border-0 font-bold shadow-sm",
              children: [
                /* @__PURE__ */ jsx(QrCode, { className: "w-4 h-4 mr-2" }),
                "입금 (Receive)"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: () => onSwapDialogChange(true),
              size: "lg",
              className: "bg-indigo-800/50 hover:bg-indigo-800/70 text-indigo-100 border border-indigo-500/30 shadow-sm backdrop-blur-sm",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 mr-2" }),
                "환전 (Swap)"
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: depositDialogOpen, onOpenChange: onDepositDialogChange, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: CHAIN_LABELS.DEPOSIT_DIALOG_TITLE }),
        /* @__PURE__ */ jsx(DialogDescription, { children: CHAIN_LABELS.DEPOSIT_INSTRUCTION })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-6 space-y-6", children: [
        /* @__PURE__ */ jsx("div", { className: "p-4 bg-white rounded-xl shadow-inner border mx-auto", children: nearAccountId && /* @__PURE__ */ jsx(QRCode, { value: nearAccountId, size: 160 }) }),
        /* @__PURE__ */ jsx("div", { className: "text-center w-full px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-full", children: [
          /* @__PURE__ */ jsx("code", { className: "flex-1 text-xs font-mono break-all text-left text-slate-600 dark:text-slate-300", children: nearAccountId }),
          /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", className: "h-8 w-8 shrink-0", onClick: onCopyAddress, children: /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" }) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-600 dark:text-blue-300 text-center w-full max-w-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: "실시간 시장 시세 적용" }),
          /* @__PURE__ */ jsx("br", {}),
          "입금 확인 시 1단위당 약 ",
          (nearPriceUSD * 1e3).toLocaleString(),
          " CHOCO로 자동 환전됩니다."
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: swapDialogOpen, onOpenChange: onSwapDialogChange, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "토큰 환전 (Auto-Swap)" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: CHAIN_LABELS.SWAP_DESCRIPTION })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "py-8 text-center space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" }),
          /* @__PURE__ */ jsxs("div", { className: "relative p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-500 mb-2", children: "현재 적용 환율" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 text-2xl font-bold text-slate-900 dark:text-white", children: [
              /* @__PURE__ */ jsx("span", { children: CHAIN_LABELS.RATE_FROM_UNIT }),
              /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-slate-400", children: "arrow_right_alt" }),
              /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
                (nearPriceUSD * 1e3).toLocaleString(),
                " CHOCO"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 leading-relaxed", children: [
          CHAIN_LABELS.DEPOSIT_CONFIRM_PROMPT,
          /* @__PURE__ */ jsx("br", {}),
          "아래 버튼을 누르면 ",
          /* @__PURE__ */ jsx("b", { children: "최신 입금 내역" }),
          "을 확인하고",
          /* @__PURE__ */ jsx("br", {}),
          "자동으로 환전하여 지갑에 넣어드립니다."
        ] })
      ] }),
      /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, { onClick: onScanDeposits, disabled: isScanning, className: "w-full h-12 text-base", children: isScanning ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 mr-2 animate-spin" }),
        "블록체인 스캔 중..."
      ] }) : "입금 확인 및 환전 실행" }) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: historyDialogOpen, onOpenChange: onHistoryDialogChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "p-6 pb-2", children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "사용 내역 (History)" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "최근 환전 및 사용 기록입니다." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto px-6 py-2", children: history.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-400 space-y-3 opacity-60", children: [
        /* @__PURE__ */ jsx(History, { className: "w-12 h-12" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "아직 기록이 없습니다." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4 pb-6", children: history.map((log2) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 gap-3 border border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: `text-xs font-bold px-2 py-0.5 rounded-md ${log2.fromChain === "NEAR" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-slate-100 text-slate-700"}`, children: formatChainForDisplay(log2.fromChain) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: formatDate(log2.createdAt) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxs("p", { className: "font-bold text-primary", children: [
              "+",
              parseInt(log2.toAmount).toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: log2.toToken })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs bg-slate-100 dark:bg-black/20 p-2 rounded-lg", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-slate-500", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              "환율: 1:",
              log2.rate
            ] }),
            /* @__PURE__ */ jsx("span", { className: "w-px h-2.5 bg-slate-300 dark:bg-slate-700" }),
            /* @__PURE__ */ jsxs("span", { className: "text-slate-400", children: [
              log2.fromAmount,
              " ",
              formatChainUnitForDisplay(log2.fromChain)
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: `https://testnet.nearblocks.io/txns/${log2.txHash}`,
              target: "_blank",
              rel: "noreferrer",
              className: "flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium",
              children: [
                "Tx 확인 ",
                /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
              ]
            }
          )
        ] })
      ] }, log2.id)) }) }),
      /* @__PURE__ */ jsx(DialogFooter, { className: "p-4 border-t border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onHistoryDialogChange(false), className: "w-full", children: "닫기" }) })
    ] }) })
  ] });
}
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
const EXCHANGERATE_API_URL = "https://api.exchangerate-api.com/v4/latest";
const CACHE_DURATION$2 = 5 * 60 * 1e3;
const CHOCO_PRICE_USD = 1e-3;
const memoryCache = /* @__PURE__ */ new Map();
async function fetchNearPriceFromCoinGecko() {
  try {
    const response = await fetch(`${COINGECKO_API_URL}?ids=near&vs_currencies=usd`);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    const data2 = await response.json();
    const price = data2.near?.usd || 5;
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
      stackTrace: error.stack
    });
    return 5;
  }
}
async function getExchangeRateFromDB(tokenPair) {
  const rateRecord = await db.query.exchangeRate.findFirst({
    where: eq(exchangeRate.tokenPair, tokenPair)
  });
  if (!rateRecord) {
    return null;
  }
  const cacheAge = Date.now() - rateRecord.updatedAt.getTime();
  if (cacheAge > CACHE_DURATION$2) {
    return null;
  }
  return rateRecord.rate;
}
async function saveExchangeRateToDB(tokenPair, rate) {
  const existing = await db.query.exchangeRate.findFirst({
    where: eq(exchangeRate.tokenPair, tokenPair)
  });
  if (existing) {
    await db.update(exchangeRate).set({
      rate,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(exchangeRate.tokenPair, tokenPair));
  } else {
    await db.insert(exchangeRate).values({
      id: crypto$1.randomUUID(),
      tokenPair,
      rate,
      updatedAt: /* @__PURE__ */ new Date()
    });
  }
}
async function getNearPriceUSD() {
  const tokenPair = "NEAR/USD";
  const memoryCached = memoryCache.get(tokenPair);
  if (memoryCached && Date.now() - memoryCached.updatedAt < CACHE_DURATION$2) {
    return memoryCached.rate;
  }
  const dbCached = await getExchangeRateFromDB(tokenPair);
  if (dbCached !== null) {
    memoryCache.set(tokenPair, {
      rate: dbCached,
      updatedAt: Date.now()
    });
    return dbCached;
  }
  const freshRate = await fetchNearPriceFromCoinGecko();
  await saveExchangeRateToDB(tokenPair, freshRate);
  memoryCache.set(tokenPair, {
    rate: freshRate,
    updatedAt: Date.now()
  });
  return freshRate;
}
async function calculateChocoFromNear(nearAmount) {
  const nearPriceUSD = await getNearPriceUSD();
  const amount = typeof nearAmount === "string" ? parseFloat(nearAmount) : nearAmount;
  const usdAmount = new BigNumber(amount).multipliedBy(nearPriceUSD);
  const chocoAmount = await calculateChocoFromUSD(usdAmount.toNumber());
  logger.info({
    category: "PAYMENT",
    message: `Calculated CHOCO from NEAR: ${amount} NEAR = ${chocoAmount.toString()} CHOCO (NEAR Price: $${nearPriceUSD})`,
    metadata: { nearAmount: amount, nearPriceUSD, usdAmount: usdAmount.toString(), chocoAmount: chocoAmount.toString() }
  });
  return chocoAmount.toString();
}
async function fetchUSDKRWRate() {
  const tokenPair = "USD/KRW";
  const memoryCached = memoryCache.get(tokenPair);
  if (memoryCached && Date.now() - memoryCached.updatedAt < CACHE_DURATION$2) {
    return memoryCached.rate;
  }
  const dbCached = await getExchangeRateFromDB(tokenPair);
  if (dbCached !== null) {
    memoryCache.set(tokenPair, {
      rate: dbCached,
      updatedAt: Date.now()
    });
    return dbCached;
  }
  try {
    const response = await fetch(`${EXCHANGERATE_API_URL}/USD`);
    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.status}`);
    }
    const data2 = await response.json();
    const krwRate = data2.rates?.KRW || 1350;
    logger.info({
      category: "SYSTEM",
      message: `Fetched USD/KRW rate from ExchangeRate API: ${krwRate}`,
      metadata: { krwRate }
    });
    await saveExchangeRateToDB(tokenPair, krwRate);
    memoryCache.set(tokenPair, {
      rate: krwRate,
      updatedAt: Date.now()
    });
    return krwRate;
  } catch (error) {
    logger.error({
      category: "SYSTEM",
      message: "Failed to fetch USD/KRW rate from ExchangeRate API",
      stackTrace: error.stack
    });
    const fallbackRate = 1350;
    await saveExchangeRateToDB(tokenPair, fallbackRate);
    memoryCache.set(tokenPair, {
      rate: fallbackRate,
      updatedAt: Date.now()
    });
    return fallbackRate;
  }
}
async function getUSDKRWRate() {
  return await fetchUSDKRWRate();
}
async function calculateChocoFromUSD(usdAmount) {
  const chocoAmount = new BigNumber(usdAmount).dividedBy(CHOCO_PRICE_USD);
  logger.info({
    category: "PAYMENT",
    message: `Calculated CHOCO from USD: $${usdAmount} = ${chocoAmount.toString()} CHOCO`,
    metadata: { usdAmount, chocoAmount: chocoAmount.toString() }
  });
  return chocoAmount.toString();
}
async function calculateChocoFromKRW(krwAmount) {
  const usdKrwRate = await getUSDKRWRate();
  const usdAmount = new BigNumber(krwAmount).dividedBy(usdKrwRate);
  const chocoAmount = await calculateChocoFromUSD(usdAmount.toNumber());
  logger.info({
    category: "PAYMENT",
    message: `Calculated CHOCO from KRW: ${krwAmount} KRW = ${chocoAmount} CHOCO (USD/KRW: ${usdKrwRate})`,
    metadata: { krwAmount, usdKrwRate, usdAmount: usdAmount.toString(), chocoAmount }
  });
  return chocoAmount;
}
const exchangeRate_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  calculateChocoFromKRW,
  calculateChocoFromNear,
  calculateChocoFromUSD,
  getNearPriceUSD,
  getUSDKRWRate
}, Symbol.toStringTag, { value: "Module" }));
async function loader$A({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  const userId = session2.user.id;
  const [user$1, payments] = await Promise.all([db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      chocoBalance: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      subscriptionId: true,
      nearAccountId: true
    }
  }), db.query.payment.findMany({
    where: eq(payment.userId, userId),
    orderBy: [desc(payment.createdAt)],
    limit: 20
    // 최근 20개 내역
  })]);
  const history = await db.query.exchangeLog.findMany({
    where: eq(exchangeLog.userId, userId),
    orderBy: [desc(exchangeLog.createdAt)],
    limit: 20
  });
  let nearBalance = "0";
  if (user$1?.nearAccountId) {
    try {
      const near = await getNearConnection();
      const account2 = await near.account(user$1.nearAccountId);
      const balance = await account2.getAccountBalance();
      nearBalance = utils$1.format.formatNearAmount(balance.available, 3);
    } catch (e) {
      console.error("Failed to fetch NEAR balance:", e);
    }
  }
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const tossClientKey = process.env.TOSS_CLIENT_KEY;
  const nearPriceUSD = await getNearPriceUSD();
  return Response.json({
    user: user$1,
    payments,
    paypalClientId,
    tossClientKey,
    nearBalance,
    history,
    nearPriceUSD
  });
}
const subscription = UNSAFE_withComponentProps(function SubscriptionManagementPage() {
  const {
    user: user2,
    payments,
    paypalClientId,
    tossClientKey,
    nearBalance,
    history,
    nearPriceUSD
  } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const isActive = user2?.subscriptionStatus === "ACTIVE";
  const isCancelled = user2?.subscriptionStatus === "CANCELLED";
  const tier = user2?.subscriptionTier || "FREE";
  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    let dt;
    if (dateValue instanceof Date) {
      dt = DateTime.fromJSDate(dateValue);
    } else {
      dt = DateTime.fromISO(dateValue.toString());
    }
    return dt.isValid ? dt.setLocale("ko").toFormat("yyyy. MM. dd") : "-";
  };
  const handleCancelSubscription = () => {
    fetcher.submit({}, {
      method: "POST",
      action: "/api/payment/cancel-subscription"
    });
  };
  if (fetcher.data?.success && isActive) {
    toast.success("구독이 취소되었습니다.");
  } else if (fetcher.data?.error) {
    toast.error(fetcher.data.error);
  }
  const handleScanDeposits = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/wallet/check-deposit", {
        method: "POST"
      });
      if (res.ok) {
        toast.success("입금 확인 및 자동 환전이 완료되었습니다.");
        navigate(".", {
          replace: true
        });
        setSwapDialogOpen(false);
      } else {
        toast.error("확인 중 오류가 발생했습니다.");
      }
    } catch (e) {
      toast.error("서버 연결 실패");
    } finally {
      setIsScanning(false);
    }
  };
  const handleCopyAddress = async () => {
    if (!user2?.nearAccountId) return;
    try {
      await navigator.clipboard.writeText(user2.nearAccountId);
      toast.success("주소가 복사되었습니다.");
    } catch (error) {
      toast.error("복사에 실패했습니다.");
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-background-light dark:bg-background-dark text-foreground flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden",
    children: [/* @__PURE__ */ jsxs("header", {
      className: "sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between",
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => navigate(-1),
        className: "flex items-center justify-center text-white/80 hover:text-primary transition-colors size-10 rounded-full hover:bg-white/5",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-[24px]",
          children: "arrow_back_ios_new"
        })
      }), /* @__PURE__ */ jsx("h1", {
        className: "text-base font-bold tracking-tight text-white/90",
        children: "충전 및 결제 관리"
      }), /* @__PURE__ */ jsx("div", {
        className: "w-10"
      })]
    }), /* @__PURE__ */ jsxs("main", {
      className: "flex-1 p-4 space-y-6 pb-24 overflow-y-auto",
      children: [/* @__PURE__ */ jsx(WalletCard, {
        chocoBalance: user2?.chocoBalance || "0",
        nearBalance,
        nearAccountId: user2?.nearAccountId || null,
        depositDialogOpen,
        swapDialogOpen,
        historyDialogOpen,
        onDepositDialogChange: setDepositDialogOpen,
        onSwapDialogChange: setSwapDialogOpen,
        onHistoryDialogChange: setHistoryDialogOpen,
        onScanDeposits: handleScanDeposits,
        isScanning,
        history,
        onCopyAddress: handleCopyAddress,
        nearPriceUSD
      }), /* @__PURE__ */ jsxs("section", {
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-2",
          children: "현재 멤버십"
        }), /* @__PURE__ */ jsxs("div", {
          className: cn("relative rounded-2xl p-6 border overflow-hidden", isActive ? "bg-surface-dark border-primary/30" : "bg-surface-dark border-white/5"),
          children: [isActive && /* @__PURE__ */ jsx("div", {
            className: "absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"
          }), /* @__PURE__ */ jsxs("div", {
            className: "relative z-10 flex flex-col gap-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-start",
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex items-center gap-2 mb-1",
                  children: [/* @__PURE__ */ jsxs("h3", {
                    className: "text-xl font-bold text-white tracking-tight uppercase",
                    children: [tier, " PLAN"]
                  }), isActive && /* @__PURE__ */ jsx("span", {
                    className: "px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30",
                    children: "ACTIVE"
                  }), isCancelled && /* @__PURE__ */ jsx("span", {
                    className: "px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30",
                    children: "CANCELLED"
                  })]
                }), /* @__PURE__ */ jsx("div", {
                  className: "flex items-center gap-2",
                  children: /* @__PURE__ */ jsxs("div", {
                    onClick: () => setIsTopUpModalOpen(true),
                    className: "inline-flex items-center justify-center gap-1 px-4 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white text-[13px] font-extrabold tracking-tight transition-colors cursor-pointer z-20 relative shadow-lg shadow-primary/25",
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined text-[14px]",
                      children: "bolt"
                    }), /* @__PURE__ */ jsx("span", {
                      children: "CHOCO 충전하기"
                    })]
                  })
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-white/70",
                  children: tier === "ULTIMATE" ? "crown" : tier === "PREMIUM" ? "diamond" : "bolt"
                })
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "h-px bg-white/10"
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-center text-sm",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-white/60",
                children: "다음 결제일 (만료일)"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-white font-medium",
                children: formatDate(user2?.currentPeriodEnd ?? null)
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex gap-2 mt-2",
              children: [/* @__PURE__ */ jsx("button", {
                onClick: () => navigate("/pricing"),
                className: "flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10 cursor-pointer relative z-20",
                children: tier === "FREE" ? "멤버십 시작하기" : "멤버십 변경"
              }), isActive && /* @__PURE__ */ jsxs(AlertDialog, {
                children: [/* @__PURE__ */ jsx(AlertDialogTrigger, {
                  children: /* @__PURE__ */ jsx("button", {
                    className: "px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium transition-colors border border-red-500/20 cursor-pointer relative z-20",
                    children: "구독 해지"
                  })
                }), /* @__PURE__ */ jsxs(AlertDialogContent, {
                  className: "bg-surface-dark border-white/10 text-white rounded-2xl max-w-xs",
                  children: [/* @__PURE__ */ jsxs(AlertDialogHeader, {
                    children: [/* @__PURE__ */ jsx(AlertDialogTitle, {
                      children: "정말 구독을 해지하시겠습니까?"
                    }), /* @__PURE__ */ jsxs(AlertDialogDescription, {
                      className: "text-white/60",
                      children: ["구독을 해지하더라도 현재 기간이 끝날 때까지(", formatDate(user2?.currentPeriodEnd), ")는 혜택이 유지됩니다."]
                    })]
                  }), /* @__PURE__ */ jsxs(AlertDialogFooter, {
                    children: [/* @__PURE__ */ jsx(AlertDialogCancel, {
                      className: "bg-transparent border-white/10 hover:bg-white/5 text-white",
                      children: "닫기"
                    }), /* @__PURE__ */ jsx(AlertDialogAction, {
                      onClick: handleCancelSubscription,
                      className: "bg-red-600 hover:bg-red-700 text-white border-0",
                      children: "해지 확정"
                    })]
                  })]
                })]
              })]
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("section", {
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-2",
          children: "결제 내역"
        }), /* @__PURE__ */ jsx("div", {
          className: "bg-surface-dark border border-white/5 rounded-2xl overflow-hidden",
          children: payments.length === 0 ? /* @__PURE__ */ jsxs("div", {
            className: "p-8 text-center text-white/30 text-sm",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-4xl mb-2 block opacity-50",
              children: "receipt_long"
            }), "결제 내역이 없습니다."]
          }) : /* @__PURE__ */ jsx("div", {
            className: "divide-y divide-white/5",
            children: payments.map((payment2) => /* @__PURE__ */ jsxs("div", {
              className: "p-4 flex justify-between items-center hover:bg-white/5 transition-colors",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-3",
                children: [/* @__PURE__ */ jsx("div", {
                  className: cn("size-10 rounded-full flex items-center justify-center shrink-0", payment2.status === "COMPLETED" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"),
                  children: /* @__PURE__ */ jsx("span", {
                    className: "material-symbols-outlined text-[20px]",
                    children: payment2.type.includes("SUBSCRIPTION") ? "autorenew" : "payments"
                  })
                }), /* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsx("p", {
                    className: "text-sm font-bold text-white",
                    children: (payment2.description || "CHOCO Top-up").replace(/Credits/g, "CHOCO")
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-xs text-white/50",
                    children: formatDate(payment2.createdAt)
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "text-right",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-sm font-bold text-white",
                  children: payment2.amount > 0 ? `$${payment2.amount}` : "Free"
                }), /* @__PURE__ */ jsx("p", {
                  className: cn("text-[10px] font-bold uppercase", payment2.status === "COMPLETED" ? "text-green-500" : "text-red-500"),
                  children: payment2.status
                })]
              })]
            }, payment2.id))
          })
        })]
      })]
    }), /* @__PURE__ */ jsx(TokenTopUpModal, {
      open: isTopUpModalOpen,
      onOpenChange: setIsTopUpModalOpen,
      paypalClientId,
      tossClientKey
    })]
  });
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: subscription,
  loader: loader$A
}, Symbol.toStringTag, { value: "Module" }));
const saved = UNSAFE_withComponentProps(function ProfileSavedScreen() {
  return /* @__PURE__ */ jsx(ComingSoon, {
    title: "저장된 순간들",
    subtitle: "좋아요한 대화와 사진을 모아볼 수 있는 기능이 곧 추가됩니다.",
    icon: "favorite",
    iconBgColor: "bg-pink-500/20"
  });
});
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: saved
}, Symbol.toStringTag, { value: "Module" }));
async function loader$z({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, session2.user.id)
  });
  let daysTogether = 0;
  let mainCharacterName = "춘심";
  try {
    const firstConversation = await db.query.conversation.findFirst({
      where: eq(conversation.userId, session2.user.id),
      orderBy: [asc(conversation.createdAt)],
      columns: {
        createdAt: true,
        characterId: true
      }
    });
    if (firstConversation) {
      const now = DateTime.now().setZone("Asia/Seoul");
      const firstDay = DateTime.fromJSDate(firstConversation.createdAt).setZone("Asia/Seoul").startOf("day");
      const today = now.startOf("day");
      daysTogether = Math.max(0, Math.floor(today.diff(firstDay, "days").days)) + 1;
      const conversations = await db.query.conversation.findMany({
        where: eq(conversation.userId, session2.user.id),
        columns: {
          characterId: true
        }
      });
      const characterCounts = /* @__PURE__ */ new Map();
      conversations.forEach((conv) => {
        const charId = conv.characterId || "chunsim";
        characterCounts.set(charId, (characterCounts.get(charId) || 0) + 1);
      });
      let maxCount = 0;
      let mostUsedCharId = "chunsim";
      characterCounts.forEach((count2, charId) => {
        if (count2 > maxCount) {
          maxCount = count2;
          mostUsedCharId = charId;
        }
      });
      const character$1 = await db.query.character.findFirst({
        where: eq(character.id, mostUsedCharId)
      });
      if (character$1) {
        mainCharacterName = character$1.name;
      }
    }
  } catch (error) {
    console.error("Error calculating days together:", error);
  }
  const heartInventory = await db.query.userInventory.findFirst({
    where: and(eq(userInventory.userId, session2.user.id), eq(userInventory.itemId, "heart"))
  });
  const stats = {
    daysTogether,
    affinityLevel: 0,
    // 정책 정해지기 전까지 모두 0레벨
    hearts: heartInventory?.quantity || 0
  };
  let todayUsage = {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    messageCount: 0
  };
  try {
    const userConversations = await db.query.conversation.findMany({
      where: eq(conversation.userId, session2.user.id),
      columns: {
        id: true
      }
    });
    if (userConversations.length > 0) {
      const conversationIds = userConversations.map((c) => c.id);
      const userMessages = await db.query.message.findMany({
        where: and(inArray(message.conversationId, conversationIds), eq(message.role, "assistant")),
        columns: {
          id: true
        }
      });
      const messageIds = userMessages.map((m) => m.id);
      if (messageIds.length > 0) {
        const now = DateTime.now().setZone("Asia/Seoul");
        const todayStart = now.startOf("day").toJSDate();
        const tomorrowStart = now.plus({
          days: 1
        }).startOf("day").toJSDate();
        const todayExecutions = await db.query.agentExecution.findMany({
          where: and(inArray(agentExecution.messageId, messageIds), gte(agentExecution.createdAt, todayStart), lt(agentExecution.createdAt, tomorrowStart)),
          columns: {
            promptTokens: true,
            completionTokens: true,
            totalTokens: true
          }
        });
        todayUsage = todayExecutions.reduce((acc, exec) => ({
          promptTokens: acc.promptTokens + exec.promptTokens,
          completionTokens: acc.completionTokens + exec.completionTokens,
          totalTokens: acc.totalTokens + exec.totalTokens,
          messageCount: acc.messageCount + 1
        }), {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          messageCount: 0
        });
      }
    }
  } catch (error) {
    console.error("Error fetching today's token usage:", error);
  }
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const tossClientKey = process.env.TOSS_CLIENT_KEY;
  return Response.json({
    user: user$1,
    stats,
    todayUsage,
    mainCharacterName,
    paypalClientId,
    tossClientKey
  });
}
const index$7 = UNSAFE_withComponentProps(function ProfileScreen() {
  const {
    user: user2,
    stats,
    todayUsage,
    mainCharacterName,
    paypalClientId,
    tossClientKey
  } = useLoaderData();
  const navigate = useNavigate();
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isItemStoreOpen, setIsItemStoreOpen] = useState(false);
  const formatTokenCount = (count2) => {
    if (count2 >= 1e6) {
      return `${(count2 / 1e6).toFixed(1)}M`;
    }
    if (count2 >= 1e3) {
      return `${(count2 / 1e3).toFixed(1)}K`;
    }
    return count2.toString();
  };
  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("로그아웃되었습니다");
            navigate("/home");
          }
        }
      });
    } catch (err) {
      toast.error("로그아웃 중 오류가 발생했습니다");
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl overflow-hidden bg-background-light dark:bg-background-dark",
    children: [/* @__PURE__ */ jsx("div", {
      className: "absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none z-0"
    }), /* @__PURE__ */ jsxs("header", {
      className: "sticky top-0 z-50 bg-background-dark/70 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between",
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => navigate(-1),
        className: "flex items-center justify-center text-white/80 hover:text-primary transition-colors size-10 rounded-full hover:bg-white/5",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-[24px]",
          children: "arrow_back_ios_new"
        })
      }), /* @__PURE__ */ jsx("h1", {
        className: "text-base font-bold tracking-tight text-white/90",
        children: "마이페이지"
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => navigate("/settings"),
        className: "flex items-center justify-center text-white/80 hover:text-primary transition-colors size-10 rounded-full hover:bg-white/5",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-[24px]",
          children: "settings"
        })
      })]
    }), /* @__PURE__ */ jsxs("main", {
      className: "flex-1 flex flex-col z-10 pb-24",
      children: [/* @__PURE__ */ jsxs("section", {
        className: "flex flex-col items-center pt-8 pb-6 px-6",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "relative group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute -inset-1 bg-gradient-to-tr from-primary to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"
          }), /* @__PURE__ */ jsxs("div", {
            className: "relative w-28 h-28 rounded-full p-[3px] bg-background-dark",
            children: [/* @__PURE__ */ jsx("div", {
              className: "w-full h-full rounded-full bg-cover bg-center overflow-hidden border-2 border-surface-highlight",
              style: {
                backgroundImage: `url(${user2?.avatarUrl || user2?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCutVt4neD3mw-fGim_WdODfouQz3b0aaqpPfx1sNTt8N75jfKec3kNioEoZugl2D0eqVP5833PF21_hTqlDz38aVNUICprwHAM45vTdJeUPcA0mj_wzSgkMVSzYiv-RCJhNyAAZ0RlWSJQxzSa8Mi-yYPu-czB9WEbQsDFEjcAQwezmcZqtAbSB5bwyRhTTfr1y2rrxDHIFNN2G2fVmkHcCWo7uvVNjtAehxS8fgGKMbJgQ59q1ClGgD--3EuZR6f_esg0NbdGCao"})`
              }
            }), /* @__PURE__ */ jsx("button", {
              className: "absolute bottom-0 right-0 p-2 bg-surface-highlight border-4 border-background-dark rounded-full text-white hover:bg-primary transition-colors shadow-lg",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[16px] block",
                children: "edit"
              })
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "mt-4 text-center",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-2xl font-bold tracking-tight text-white mb-1",
            children: user2?.name || "사용자"
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex flex-wrap gap-2 justify-center items-center mt-2",
            children: [/* @__PURE__ */ jsxs("span", {
              className: "inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[14px]",
                children: "favorite"
              }), mainCharacterName, "'s Fan"]
            }), /* @__PURE__ */ jsxs("span", {
              className: "inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[14px]",
                style: {
                  fontVariationSettings: "'FILL' 1"
                },
                children: "diamond"
              }), "Lv. ", stats.affinityLevel, " Soulmate"]
            })]
          }), /* @__PURE__ */ jsxs("p", {
            className: "text-white/60 text-sm mt-3 px-4 line-clamp-2",
            children: ['"오늘도 ', mainCharacterName, '와 함께 힘내자! 🌙✨"']
          })]
        })]
      }), /* @__PURE__ */ jsxs("section", {
        className: "px-4 mb-6 space-y-4",
        children: [/* @__PURE__ */ jsx("div", {
          className: "bg-surface-dark/50 border border-white/5 rounded-2xl p-4 backdrop-blur-sm",
          children: /* @__PURE__ */ jsxs("div", {
            className: "grid grid-cols-3 divide-x divide-white/10",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex flex-col items-center gap-1 px-2",
              children: [/* @__PURE__ */ jsxs("span", {
                className: "text-2xl font-bold text-white tracking-tight",
                children: [stats.daysTogether, "일"]
              }), /* @__PURE__ */ jsx("span", {
                className: "text-xs text-white/50 font-medium",
                children: "함께한 날"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex flex-col items-center gap-1 px-2",
              children: [/* @__PURE__ */ jsxs("span", {
                className: "text-2xl font-bold text-primary tracking-tight",
                children: ["Lv.", stats.affinityLevel]
              }), /* @__PURE__ */ jsx("span", {
                className: "text-xs text-white/50 font-medium",
                children: "친밀도"
              })]
            }), /* @__PURE__ */ jsxs("button", {
              onClick: () => setIsItemStoreOpen(true),
              className: "flex flex-col items-center gap-1 px-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer py-1 -my-1",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-2xl font-bold text-white tracking-tight",
                children: stats.hearts >= 1e3 ? `${(stats.hearts / 1e3).toFixed(1)}k` : stats.hearts
              }), /* @__PURE__ */ jsxs("span", {
                className: "text-xs text-white/50 font-medium flex items-center gap-1",
                children: ["보유 하트", /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[10px] text-primary",
                  children: "add_circle"
                })]
              })]
            })]
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-surface-dark/50 border border-white/5 rounded-2xl p-4 backdrop-blur-sm",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between mb-3",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-sm font-semibold text-white/90",
              children: "오늘 사용량"
            }), /* @__PURE__ */ jsx("span", {
              className: "text-xs text-white/50",
              children: (/* @__PURE__ */ new Date()).toLocaleDateString("ko-KR", {
                month: "short",
                day: "numeric"
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "grid grid-cols-2 gap-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex flex-col gap-1",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[18px] text-blue-400",
                  children: "speed"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-lg font-bold text-white tracking-tight",
                  children: formatTokenCount(todayUsage.totalTokens)
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "text-xs text-white/50 font-medium ml-7",
                children: "총 토큰"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex flex-col gap-1",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[18px] text-green-400",
                  children: "chat_bubble"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-lg font-bold text-white tracking-tight",
                  children: todayUsage.messageCount
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "text-xs text-white/50 font-medium ml-7",
                children: "메시지 수"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-xs",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-white/60",
                children: "입력 토큰"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-white/90 font-medium",
                children: formatTokenCount(todayUsage.promptTokens)
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-white/60",
                children: "출력 토큰"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-white/90 font-medium",
                children: formatTokenCount(todayUsage.completionTokens)
              })]
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4 space-y-6",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-2",
            children: "계정 관리"
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-surface-dark border border-white/5 rounded-2xl overflow-hidden",
            children: [/* @__PURE__ */ jsxs("button", {
              onClick: () => navigate("/profile/edit"),
              className: "w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex items-center justify-center shrink-0 size-10 rounded-xl bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined",
                  children: "badge"
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1 min-w-0",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-base font-semibold text-white truncate",
                  children: "프로필 수정"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-white/50 truncate",
                  children: "닉네임, 상태메시지 변경"
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white/30",
                children: "chevron_right"
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "h-px bg-white/5 mx-4"
            }), /* @__PURE__ */ jsxs("button", {
              onClick: () => navigate("/pricing"),
              className: "w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex items-center justify-center shrink-0 size-10 rounded-xl bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined",
                  children: "diamond"
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1 min-w-0",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-base font-semibold text-white truncate",
                  children: "멤버십 업그레이드"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-white/50 truncate",
                  children: "더 높은 등급의 혜택 받기"
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white/30",
                children: "chevron_right"
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "h-px bg-white/5 mx-4"
            }), /* @__PURE__ */ jsxs("button", {
              onClick: () => navigate("/profile/subscription"),
              className: "w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex items-center justify-center shrink-0 size-10 rounded-xl bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined",
                  children: "credit_card"
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1 min-w-0",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-base font-semibold text-white truncate",
                  children: "충전 및 결제 관리"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-white/50 truncate",
                  children: "CHOCO 충전 및 사용 내역"
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white/30",
                children: "chevron_right"
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-2",
            children: "나의 활동"
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-surface-dark border border-white/5 rounded-2xl overflow-hidden",
            children: [/* @__PURE__ */ jsxs("button", {
              onClick: () => navigate("/profile/saved"),
              className: "w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex items-center justify-center shrink-0 size-10 rounded-xl bg-pink-500/20 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined",
                  children: "favorite"
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1 min-w-0",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-base font-semibold text-white truncate",
                  children: "저장된 순간들"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-white/50 truncate",
                  children: "좋아요한 대화 및 사진"
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white/30",
                children: "chevron_right"
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "h-px bg-white/5 mx-4"
            }), /* @__PURE__ */ jsxs("button", {
              onClick: () => navigate("/chats"),
              className: "w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex items-center justify-center shrink-0 size-10 rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined",
                  children: "history"
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1 min-w-0",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-base font-semibold text-white truncate",
                  children: "대화 기록"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-white/50 truncate",
                  children: "지난 대화 다시보기"
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white/30",
                children: "chevron_right"
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "h-px bg-white/5 mx-4"
            }), /* @__PURE__ */ jsxs("button", {
              onClick: () => navigate("/settings"),
              className: "w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex items-center justify-center shrink-0 size-10 rounded-xl bg-teal-500/20 text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined",
                  children: "notifications"
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1 min-w-0",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-base font-semibold text-white truncate",
                  children: "알림 설정"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-white/50 truncate",
                  children: "캐릭터 메시지 알림"
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white/30",
                children: "chevron_right"
              })]
            })]
          })]
        }), /* @__PURE__ */ jsx("button", {
          onClick: handleLogout,
          className: "w-full py-4 text-center text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors",
          children: "로그아웃"
        })]
      })]
    }), /* @__PURE__ */ jsx(BottomNavigation, {}), /* @__PURE__ */ jsx(TokenTopUpModal, {
      open: isTopUpModalOpen,
      onOpenChange: setIsTopUpModalOpen,
      paypalClientId
    }), /* @__PURE__ */ jsx(ItemStoreModal, {
      open: isItemStoreOpen,
      onOpenChange: setIsItemStoreOpen,
      itemId: "heart",
      paypalClientId,
      tossClientKey
    })]
  });
});
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$7,
  loader: loader$z
}, Symbol.toStringTag, { value: "Module" }));
function SettingsItem({
  icon,
  iconBgColor,
  label,
  onClick,
  href,
  rightElement,
  className
}) {
  const content = /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex items-center gap-4 p-4 min-h-14 justify-between border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
        href || onClick ? "cursor-pointer group" : "",
        className
      ),
      onClick,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "text-white flex items-center justify-center rounded-full shrink-0 size-8",
                iconBgColor
              ),
              children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px]", children: icon })
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-slate-900 dark:text-white text-base font-medium flex-1 truncate", children: label })
        ] }),
        rightElement || (href || onClick ? /* @__PURE__ */ jsx("div", { className: "shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors", children: /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[20px]", children: "chevron_right" }) }) : null)
      ]
    }
  );
  if (href) {
    return /* @__PURE__ */ jsx(Link, { to: href, children: content });
  }
  return content;
}
function SettingsToggle({
  checked,
  onChange,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "label",
    {
      className: cn(
        "relative flex h-[30px] w-[50px] cursor-pointer items-center rounded-full border-none bg-slate-200 dark:bg-slate-700 p-1 transition-colors duration-200",
        checked && "justify-end bg-primary",
        className
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-all duration-200" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked,
            onChange: (e) => onChange(e.target.checked),
            className: "invisible absolute"
          }
        )
      ]
    }
  );
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    Input$1,
    {
      type,
      "data-slot": "input",
      className: cn(
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
async function loader$y({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, session2.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      nearAccountId: true,
      chocoBalance: true
      // CHOCO Balance from DB
    }
  });
  return Response.json({
    user: user$1
  });
}
const settings = UNSAFE_withComponentProps(function SettingsScreen() {
  const {
    user: user2
  } = useLoaderData();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [exportWalletDialogOpen, setExportWalletDialogOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState(null);
  const [isLoadingPrivateKey, setIsLoadingPrivateKey] = useState(false);
  const [exportError, setExportError] = useState(null);
  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("로그아웃되었습니다");
            navigate("/home");
          }
        }
      });
    } catch (err) {
      toast.error("로그아웃 중 오류가 발생했습니다");
    }
  };
  const handleDeleteAccount = () => {
    toast.error("계정이 삭제되었습니다");
    setDeleteAccountDialogOpen(false);
  };
  const handleExportWallet = async () => {
    setIsLoadingPrivateKey(true);
    setExportError(null);
    setPrivateKey(null);
    try {
      const response = await fetch("/api/wallet/export-private-key");
      const data2 = await response.json();
      if (!response.ok) {
        setExportError(data2.message || data2.error || "프라이빗 키를 가져오는데 실패했습니다.");
        return;
      }
      setPrivateKey(data2.privateKey);
      toast.success("프라이빗 키를 불러왔습니다. 안전하게 보관하세요.");
    } catch (error) {
      setExportError(error.message || "프라이빗 키를 가져오는데 실패했습니다.");
    } finally {
      setIsLoadingPrivateKey(false);
    }
  };
  const handleCopyPrivateKey = async () => {
    if (!privateKey) return;
    try {
      await navigator.clipboard.writeText(privateKey);
      toast.success("프라이빗 키가 클립보드에 복사되었습니다.");
    } catch (error) {
      toast.error("복사에 실패했습니다.");
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen selection:bg-primary selection:text-white",
    children: [/* @__PURE__ */ jsxs("div", {
      className: "relative flex h-full w-full flex-col max-w-md mx-auto overflow-x-hidden min-h-screen pb-20 md:max-w-lg lg:max-w-xl",
      children: [/* @__PURE__ */ jsxs("header", {
        className: "sticky top-0 z-50 flex items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md p-4 justify-between border-b border-black/5 dark:border-white/5 transition-colors duration-300",
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => navigate(-1),
          className: "text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-[24px]",
            children: "arrow_back_ios_new"
          })
        }), /* @__PURE__ */ jsx("h2", {
          className: "text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10",
          children: "설정"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "p-4 mt-2",
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-sm dark:shadow-none border border-black/5 dark:border-white/5",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "relative shrink-0",
            children: [/* @__PURE__ */ jsx("div", {
              className: "bg-center bg-no-repeat bg-cover rounded-full h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark",
              style: {
                backgroundImage: `url(${user2?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCOz-ycctcRpqXk1y01dxqgp0snDjlfF-joCqG0CVQPw5ohSzu3AvTGunT5CJLn6jmmUrArbyvkZSfww_OY_DP6G1W69xzLPTJTsc3r4Cmmd_Y5upAGheZxCFXb-xlEiEMfR-C-lpw_3w8__RfjC2KevhMzQ8yYvdGnQgQpeQO8AoXgoQbbTmgFbxUFXr44lp-xfW1fL6RQTF-TkByk5PyDtvGVJ8H67dkeCltLiiTpvG9jjjrCReyH8mEAkCAm8q3TqLOz2S-vAWk"})`
              }
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute bottom-0 right-0 bg-primary rounded-full p-1 border border-white dark:border-background-dark flex items-center justify-center",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white text-[12px]",
                children: "edit"
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col justify-center flex-1 min-w-0",
            children: [/* @__PURE__ */ jsx("p", {
              className: "text-slate-900 dark:text-white text-lg font-bold leading-tight truncate",
              children: user2?.name || "사용자"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-primary text-sm font-medium leading-normal truncate",
              children: user2?.id?.includes("-") ? "VVIP 팬 멤버십" : "Basic Member"
            })]
          })]
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4 pt-2 pb-2",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 pb-2",
          children: "앱 설정"
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5",
          children: [/* @__PURE__ */ jsx(SettingsItem, {
            icon: "notifications",
            iconBgColor: "bg-orange-400",
            label: "알림 설정",
            rightElement: /* @__PURE__ */ jsx(SettingsToggle, {
              checked: notificationsEnabled,
              onChange: setNotificationsEnabled
            })
          }), /* @__PURE__ */ jsx(SettingsItem, {
            icon: "dark_mode",
            iconBgColor: "bg-indigo-500",
            label: "다크 모드",
            rightElement: /* @__PURE__ */ jsx(SettingsToggle, {
              checked: darkModeEnabled,
              onChange: setDarkModeEnabled
            })
          }), /* @__PURE__ */ jsx(SettingsItem, {
            icon: "chat_bubble",
            iconBgColor: "bg-green-500",
            label: "채팅 화면 설정",
            href: "/settings/chat"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4 pt-4 pb-2",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 pb-2",
          children: "고급설정 (Advanced)"
        }), /* @__PURE__ */ jsx("div", {
          className: "flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5",
          children: /* @__PURE__ */ jsxs(Dialog, {
            open: exportWalletDialogOpen,
            onOpenChange: setExportWalletDialogOpen,
            children: [/* @__PURE__ */ jsxs("button", {
              onClick: () => setExportWalletDialogOpen(true),
              className: "flex items-center gap-4 p-4 min-h-14 justify-between border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full text-left",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-3",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "text-slate-500 flex items-center justify-center rounded-full bg-slate-100 shrink-0 size-8",
                  children: /* @__PURE__ */ jsx(Wallet, {
                    className: "w-4 h-4"
                  })
                }), /* @__PURE__ */ jsx("div", {
                  className: "flex flex-col",
                  children: /* @__PURE__ */ jsx("p", {
                    className: "text-slate-900 dark:text-white text-base font-medium",
                    children: "지갑 키 관리"
                  })
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-slate-400 dark:text-slate-500",
                children: "chevron_right"
              })]
            }), /* @__PURE__ */ jsxs(DialogContent, {
              className: "max-w-md",
              children: [/* @__PURE__ */ jsxs(DialogHeader, {
                children: [/* @__PURE__ */ jsx(DialogTitle, {
                  children: "지갑 내보내기"
                }), /* @__PURE__ */ jsx(DialogDescription, {
                  children: "지갑의 프라이빗 키를 확인하고 내보낼 수 있습니다."
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-4",
                children: [user2?.nearAccountId && /* @__PURE__ */ jsxs("div", {
                  className: "p-3 bg-slate-100 dark:bg-slate-800 rounded-lg",
                  children: [/* @__PURE__ */ jsx("p", {
                    className: "text-xs text-slate-500 dark:text-slate-400 mb-1",
                    children: "지갑 주소"
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-sm font-mono text-slate-900 dark:text-white break-all",
                    children: user2.nearAccountId
                  })]
                }), /* @__PURE__ */ jsx("div", {
                  className: "p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex items-start gap-2",
                    children: [/* @__PURE__ */ jsx(AlertTriangle, {
                      className: "h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                    }), /* @__PURE__ */ jsxs("div", {
                      className: "flex-1",
                      children: [/* @__PURE__ */ jsx("h4", {
                        className: "text-sm font-semibold text-red-900 dark:text-red-100 mb-1",
                        children: "보안 경고"
                      }), /* @__PURE__ */ jsx("p", {
                        className: "text-xs text-red-800 dark:text-red-200",
                        children: "프라이빗 키는 극비 정보입니다. 절대 공유하지 마시고, 안전한 곳에 보관하세요. 누군가 이 키를 알게 되면 지갑의 모든 자산을 제어할 수 있습니다."
                      })]
                    })]
                  })
                }), !privateKey && !isLoadingPrivateKey && !exportError && /* @__PURE__ */ jsx(Button, {
                  onClick: handleExportWallet,
                  className: "w-full",
                  variant: "outline",
                  children: "프라이빗 키 불러오기"
                }), isLoadingPrivateKey && /* @__PURE__ */ jsx("div", {
                  className: "text-center py-4",
                  children: /* @__PURE__ */ jsx("p", {
                    className: "text-sm text-slate-500 dark:text-slate-400",
                    children: "프라이빗 키를 불러오는 중..."
                  })
                }), exportError && /* @__PURE__ */ jsx("div", {
                  className: "p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex items-start gap-2",
                    children: [/* @__PURE__ */ jsx(AlertTriangle, {
                      className: "h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                    }), /* @__PURE__ */ jsxs("div", {
                      className: "flex-1",
                      children: [/* @__PURE__ */ jsx("h4", {
                        className: "text-sm font-semibold text-red-900 dark:text-red-100 mb-1",
                        children: "오류"
                      }), /* @__PURE__ */ jsx("p", {
                        className: "text-xs text-red-800 dark:text-red-200",
                        children: exportError
                      })]
                    })]
                  })
                }), privateKey && /* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [/* @__PURE__ */ jsx("label", {
                      className: "text-sm font-medium text-slate-900 dark:text-white",
                      children: "프라이빗 키"
                    }), /* @__PURE__ */ jsxs(Button, {
                      onClick: handleCopyPrivateKey,
                      size: "sm",
                      variant: "outline",
                      className: "h-7",
                      children: [/* @__PURE__ */ jsx(Copy, {
                        className: "w-3 h-3 mr-1"
                      }), "복사"]
                    })]
                  }), /* @__PURE__ */ jsx(Input, {
                    type: "text",
                    value: privateKey,
                    readOnly: true,
                    className: "font-mono text-xs"
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-xs text-slate-500 dark:text-slate-400",
                    children: "프라이빗 키를 복사하여 안전한 곳에 보관하세요. 다른 지갑으로 자산을 옮기려면 이 키를 사용할 수 있습니다."
                  })]
                })]
              }), /* @__PURE__ */ jsx(DialogFooter, {
                children: /* @__PURE__ */ jsx(Button, {
                  variant: "outline",
                  onClick: () => {
                    setExportWalletDialogOpen(false);
                    setPrivateKey(null);
                    setExportError(null);
                  },
                  children: "닫기"
                })
              })]
            })]
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4 pt-4 pb-2",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 pb-2",
          children: "개인정보 및 보안"
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5",
          children: [/* @__PURE__ */ jsx(SettingsItem, {
            icon: "lock",
            iconBgColor: "bg-blue-500",
            label: "개인정보 처리방침",
            href: "/privacy"
          }), /* @__PURE__ */ jsx(SettingsItem, {
            icon: "block",
            iconBgColor: "bg-rose-500",
            label: "차단 관리",
            href: "/settings/blocked"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4 pt-4 pb-2",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 pb-2",
          children: "지원"
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5",
          children: [/* @__PURE__ */ jsx(SettingsItem, {
            icon: "help",
            iconBgColor: "bg-slate-500",
            label: "도움말 / FAQ",
            href: "/help"
          }), /* @__PURE__ */ jsx(SettingsItem, {
            icon: "info",
            iconBgColor: "bg-teal-500",
            label: "오픈소스 라이선스",
            href: "/license"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "px-4 pt-4 pb-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5",
          children: [/* @__PURE__ */ jsxs(Dialog, {
            open: logoutDialogOpen,
            onOpenChange: setLogoutDialogOpen,
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => setLogoutDialogOpen(true),
              className: "flex items-center gap-4 p-4 min-h-14 justify-between border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full text-left",
              children: /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-3",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "text-primary flex items-center justify-center rounded-full bg-primary/10 shrink-0 size-8",
                  children: /* @__PURE__ */ jsx("span", {
                    className: "material-symbols-outlined text-[18px]",
                    children: "logout"
                  })
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-primary text-base font-medium flex-1 truncate",
                  children: "로그아웃"
                })]
              })
            }), /* @__PURE__ */ jsxs(DialogContent, {
              children: [/* @__PURE__ */ jsxs(DialogHeader, {
                children: [/* @__PURE__ */ jsx(DialogTitle, {
                  children: "로그아웃"
                }), /* @__PURE__ */ jsx(DialogDescription, {
                  children: "정말 로그아웃하시겠습니까?"
                })]
              }), /* @__PURE__ */ jsxs(DialogFooter, {
                children: [/* @__PURE__ */ jsx(Button, {
                  variant: "outline",
                  onClick: () => setLogoutDialogOpen(false),
                  children: "취소"
                }), /* @__PURE__ */ jsx(Button, {
                  onClick: handleLogout,
                  variant: "destructive",
                  children: "로그아웃"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs(Dialog, {
            open: deleteAccountDialogOpen,
            onOpenChange: setDeleteAccountDialogOpen,
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => setDeleteAccountDialogOpen(true),
              className: "flex items-center gap-4 p-4 min-h-14 justify-between border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full text-left",
              children: /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-3",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "text-slate-400 dark:text-slate-500 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 size-8",
                  children: /* @__PURE__ */ jsx("span", {
                    className: "material-symbols-outlined text-[18px]",
                    children: "person_off"
                  })
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-red-500 dark:text-red-400 text-base font-medium flex-1 truncate",
                  children: "계정 탈퇴"
                })]
              })
            }), /* @__PURE__ */ jsxs(DialogContent, {
              children: [/* @__PURE__ */ jsxs(DialogHeader, {
                children: [/* @__PURE__ */ jsx(DialogTitle, {
                  children: "계정 삭제"
                }), /* @__PURE__ */ jsx(DialogDescription, {
                  children: '계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다. 탈퇴 전에 대화·기억 데이터를 보관하려면 프로필 또는 채팅 설정에서 "컨텍스트 내보내기"를 이용해 주세요. 정말 계정을 삭제하시겠습니까?'
                })]
              }), /* @__PURE__ */ jsxs(DialogFooter, {
                children: [/* @__PURE__ */ jsx(Button, {
                  variant: "outline",
                  onClick: () => setDeleteAccountDialogOpen(false),
                  children: "취소"
                }), /* @__PURE__ */ jsx(Button, {
                  onClick: handleDeleteAccount,
                  variant: "destructive",
                  children: "계정 삭제"
                })]
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("p", {
          className: "text-center text-slate-400 dark:text-slate-600 text-xs mt-6",
          children: ["버전 1.2.0 (Build 302)", /* @__PURE__ */ jsx("br", {}), "© 2024 AI Idol Chat Corp."]
        })]
      })]
    }), /* @__PURE__ */ jsx(BottomNavigation, {})]
  });
});
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: settings,
  loader: loader$y
}, Symbol.toStringTag, { value: "Module" }));
const testWallet = UNSAFE_withComponentProps(function TestWalletPage() {
  const fetcher = useFetcher();
  const [result, setResult] = useState(null);
  const handleCheck = async () => {
    const res = await fetch("/api/test-wallet");
    const data2 = await res.json();
    setResult(data2);
  };
  const handleCreate = async () => {
    const res = await fetch("/api/test-wallet", {
      method: "POST"
    });
    const data2 = await res.json();
    setResult(data2);
    if (data2.success) {
      setTimeout(() => handleCheck(), 1e3);
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "p-10 max-w-4xl mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "text-2xl font-bold mb-6",
      children: "NEAR 지갑 생성 테스트"
    }), /* @__PURE__ */ jsxs("div", {
      className: "space-y-4 mb-6",
      children: [/* @__PURE__ */ jsx("button", {
        onClick: handleCheck,
        className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
        children: "현재 지갑 상태 확인 (GET)"
      }), /* @__PURE__ */ jsx("button", {
        onClick: handleCreate,
        disabled: fetcher.state === "submitting",
        className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4",
        children: fetcher.state === "submitting" ? "생성 중..." : "지갑 생성 시도 (POST)"
      })]
    }), result && /* @__PURE__ */ jsxs("div", {
      className: "bg-gray-800 p-6 rounded-lg",
      children: [/* @__PURE__ */ jsx("h2", {
        className: "text-lg font-semibold mb-4",
        children: "결과:"
      }), /* @__PURE__ */ jsx("pre", {
        className: "text-sm overflow-auto",
        children: JSON.stringify(result, null, 2)
      })]
    }), /* @__PURE__ */ jsxs("div", {
      className: "mt-8 p-4 bg-yellow-900/20 border border-yellow-600 rounded",
      children: [/* @__PURE__ */ jsx("h3", {
        className: "font-semibold mb-2",
        children: "중요:"
      }), /* @__PURE__ */ jsxs("p", {
        className: "text-sm",
        children: ["지갑 생성 로그는 ", /* @__PURE__ */ jsx("strong", {
          children: "서버 터미널"
        }), "에서 확인할 수 있습니다.", /* @__PURE__ */ jsx("br", {}), '"지갑 생성 시도" 버튼을 클릭한 후, ', /* @__PURE__ */ jsx("code", {
          children: "npm run dev"
        }), "를 실행한 터미널 창을 확인하세요.", /* @__PURE__ */ jsx("br", {}), /* @__PURE__ */ jsx("code", {
          className: "text-xs",
          children: "[Wallet] Creating invisible wallet..."
        }), " 또는 ", /* @__PURE__ */ jsx("code", {
          className: "text-xs",
          children: "[Wallet] Failed to create wallet..."
        }), " 메시지가 나타납니다."]
      })]
    })]
  });
});
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: testWallet
}, Symbol.toStringTag, { value: "Module" }));
async function loader$x({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  const userId = session2?.user?.id;
  const characterId = params.id || "chunsim";
  const character$1 = await db.query.character.findFirst({
    where: eq(character.id, characterId),
    with: {
      media: {
        orderBy: [asc(characterMedia.sortOrder)]
      },
      stats: true
    }
  });
  if (!character$1) {
    throw new Response("Character not found", {
      status: 404
    });
  }
  character$1.stats;
  let myContribution = 0;
  if (userId) {
    const result = await db.select({
      totalAmount: sql`sum(${giftLog.amount})`
    }).from(giftLog).where(and(
      eq(giftLog.fromUserId, userId),
      eq(giftLog.toCharacterId, characterId),
      eq(giftLog.itemId, "heart")
      // Assuming hearts are the main affinity metric
    ));
    myContribution = result[0]?.totalAmount || 0;
  }
  const affinityValue = Math.min(100, Math.floor(myContribution / 10));
  const fandomLevelValue = Math.floor(Math.sqrt(myContribution)) + 1;
  return {
    character: character$1,
    myContribution,
    affinityValue,
    fandomLevelValue
  };
}
const $id = UNSAFE_withComponentProps(function CharacterProfileScreen() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    character: character2,
    myContribution,
    affinityValue,
    fandomLevelValue
  } = useLoaderData();
  const [activeTab, setActiveTab] = useState("about");
  const [isFavorite, setIsFavorite] = useState(true);
  const displayChar = {
    id: character2.id,
    name: character2.name,
    role: character2.role,
    relationship: fandomLevelValue > 10 ? "Close Friend" : "Fan",
    affinity: `${affinityValue}%`,
    fandomLevel: `Lv. ${fandomLevelValue}`,
    intro: character2.bio,
    backstory: character2.bio,
    personalityTraits: [{
      icon: "sentiment_satisfied",
      color: "text-yellow-500",
      label: "#Cheerful"
    }, {
      icon: "volunteer_activism",
      color: "text-pink-500",
      label: "#Empathetic"
    }, {
      icon: "music_note",
      color: "text-purple-500",
      label: "#Musical"
    }, {
      icon: "nightlight",
      color: "text-blue-400",
      label: "#NightOwl"
    }],
    interests: [{
      icon: "headphones",
      label: "Music",
      sublabel: "Favorite",
      color: "bg-blue-500/10 text-blue-500"
    }, {
      icon: "favorite",
      label: "Fans",
      sublabel: "Loved",
      color: "bg-pink-500/10 text-pink-500"
    }],
    // Priority: 1. COVER (Main), 2. AVATAR (Main), 3. First available image
    heroImage: character2.media?.find((m) => m.type === "COVER")?.url || character2.media?.find((m) => m.type === "AVATAR")?.url || character2.media?.[0]?.url
  };
  const handleMessage = async () => {
    try {
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          characterId: displayChar.id
        })
      });
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to create or get conversation");
      }
      const data2 = await response.json();
      if (data2.conversationId) {
        navigate(`/chat/${data2.conversationId}`);
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display selection:bg-primary selection:text-white antialiased overflow-x-hidden min-h-screen max-w-md mx-auto relative pb-24",
    children: [/* @__PURE__ */ jsxs("nav", {
      className: "fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent max-w-md mx-auto",
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => navigate(-1),
        className: "flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition hover:bg-black/40 active:scale-95",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined",
          children: "arrow_back"
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex gap-3",
        children: [/* @__PURE__ */ jsx("button", {
          className: "flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white transition hover:bg-black/40 active:scale-95",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined",
            children: "share"
          })
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => setIsFavorite(!isFavorite),
          className: "flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-primary transition hover:bg-black/40 active:scale-95",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined",
            style: {
              fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0"
            },
            children: "favorite"
          })
        })]
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "relative w-full h-[55vh] min-h-[400px]",
      children: /* @__PURE__ */ jsx("div", {
        className: "absolute inset-0 bg-cover bg-center bg-no-repeat",
        style: {
          backgroundImage: `url('${displayChar.heroImage}')`
        },
        children: /* @__PURE__ */ jsx("div", {
          className: "absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"
        })
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "relative -mt-16 z-10 w-full bg-background-light dark:bg-background-dark rounded-t-2xl px-5 pt-8 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
      children: [/* @__PURE__ */ jsx("div", {
        className: "absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"
      }), /* @__PURE__ */ jsxs("div", {
        className: "absolute top-0 right-5 -translate-y-1/2 bg-surface-dark border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 shadow-lg",
        children: [/* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-pink-500 text-sm",
          children: "favorite"
        }), /* @__PURE__ */ jsxs("span", {
          className: "text-white text-xs font-bold",
          children: [(character2.stats?.totalHearts || 0).toLocaleString(), " Hearts"]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-start mb-4",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-3xl font-bold text-gray-900 dark:text-white mb-1",
            children: displayChar.name
          }), /* @__PURE__ */ jsx("p", {
            className: "text-primary font-medium text-sm tracking-wide uppercase",
            children: displayChar.role
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-primary text-[16px]",
            style: {
              fontVariationSettings: "'FILL' 1"
            },
            children: "favorite"
          }), /* @__PURE__ */ jsx("span", {
            className: "text-xs font-bold text-primary",
            children: displayChar.relationship
          })]
        })]
      }), /* @__PURE__ */ jsxs("p", {
        className: "text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 font-body",
        children: ['"', displayChar.intro, '"']
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-3 gap-4 mb-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5",
          children: [/* @__PURE__ */ jsx("span", {
            className: "text-xl font-bold text-gray-900 dark:text-white",
            children: displayChar.affinity
          }), /* @__PURE__ */ jsx("span", {
            className: "text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1",
            children: "Affinity"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5",
          children: [/* @__PURE__ */ jsx("span", {
            className: "text-xl font-bold text-gray-900 dark:text-white",
            children: displayChar.fandomLevel
          }), /* @__PURE__ */ jsx("span", {
            className: "text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1",
            children: "Fandom"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 cursor-pointer hover:border-primary/50 transition bg-gradient-to-br from-primary/5 to-transparent",
          children: [/* @__PURE__ */ jsx("span", {
            className: "text-xl font-bold text-primary",
            children: myContribution.toLocaleString()
          }), /* @__PURE__ */ jsx("span", {
            className: "text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1",
            children: "My Hearts"
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3",
          children: "Personality Traits"
        }), /* @__PURE__ */ jsx("div", {
          className: "flex flex-wrap gap-2",
          children: displayChar.personalityTraits.map((trait, index2) => /* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 shadow-sm",
            children: [/* @__PURE__ */ jsx("span", {
              className: cn("material-symbols-outlined text-[18px]", trait.color),
              children: trait.icon
            }), /* @__PURE__ */ jsx("span", {
              className: "text-xs font-medium dark:text-gray-200",
              children: trait.label
            })]
          }, index2))
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "border-b border-gray-200 dark:border-white/10 mb-6",
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex gap-6",
          children: [/* @__PURE__ */ jsx("button", {
            onClick: () => setActiveTab("about"),
            className: cn("pb-3 text-sm transition", activeTab === "about" ? "font-bold text-primary border-b-2 border-primary" : "font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"),
            children: "About"
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setActiveTab("voice"),
            className: cn("pb-3 text-sm transition", activeTab === "voice" ? "font-bold text-primary border-b-2 border-primary" : "font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"),
            children: "Voice"
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setActiveTab("gallery"),
            className: cn("pb-3 text-sm transition", activeTab === "gallery" ? "font-bold text-primary border-b-2 border-primary" : "font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"),
            children: "Gallery"
          })]
        })
      }), activeTab === "about" && /* @__PURE__ */ jsxs("div", {
        className: "space-y-6",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-lg font-bold text-gray-900 dark:text-white mb-2",
            children: "Backstory"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-body whitespace-pre-line",
            children: displayChar.backstory
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "p-4 rounded-xl bg-gradient-to-r from-surface-dark to-background-dark border border-white/5 relative overflow-hidden group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition",
            children: /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-white text-6xl",
              children: "graphic_eq"
            })
          }), /* @__PURE__ */ jsx("h4", {
            className: "text-sm font-semibold text-white mb-1",
            children: "Morning Greeting"
          }), /* @__PURE__ */ jsxs("p", {
            className: "text-xs text-gray-400 mb-3",
            children: ["0:12 • Listen to ", displayChar.name, "'s voice"]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-3",
            children: [/* @__PURE__ */ jsx("button", {
              className: "w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg hover:scale-105 transition",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[20px] ml-0.5",
                children: "play_arrow"
              })
            }), /* @__PURE__ */ jsx("div", {
              className: "h-1 flex-1 bg-gray-700 rounded-full overflow-hidden",
              children: /* @__PURE__ */ jsx("div", {
                className: "h-full w-1/3 bg-primary rounded-full"
              })
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-lg font-bold text-gray-900 dark:text-white mb-3",
            children: "Interests"
          }), /* @__PURE__ */ jsx("div", {
            className: "grid grid-cols-2 gap-3",
            children: displayChar.interests.map((interest, index2) => /* @__PURE__ */ jsxs("div", {
              className: "p-3 rounded-lg bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 flex items-center gap-3",
              children: [/* @__PURE__ */ jsx("div", {
                className: cn("w-10 h-10 rounded-lg flex items-center justify-center", interest.color.replace(" text-", " ")),
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined",
                  children: interest.icon
                })
              }), /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-sm font-semibold dark:text-white",
                  children: interest.label
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-[10px] text-gray-500",
                  children: interest.sublabel
                })]
              })]
            }, index2))
          })]
        }), /* @__PURE__ */ jsx("div", {
          className: "h-12"
        })]
      }), activeTab === "voice" && /* @__PURE__ */ jsx("div", {
        className: "text-gray-400 text-sm italic py-10",
        children: "Voice samples coming soon..."
      }), activeTab === "gallery" && /* @__PURE__ */ jsx("div", {
        className: "text-gray-400 text-sm italic py-10",
        children: "Gallery coming soon..."
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "fixed bottom-0 left-0 right-0 p-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 z-40 max-w-md mx-auto",
      children: /* @__PURE__ */ jsxs("div", {
        className: "max-w-md mx-auto flex gap-3",
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: handleMessage,
          className: "flex-1 flex items-center justify-center gap-2 h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary/30 animate-glow transition transform active:scale-95",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined",
            children: "chat_bubble"
          }), "Message ", displayChar.name]
        }), /* @__PURE__ */ jsx("button", {
          className: "w-14 h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-400 hover:text-primary transition active:scale-95",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined",
            children: "videocam"
          })
        })]
      })
    })]
  });
});
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $id,
  loader: loader$x
}, Symbol.toStringTag, { value: "Module" }));
async function action$F({
  request
}) {
  return auth.handler(request);
}
async function loader$w({
  request
}) {
  return auth.handler(request);
}
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$F,
  loader: loader$w
}, Symbol.toStringTag, { value: "Module" }));
const DEFAULT_MODEL = "gemini-2.5-flash";
function streamTextV2(systemInstruction, messages, userMessage, options) {
  const modelId = options?.model ?? DEFAULT_MODEL;
  const modelMessages = [
    ...messages.map(
      (m) => m.role === "user" ? { role: "user", content: m.content } : { role: "assistant", content: m.content }
    ),
    { role: "user", content: userMessage }
  ];
  return streamText({
    model: google(modelId),
    system: systemInstruction,
    messages: modelMessages,
    abortSignal: options?.abortSignal,
    maxOutputTokens: 2048
  });
}
async function* streamAIResponseV2(userMessage, history, personaMode, currentSummary, mediaUrl, characterId, subscriptionTier, giftContext, abortSignal, characterName, personaPrompt) {
  if (giftContext && !userMessage.trim()) {
    userMessage = `(시스템: 사용자가 하트 ${giftContext.amount}개를 선물했습니다. 이에 대해 당신의 페르소나와 현재 감정에 맞춰 격렬하게 반응하세요.)`;
  }
  const params = {
    personaMode,
    currentSummary,
    mediaUrl,
    characterId,
    subscriptionTier,
    giftContext,
    characterName,
    personaPrompt
  };
  const systemInstruction = buildStreamSystemInstruction(params);
  const result = streamTextV2(
    systemInstruction,
    history.map((h) => ({ role: h.role, content: h.content })),
    userMessage,
    { abortSignal }
  );
  try {
    for await (const chunk of result.textStream) {
      if (chunk) {
        yield { type: "content", content: chunk };
      }
    }
    const usage = await result.usage;
    if (usage) {
      const tokenUsage = {
        promptTokens: usage.inputTokens ?? 0,
        completionTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
      };
      yield { type: "usage", usage: tokenUsage };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }
    console.error("streamAIResponseV2 Error:", error);
    yield {
      type: "content",
      content: "아... 갑자기 머리가 핑 돌아... 미안해, 잠시만 이따가 다시 불러줄래?"
    };
  }
}
async function createX402Invoice(userId, amountUSD) {
  const chocoPriceUSD = 1e-3;
  const chocoAmount = new BigNumber(amountUSD).dividedBy(chocoPriceUSD);
  const amountRaw = chocoAmount.multipliedBy(new BigNumber(10).pow(18)).toString();
  const token = crypto$1.randomBytes(32).toString("hex");
  const invoiceId = nanoid();
  await db.insert(x402Invoice).values({
    id: invoiceId,
    token,
    userId,
    amount: amountUSD,
    currency: "USD",
    chocoAmount: amountRaw,
    recipientAddress: NEAR_CONFIG.serviceAccountId,
    status: "PENDING",
    expiresAt: new Date(Date.now() + 30 * 60 * 1e3),
    // 30분 유효
    createdAt: /* @__PURE__ */ new Date()
  });
  return {
    token,
    invoice: {
      recipient: NEAR_CONFIG.serviceAccountId,
      amount: chocoAmount.toString(),
      currency: "CHOCO",
      tokenContract: NEAR_CONFIG.chocoTokenContract
    }
  };
}
function createX402Response(token, invoice) {
  return Response.json(
    {
      error: "Payment Required",
      code: "X402_PAYMENT_REQUIRED",
      message: "이 자원을 이용하려면 CHOCO 결제가 필요합니다."
    },
    {
      status: 402,
      headers: {
        "X-x402-Token": token,
        "X-x402-Invoice": JSON.stringify(invoice),
        "Access-Control-Expose-Headers": "X-x402-Token, X-x402-Invoice"
      }
    }
  );
}
async function checkSilentPaymentAllowance(userId, requestAmountUSD) {
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      allowanceAmount: true,
      allowanceExpiresAt: true,
      chocoBalance: true
    }
  });
  if (!user$1) return { canAutoPay: false, reason: "User not found" };
  const now = /* @__PURE__ */ new Date();
  const hasAllowance = user$1.allowanceAmount !== null && user$1.allowanceAmount > 0;
  const isNotExpired = !user$1.allowanceExpiresAt || user$1.allowanceExpiresAt > now;
  if (!hasAllowance || !isNotExpired) {
    return {
      canAutoPay: false,
      reason: "No active allowance or expired",
      allowanceAmount: user$1.allowanceAmount || 0
    };
  }
  if (requestAmountUSD > (user$1.allowanceAmount || 0)) {
    return {
      canAutoPay: false,
      reason: "Request exceeds allowance limit",
      allowanceAmount: user$1.allowanceAmount
    };
  }
  return {
    canAutoPay: true,
    remainingAllowance: user$1.allowanceAmount - requestAmountUSD
  };
}
const DEFAULT_HEARTBEAT = {
  lastSeenAt: (/* @__PURE__ */ new Date()).toISOString(),
  recentDaysCount: 0,
  totalConversations: 0,
  streakDays: 0
};
const DEFAULT_IDENTITY = {
  nickname: "",
  honorific: "존댓말",
  relationshipType: "팬"
};
const DEFAULT_SOUL = {};
const DEFAULT_TOOLS = {};
const PII_PATTERNS = {
  // 신용카드: 13~19자리 숫자, 대시/공백 허용
  CREDIT_CARD: /\b(?:\d{4}[-\s]?){3}\d{1,4}\b/g,
  // 주민등록번호 (한국): 6자리-7자리
  RESIDENT_ID: /\b\d{6}[-\s]?[1-4]\d{6}\b/g,
  // 전화번호 (한국/국제): 010-1234-5678, +82-10...
  PHONE_NUMBER: /\b(?:\+?82|0)1[0-9]{1}[-\s]?[0-9]{3,4}[-\s]?[0-9]{4}\b/g,
  // 이메일: basic email pattern
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
};
function maskPII(text2) {
  let masked = text2;
  masked = masked.replace(PII_PATTERNS.RESIDENT_ID, "[RESIDENT_ID]");
  {
    masked = masked.replace(PII_PATTERNS.CREDIT_CARD, (match) => {
      return "[CREDIT_CARD]";
    });
  }
  masked = masked.replace(PII_PATTERNS.PHONE_NUMBER, "[PHONE]");
  masked = masked.replace(PII_PATTERNS.EMAIL, "[EMAIL]");
  return masked;
}
function sanitizeForMemory(text2) {
  if (text2 == null || typeof text2 !== "string") return null;
  const trimmed = text2.trim();
  if (trimmed.length === 0) return null;
  return maskPII(trimmed);
}
function generateContextId(userId, characterId) {
  return `ctx_${userId}_${characterId}`;
}
function generateMemoryItemId() {
  return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
async function getOrCreateUserContext(userId, characterId) {
  const existing = await db.select().from(userContext).where(
    and(
      eq(userContext.userId, userId),
      eq(userContext.characterId, characterId)
    )
  ).get();
  if (existing) {
    return existing;
  }
  const id = generateContextId(userId, characterId);
  const now = /* @__PURE__ */ new Date();
  await db.insert(userContext).values({
    id,
    userId,
    characterId,
    createdAt: now,
    updatedAt: now
  });
  return await db.select().from(userContext).where(eq(userContext.id, id)).get();
}
async function getUserContext(userId, characterId) {
  const result = await db.select().from(userContext).where(
    and(
      eq(userContext.userId, userId),
      eq(userContext.characterId, characterId)
    )
  ).get();
  return result ?? null;
}
async function updateHeartbeat(userId, characterId, heartbeat) {
  const context = await getOrCreateUserContext(userId, characterId);
  await db.update(userContext).set({
    heartbeatDoc: JSON.stringify(heartbeat),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(userContext.id, context.id));
}
async function updateIdentity(userId, characterId, identity) {
  const context = await getOrCreateUserContext(userId, characterId);
  await db.update(userContext).set({
    identityDoc: JSON.stringify(identity),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(userContext.id, context.id));
}
async function updateSoul(userId, characterId, soul) {
  const context = await getOrCreateUserContext(userId, characterId);
  await db.update(userContext).set({
    soulDoc: JSON.stringify(soul),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(userContext.id, context.id));
}
async function updateTools(userId, characterId, tools) {
  const context = await getOrCreateUserContext(userId, characterId);
  await db.update(userContext).set({
    toolsDoc: JSON.stringify(tools),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(userContext.id, context.id));
}
async function getFullContextData(userId, characterId) {
  const context = await getUserContext(userId, characterId);
  if (!context) {
    return null;
  }
  const memoryCountResult = await db.select({ count: count() }).from(userMemoryItem).where(
    and(
      eq(userMemoryItem.userId, userId),
      eq(userMemoryItem.characterId, characterId),
      eq(userMemoryItem.isArchived, false)
    )
  ).get();
  return {
    characterId,
    heartbeat: context.heartbeatDoc ? JSON.parse(context.heartbeatDoc) : null,
    identity: context.identityDoc ? JSON.parse(context.identityDoc) : null,
    soul: context.soulDoc ? JSON.parse(context.soulDoc) : null,
    tools: context.toolsDoc ? JSON.parse(context.toolsDoc) : null,
    memoryCount: memoryCountResult?.count ?? 0
  };
}
async function deleteUserContext(userId, characterId) {
  await db.delete(userMemoryItem).where(
    and(
      eq(userMemoryItem.userId, userId),
      eq(userMemoryItem.characterId, characterId)
    )
  );
  await db.delete(userContext).where(
    and(
      eq(userContext.userId, userId),
      eq(userContext.characterId, characterId)
    )
  );
}
async function deleteAllUserContexts(userId) {
  await db.delete(userMemoryItem).where(eq(userMemoryItem.userId, userId));
  await db.delete(userContext).where(eq(userContext.userId, userId));
}
async function getAllUserContexts(userId) {
  const contexts = await db.select().from(userContext).where(eq(userContext.userId, userId)).orderBy(desc(userContext.updatedAt));
  const results = await Promise.all(
    contexts.map(async (ctx) => {
      const memoryCountResult = await db.select({ count: count() }).from(userMemoryItem).where(
        and(
          eq(userMemoryItem.userId, userId),
          eq(userMemoryItem.characterId, ctx.characterId),
          eq(userMemoryItem.isArchived, false)
        )
      ).get();
      return {
        characterId: ctx.characterId,
        heartbeat: ctx.heartbeatDoc ? JSON.parse(ctx.heartbeatDoc) : null,
        identity: ctx.identityDoc ? JSON.parse(ctx.identityDoc) : null,
        soul: ctx.soulDoc ? JSON.parse(ctx.soulDoc) : null,
        tools: ctx.toolsDoc ? JSON.parse(ctx.toolsDoc) : null,
        memoryCount: memoryCountResult?.count || 0,
        updatedAt: ctx.updatedAt
      };
    })
  );
  return results;
}
async function addMemoryItem(userId, characterId, content, options) {
  const id = generateMemoryItemId();
  const now = /* @__PURE__ */ new Date();
  await db.insert(userMemoryItem).values({
    id,
    userId,
    characterId,
    content: maskPII(content),
    category: options?.category,
    importance: options?.importance ?? 5,
    sourceConversationId: options?.sourceConversationId,
    sourceMessageId: options?.sourceMessageId,
    createdAt: now,
    expiresAt: options?.expiresAt,
    isArchived: false
  });
  return await db.select().from(userMemoryItem).where(eq(userMemoryItem.id, id)).get();
}
async function getMemoryItems(userId, characterId, options) {
  let query = db.select().from(userMemoryItem).where(
    and(
      eq(userMemoryItem.userId, userId),
      eq(userMemoryItem.characterId, characterId),
      options?.includeArchived ? void 0 : eq(userMemoryItem.isArchived, false)
    )
  ).orderBy(
    desc(userMemoryItem.importance),
    desc(userMemoryItem.createdAt)
  );
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  return await query.all();
}
async function getMemoryItemsInEvictionOrder(userId, characterId, limit) {
  return db.select().from(userMemoryItem).where(
    and(
      eq(userMemoryItem.userId, userId),
      eq(userMemoryItem.characterId, characterId),
      eq(userMemoryItem.isArchived, false)
    )
  ).orderBy(
    asc(userMemoryItem.importance),
    asc(userMemoryItem.createdAt)
  ).limit(limit).all();
}
async function deleteMemoryItemsByIds(userId, characterId, itemIds) {
  if (itemIds.length === 0) return;
  await db.delete(userMemoryItem).where(
    and(
      eq(userMemoryItem.userId, userId),
      eq(userMemoryItem.characterId, characterId),
      inArray(userMemoryItem.id, itemIds)
    )
  );
}
async function getMemoryItemCount(userId, characterId, includeArchived = false) {
  const conditions = [
    eq(userMemoryItem.userId, userId),
    eq(userMemoryItem.characterId, characterId)
  ];
  if (!includeArchived) {
    conditions.push(eq(userMemoryItem.isArchived, false));
  }
  const result = await db.select({ count: count() }).from(userMemoryItem).where(and(...conditions)).get();
  return result?.count ?? 0;
}
const TIER_LIMITS = {
  FREE: {
    maxMemoryItems: 20,
    detailedHeartbeat: false,
    soulEnabled: false,
    advancedTools: false
  },
  BASIC: {
    maxMemoryItems: 50,
    detailedHeartbeat: false,
    soulEnabled: false,
    advancedTools: false
  },
  PREMIUM: {
    maxMemoryItems: 200,
    detailedHeartbeat: true,
    soulEnabled: true,
    advancedTools: true
  },
  ULTIMATE: {
    maxMemoryItems: null,
    // Unlimited
    detailedHeartbeat: true,
    soulEnabled: true,
    advancedTools: true
  }
};
async function getUserTier(userId) {
  const user$1 = await db.select({ subscriptionTier: user.subscriptionTier }).from(user).where(eq(user.id, userId)).get();
  if (!user$1 || !user$1.subscriptionTier) {
    return "FREE";
  }
  if (isValidTier(user$1.subscriptionTier)) {
    return user$1.subscriptionTier;
  }
  return "FREE";
}
async function canUseSoul(userId) {
  const tier = await getUserTier(userId);
  return TIER_LIMITS[tier].soulEnabled;
}
async function hasReachedMemoryLimit(userId, currentCount) {
  const tier = await getUserTier(userId);
  const limit = TIER_LIMITS[tier].maxMemoryItems;
  if (limit === null) {
    return false;
  }
  return currentCount >= limit;
}
function isValidTier(tier) {
  return ["FREE", "BASIC", "PREMIUM", "ULTIMATE"].includes(tier);
}
const MEMORY_LIMIT_BY_TIER = {
  FREE: 20,
  BASIC: 50,
  PREMIUM: 200,
  ULTIMATE: null
};
const MEMORY_PROMPT_MAX_TOKENS = 500;
const MEMORY_PROMPT_MAX_ITEMS = 10;
async function evictOldMemoriesIfOverLimit(userId, characterId) {
  const tier = await getUserTier(userId);
  const limit = MEMORY_LIMIT_BY_TIER[tier];
  if (limit === null) return;
  const current = await getMemoryItemCount(userId, characterId);
  if (current <= limit) return;
  const toRemove = current - limit;
  const candidates = await getMemoryItemsInEvictionOrder(userId, characterId, toRemove + 50);
  const idsToDelete = candidates.slice(0, toRemove).map((r) => r.id);
  if (idsToDelete.length > 0) {
    await deleteMemoryItemsByIds(userId, characterId, idsToDelete);
    logger.info?.({
      category: "Context",
      message: "Memory eviction (over limit)",
      metadata: { userId, characterId, tier, removed: idsToDelete.length }
    });
  }
}
async function extractAndSaveMemoriesFromConversation(userId, characterId, messages, options) {
  try {
    const candidates = await extractMemoryCandidates(messages);
    if (!candidates || candidates.length === 0) return;
    for (const raw of candidates) {
      const sanitized = sanitizeForMemory(raw);
      if (!sanitized) continue;
      await addMemoryItem(userId, characterId, sanitized, {
        importance: 5,
        sourceConversationId: options?.conversationId
      });
    }
    await evictOldMemoriesIfOverLimit(userId, characterId);
  } catch (err) {
    logger.error?.({
      category: "Context",
      message: "extractAndSaveMemoriesFromConversation failed",
      stackTrace: err.stack,
      metadata: { userId, characterId }
    });
  }
}
async function updateHeartbeatContext(userId, characterId, isEnd = false) {
  const fullContext = await getFullContextData(userId, characterId);
  const prevHeartbeat = fullContext?.heartbeat || DEFAULT_HEARTBEAT;
  const now = DateTime.now();
  const lastSeen = prevHeartbeat.lastSeenAt ? DateTime.fromISO(prevHeartbeat.lastSeenAt) : null;
  const nextHeartbeat = { ...prevHeartbeat };
  if (!isEnd) {
    nextHeartbeat.lastSeenAt = now.toISO();
  } else {
    nextHeartbeat.lastSeenAt = now.toISO();
  }
  if (isEnd) {
    nextHeartbeat.totalConversations = (nextHeartbeat.totalConversations || 0) + 1;
  }
  if (!isEnd) {
    if (lastSeen) {
      const daysDiff = Math.floor(now.startOf("day").diff(lastSeen.startOf("day"), "days").days);
      if (daysDiff === 1) {
        nextHeartbeat.streakDays = (nextHeartbeat.streakDays || 0) + 1;
      } else if (daysDiff > 1) {
        nextHeartbeat.streakDays = 1;
      } else {
        if (!nextHeartbeat.streakDays) nextHeartbeat.streakDays = 1;
      }
      if (daysDiff > 0) {
        if (daysDiff >= 7) {
          nextHeartbeat.recentDaysCount = 1;
        } else {
          nextHeartbeat.recentDaysCount = Math.min(7, (nextHeartbeat.recentDaysCount || 0) + 1);
        }
      }
    } else {
      nextHeartbeat.streakDays = 1;
      nextHeartbeat.recentDaysCount = 1;
      nextHeartbeat.totalConversations = 0;
      nextHeartbeat.lastSeenAt = now.toISO();
    }
    await updateHeartbeat(userId, characterId, nextHeartbeat);
  } else {
    await updateHeartbeat(userId, characterId, nextHeartbeat);
  }
}
function formatHeartbeatForPrompt(heartbeat) {
  if (!heartbeat || !heartbeat.lastSeenAt) {
    return "첫 만남이다.";
  }
  const now = DateTime.now();
  const lastSeen = DateTime.fromISO(heartbeat.lastSeenAt);
  const diffDays = Math.floor(now.startOf("day").diff(lastSeen.startOf("day"), "days").days);
  const diffMinutes = Math.floor(now.diff(lastSeen, "minutes").minutes);
  let timeText = "";
  if (diffDays > 0) {
    timeText = `${diffDays}일 만에`;
  } else if (diffMinutes > 60) {
    const hours = Math.floor(diffMinutes / 60);
    timeText = `${hours}시간 만에`;
  } else if (diffMinutes > 5) {
    timeText = `${diffMinutes}분 만에`;
  } else {
    timeText = "방금";
  }
  const streak = heartbeat.streakDays || 0;
  const streakText = streak > 1 ? ` (${streak}일째 연속 만남)` : "";
  const count2 = (heartbeat.totalConversations || 0) + 1;
  return `유저와 ${timeText} 만났다.${streakText} 지금까지 총 ${count2}번째 대화했다.`;
}
const DYNAMIC_MATRIX = {
  first: {
    memory: 350,
    heartbeat: 200,
    identity: 250,
    soul: 200,
    tools: 100
  },
  deep: {
    memory: 400,
    heartbeat: 100,
    identity: 100,
    soul: 450,
    tools: 50
  },
  daily: {
    memory: 600,
    heartbeat: 100,
    identity: 100,
    soul: 200,
    tools: 100
  },
  special_day: {
    memory: 400,
    heartbeat: 100,
    identity: 100,
    soul: 200,
    tools: 300
  }
};
function getLayerBudgets(conversationType) {
  return { ...DYNAMIC_MATRIX[conversationType] };
}
const CHARS_PER_TOKEN$1 = 2;
function tokenBudgetToCharLimit(tokens) {
  return tokens * CHARS_PER_TOKEN$1;
}
function truncateToTokenLimit(text2, maxTokens) {
  if (!text2 || maxTokens <= 0) return text2;
  const maxChars = tokenBudgetToCharLimit(maxTokens);
  if (text2.length <= maxChars) return text2;
  return text2.slice(0, maxChars).trimEnd() + "...";
}
async function updateUserIdentity(userId, characterId, updates) {
  const context = await getFullContextData(userId, characterId);
  const prevIdentity = context?.identity || DEFAULT_IDENTITY;
  const nextIdentity = {
    ...prevIdentity,
    ...updates
  };
  await updateIdentity(userId, characterId, nextIdentity);
}
async function compressIdentityForPrompt(userId, characterId, maxTokens) {
  const context = await getFullContextData(userId, characterId);
  const identity = context?.identity || DEFAULT_IDENTITY;
  const namePart = identity.nickname ? identity.nickname : "이름 모름";
  const titlePart = identity.customTitle ? `("${identity.customTitle}"라고 부름)` : "";
  const relationPart = identity.relationshipType;
  const honorificPart = identity.honorific === "반말" ? "반말 사용" : identity.honorific === "존댓말" ? "존댓말 사용" : "반말/존댓말 혼용";
  const raw = `[USER INFO]
- 이름/호칭: ${namePart} ${titlePart}
- 관계: ${relationPart}
- 말투: ${honorificPart}
- 특이사항: ${identity.inferredTraits?.join(", ") || "없음"}`;
  if (maxTokens != null && maxTokens > 0) {
    return truncateToTokenLimit(raw, maxTokens);
  }
  return raw;
}
async function updateUserSoul(userId, characterId, updates) {
  const context = await getFullContextData(userId, characterId);
  const prevSoul = context?.soul || DEFAULT_SOUL;
  const nextSoul = {
    ...prevSoul,
    ...updates
  };
  await updateSoul(userId, characterId, nextSoul);
}
async function compressSoulForPrompt(userId, characterId, tier, maxTokens) {
  const userTier = tier || await getUserTier(userId);
  if (userTier === "FREE" || userTier === "BASIC") {
    return "";
  }
  const context = await getFullContextData(userId, characterId);
  const soul = context?.soul;
  if (!soul) return "";
  const isEmpty = !soul.lifePhase && (!soul.values || soul.values.length === 0) && (!soul.dreams || soul.dreams.length === 0) && (!soul.fears || soul.fears.length === 0) && (!soul.recurringWorries || soul.recurringWorries.length === 0) && !soul.summary;
  if (isEmpty) return "";
  const lines = [];
  lines.push("[SOUL & DEEP MIND]");
  if (soul.lifePhase) lines.push(`- 현재 삶의 단계: ${soul.lifePhase}`);
  if (soul.values && soul.values.length > 0) lines.push(`- 핵심 가치관: ${soul.values.join(", ")}`);
  if (soul.dreams && soul.dreams.length > 0) lines.push(`- 꿈과 소망: ${soul.dreams.join(", ")}`);
  if (soul.fears && soul.fears.length > 0) lines.push(`- 두려움/약점: ${soul.fears.join(", ")}`);
  if (soul.recurringWorries && soul.recurringWorries.length > 0) lines.push(`- 마음의 짐(고민): ${soul.recurringWorries.join(", ")}`);
  if (soul.summary) lines.push(`- 내면 요약: ${soul.summary}`);
  const raw = lines.join("\n");
  if (maxTokens != null && maxTokens > 0) {
    return truncateToTokenLimit(raw, maxTokens);
  }
  return raw;
}
async function updateUserTools(userId, characterId, updates) {
  const context = await getFullContextData(userId, characterId);
  const prevTools = context?.tools || DEFAULT_TOOLS;
  const nextTools = {
    ...prevTools,
    ...updates
  };
  await updateTools(userId, characterId, nextTools);
}
async function compressToolsForPrompt(userId, characterId, maxTokens) {
  const context = await getFullContextData(userId, characterId);
  const tools = context?.tools;
  if (!tools) return "";
  const lines = [];
  if (tools.avoidTopics && tools.avoidTopics.length > 0) {
    lines.push(`- 피해야 할 대화 주제: ${tools.avoidTopics.join(", ")}`);
  }
  if (tools.specialDates && tools.specialDates.length > 0) {
    const today = /* @__PURE__ */ new Date();
    const mmdd = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const upcomingEvents = tools.specialDates.map((d) => {
      const isToday = d.date === mmdd;
      return `${d.description} (${d.date})${isToday ? " <--- [오늘입니다! 축하/언급 필수]" : ""}`;
    });
    lines.push(`- 기억해야 할 기념일: ${upcomingEvents.join(", ")}`);
  }
  if (tools.customRules && tools.customRules.length > 0) {
    lines.push("- 사용자가 설정한 대화 규칙:");
    for (const rule of tools.customRules) {
      lines.push(`  * 조건: "${rule.condition}" -> 행동: "${rule.action}"`);
    }
  }
  if (lines.length === 0) return "";
  const raw = `[GUIDELINES & TOOLS]
${lines.join("\n")}`;
  if (maxTokens != null && maxTokens > 0) {
    return truncateToTokenLimit(raw, maxTokens);
  }
  return raw;
}
const CHARS_PER_TOKEN = 2;
async function compressMemoryForPrompt(userId, characterId, maxTokens = MEMORY_PROMPT_MAX_TOKENS) {
  const items = await getMemoryItems(userId, characterId, {
    limit: MEMORY_PROMPT_MAX_ITEMS,
    includeArchived: false
  });
  if (items.length === 0) return "";
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const lines = [];
  let totalChars = 0;
  const prefix = "이전에 알아둔 것: ";
  for (const item2 of items) {
    const line = `- ${item2.content}`;
    if (totalChars + line.length + 2 > maxChars) break;
    lines.push(line);
    totalChars += line.length + 2;
  }
  if (lines.length === 0) return "";
  return prefix + lines.join("\n");
}
async function compressHeartbeatForPrompt(userId, characterId, maxTokens) {
  const context = await getFullContextData(userId, characterId);
  const raw = formatHeartbeatForPrompt(context?.heartbeat || null);
  if (maxTokens != null && maxTokens > 0 && raw) {
    return truncateToTokenLimit(raw, maxTokens);
  }
  return raw;
}
const DEEP_CONVERSATION_KEYWORDS = [
  "고민",
  "상담",
  "힘들",
  "조언",
  "도움",
  "우울",
  "걱정",
  "불안",
  "슬프",
  "힘들어",
  "어려워",
  "말해줘",
  "들어줘",
  "위로",
  "공감"
];
function classifyConversation(input) {
  if (input.messageCount <= 1) {
    return "first";
  }
  if (input.isSpecialDateToday === true) {
    return "special_day";
  }
  const text2 = (input.recentText ?? "").toLowerCase();
  const hasDeepKeyword = DEEP_CONVERSATION_KEYWORDS.some((kw) => text2.includes(kw));
  if (hasDeepKeyword) {
    return "deep";
  }
  return "daily";
}
function isSpecialDateToday(tools) {
  if (!tools?.specialDates?.length) return false;
  const now = /* @__PURE__ */ new Date();
  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return tools.specialDates.some((d) => d.date === mmdd);
}
const chatSchema = z.object({
  message: z.string().optional().default(""),
  conversationId: z.string().uuid(),
  personality: z.enum(["idol", "lover", "hybrid", "roleplay"]).optional(),
  mediaUrl: z.string().optional().nullable().transform((val) => val === "" ? null : val),
  characterId: z.string().optional().default("chunsim"),
  giftContext: z.object({
    amount: z.number(),
    itemId: z.string()
  }).optional()
}).refine((data2) => data2.message || data2.mediaUrl || data2.giftContext, {
  message: "Message, media or gift is required",
  path: ["message"]
});
async function action$E({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return new Response("Unauthorized", {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }
  const body = await request.json();
  const result = chatSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: result.error.flatten()
    }, {
      status: 400
    });
  }
  const {
    message: message$1,
    conversationId,
    mediaUrl,
    characterId,
    giftContext
  } = result.data;
  const [history, currentUser, currentConversation] = await Promise.all([db.query.message.findMany({
    where: eq(message.conversationId, conversationId),
    orderBy: [desc(message.createdAt)],
    limit: 10
  }), db.query.user.findFirst({
    where: eq(user.id, session2.user.id),
    columns: {
      id: true,
      bio: true,
      subscriptionTier: true,
      chocoBalance: true,
      nearAccountId: true,
      nearPrivateKey: true
    }
  }), db.query.conversation.findFirst({
    where: eq(conversation.id, conversationId),
    with: {
      character: true
    }
  })]);
  const MIN_REQUIRED_CHOCO = 10;
  const currentChocoBalance = currentUser?.chocoBalance ? parseFloat(currentUser.chocoBalance) : 0;
  if (!currentUser || currentChocoBalance < MIN_REQUIRED_CHOCO) {
    const amountToChargeUSD = 0.1;
    const allowance = await checkSilentPaymentAllowance(session2.user.id, amountToChargeUSD);
    const {
      token,
      invoice
    } = await createX402Invoice(session2.user.id, amountToChargeUSD);
    const response = createX402Response(token, invoice);
    if (allowance.canAutoPay) {
      response.headers.set("X-x402-Allowance", JSON.stringify({
        canAutoPay: true,
        remainingAllowance: allowance.remainingAllowance
      }));
    }
    return response;
  }
  let memory = "";
  let bioData = {};
  try {
    const fullContext = await getFullContextData(session2.user.id, characterId);
    const recentText = history.slice(0, 3).map((m) => m.content || "").join(" ");
    const conversationType = classifyConversation({
      messageCount: history.length,
      isSpecialDateToday: isSpecialDateToday(fullContext?.tools),
      recentText
    });
    const budget = getLayerBudgets(conversationType);
    const [contextMemory, contextHeartbeat, contextIdentity, contextSoul, contextTools] = await Promise.all([compressMemoryForPrompt(session2.user.id, characterId, budget.memory), compressHeartbeatForPrompt(session2.user.id, characterId, budget.heartbeat), compressIdentityForPrompt(session2.user.id, characterId, budget.identity), compressSoulForPrompt(session2.user.id, characterId, currentUser?.subscriptionTier || "FREE", budget.soul), compressToolsForPrompt(session2.user.id, characterId, budget.tools)]);
    const parts = [];
    if (contextIdentity) parts.push(contextIdentity);
    if (contextSoul) parts.push(contextSoul);
    if (contextTools) parts.push(contextTools);
    if (contextHeartbeat) parts.push(contextHeartbeat);
    if (contextMemory) parts.push(contextMemory);
    if (parts.length > 0) {
      memory = parts.join("\n\n");
    }
  } catch (e) {
    logger.error({
      category: "API",
      message: "Context load failed, falling back to bio",
      metadata: {
        userId: session2.user.id,
        characterId
      }
    });
  }
  try {
    await updateHeartbeatContext(session2.user.id, characterId, false);
  } catch (e) {
    logger.error({
      category: "API",
      message: "Failed to update heartbeat at start",
      metadata: {
        userId: session2.user.id,
        characterId
      }
    });
  }
  if (!memory && currentUser?.bio) {
    try {
      bioData = JSON.parse(currentUser.bio);
      if (bioData.memory) memory = bioData.memory;
    } catch (e) {
      console.error("Bio parsing error:", e);
    }
  }
  const personality = currentConversation?.personaMode || "lover";
  let giftCountInSession = 0;
  if (giftContext) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1e3);
    const [giftCountRes] = await db.select({
      value: count()
    }).from(giftLog).where(and(eq(giftLog.fromUserId, session2.user.id), eq(giftLog.toCharacterId, characterId), gte(giftLog.createdAt, tenMinutesAgo)));
    giftCountInSession = (giftCountRes?.value ?? 0) + 1;
  }
  const formattedHistory = [...history].reverse().map((msg) => ({
    role: msg.role,
    content: msg.content,
    mediaUrl: msg.mediaUrl,
    isInterrupted: msg.isInterrupted
  }));
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      let isAborted = false;
      const abortHandler = () => {
        isAborted = true;
        controller.close();
      };
      request.signal.addEventListener("abort", abortHandler);
      try {
        const userChocoBalance = currentUser?.chocoBalance ? parseFloat(currentUser.chocoBalance) : 0;
        if (!currentUser || userChocoBalance < MIN_REQUIRED_CHOCO) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            error: "Insufficient CHOCO balance",
            code: 402
          })}

`));
          controller.close();
          return;
        }
        const subscriptionTier = currentUser?.subscriptionTier || "FREE";
        let tokenUsage = null;
        const useVercelAI = process.env.USE_VERCEL_AI_SDK === "true" && !mediaUrl;
        const historyForV2 = formattedHistory.map((h) => ({
          role: h.role,
          content: h.content,
          mediaUrl: h.mediaUrl,
          isInterrupted: h.isInterrupted
        }));
        const streamSource = useVercelAI ? streamAIResponseV2(message$1, historyForV2, personality, memory, mediaUrl ?? null, characterId, subscriptionTier, giftContext ? {
          ...giftContext,
          countInSession: giftCountInSession
        } : void 0, request.signal, currentConversation?.character?.name, currentConversation?.character?.personaPrompt) : streamAIResponse(message$1, formattedHistory, personality, memory, mediaUrl, session2.user.id, characterId, subscriptionTier, giftContext ? {
          ...giftContext,
          countInSession: giftCountInSession
        } : void 0, request.signal, currentConversation?.character?.name, currentConversation?.character?.personaPrompt);
        for await (const item2 of streamSource) {
          if (isAborted) break;
          if (item2.type === "content") {
            fullContent += item2.content;
          } else if (item2.type === "usage" && item2.usage) {
            tokenUsage = item2.usage;
          }
        }
        if (isAborted) {
          return;
        }
        if (tokenUsage && tokenUsage.totalTokens > 0) {
          try {
            const {
              BigNumber: BigNumber2
            } = await import("bignumber.js");
            const {
              decrypt: decrypt2
            } = await Promise.resolve().then(() => keyEncryption_server);
            const {
              returnChocoToService
            } = await import("./token.server-Gkt5Fi9h.js");
            const {
              nanoid: nanoid2
            } = await import("nanoid");
            const chocoToDeduct = new BigNumber2(tokenUsage.totalTokens).dividedBy(100).toFixed(0);
            const chocoAmountRaw = new BigNumber2(chocoToDeduct).multipliedBy(new BigNumber2(10).pow(18)).toFixed(0);
            const userForDeduction = await db.query.user.findFirst({
              where: eq(user.id, session2.user.id),
              columns: {
                chocoBalance: true,
                nearAccountId: true,
                nearPrivateKey: true
              }
            });
            if (!userForDeduction) {
              throw new Error("User not found");
            }
            const currentChocoBalance2 = userForDeduction?.chocoBalance ? parseFloat(userForDeduction.chocoBalance) : 0;
            const newChocoBalance = new BigNumber2(currentChocoBalance2).minus(chocoToDeduct).toString();
            let returnTxHash = null;
            if (userForDeduction.nearAccountId && userForDeduction.nearPrivateKey) {
              try {
                const decryptedPrivateKey = decrypt2(userForDeduction.nearPrivateKey);
                const returnResult = await returnChocoToService(userForDeduction.nearAccountId, decryptedPrivateKey, chocoAmountRaw, "Chat Usage");
                returnTxHash = returnResult.transaction.hash;
                logger.info({
                  category: "API",
                  message: `Returned ${chocoToDeduct} CHOCO to service account (chat usage)`,
                  metadata: {
                    userId: session2.user.id,
                    txHash: returnTxHash,
                    tokenUsage
                  }
                });
              } catch (onChainError) {
                logger.error({
                  category: "API",
                  message: "Failed to return CHOCO on-chain (chat usage)",
                  stackTrace: onChainError.stack,
                  metadata: {
                    userId: session2.user.id
                  }
                });
              }
            }
            await db.transaction(async (tx) => {
              await tx.update(user).set({
                chocoBalance: newChocoBalance,
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq(user.id, session2.user.id));
              if (returnTxHash) {
                await tx.insert(tokenTransfer).values({
                  id: nanoid2(),
                  userId: session2.user.id,
                  txHash: returnTxHash,
                  amount: chocoAmountRaw,
                  tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                  status: "COMPLETED",
                  purpose: "USAGE",
                  // 채팅 사용
                  createdAt: /* @__PURE__ */ new Date()
                });
              }
            });
            logger.info({
              category: "API",
              message: `Deducted ${chocoToDeduct} CHOCO for user ${session2.user.id}`,
              metadata: {
                tokenUsage,
                chocoDeducted: chocoToDeduct,
                returnTxHash
              }
            });
          } catch (err) {
            logger.error({
              category: "DB",
              message: `Failed to deduct CHOCO for user ${session2.user.id}`,
              stackTrace: err.stack
            });
          }
        }
        if (!fullContent.trim()) {
          fullContent = "[EMOTION:THINKING] 음... 그건 잘 모르겠지만 자기는 어떻게 생각해? ㅎㅎ 우리 다른 재미있는 이야기 하자!";
        }
        const firstPhotoMarker = await extractPhotoMarker(fullContent, characterId);
        const photoUrl = firstPhotoMarker.photoUrl;
        const contentWithoutPhotoMarker = firstPhotoMarker.content;
        let messageParts = contentWithoutPhotoMarker.split("---").map((p) => p.trim()).filter((p) => p.length > 0);
        if (messageParts.length <= 1 && contentWithoutPhotoMarker.length > 100) {
          const chunkSize = 80;
          messageParts = [];
          let currentPart = "";
          const sentences = contentWithoutPhotoMarker.split(/[.!?。！？]\s*/).filter((s) => s.trim());
          for (const sentence of sentences) {
            if ((currentPart + sentence).length > chunkSize && currentPart) {
              messageParts.push(currentPart.trim());
              currentPart = sentence;
            } else {
              currentPart += (currentPart ? " " : "") + sentence;
            }
          }
          if (currentPart.trim()) {
            messageParts.push(currentPart.trim());
          }
        }
        for (let i = 0; i < messageParts.length; i++) {
          const part = messageParts[i];
          const emotionMarker = extractEmotionMarker(part);
          const emotionCode = emotionMarker.emotion;
          const finalContent = emotionMarker.content;
          if (emotionCode) {
            let expiresAt = null;
            if (giftContext) {
              const amount = giftContext.amount;
              const durationMinutes = amount >= 100 ? 30 : amount >= 50 ? 15 : amount >= 10 ? 5 : 1;
              expiresAt = new Date(Date.now() + durationMinutes * 6e4);
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              emotion: emotionCode,
              expiresAt: expiresAt?.toISOString()
            })}

`));
            db.insert(characterStat).values({
              id: crypto.randomUUID(),
              characterId,
              currentEmotion: emotionCode,
              emotionExpiresAt: expiresAt,
              updatedAt: /* @__PURE__ */ new Date()
            }).onConflictDoUpdate({
              target: [characterStat.characterId],
              set: {
                currentEmotion: emotionCode,
                emotionExpiresAt: expiresAt || void 0,
                updatedAt: /* @__PURE__ */ new Date()
              }
            }).catch((err) => console.error("Failed to update emotion:", err));
          }
          if (i === 0 && photoUrl) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              mediaUrl: photoUrl
            })}

`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            text: finalContent
          })}

`));
          const [savedMessage] = await db.insert(message).values({
            id: crypto.randomUUID(),
            role: "assistant",
            content: finalContent,
            conversationId,
            createdAt: /* @__PURE__ */ new Date(),
            type: "TEXT",
            mediaUrl: i === 0 && photoUrl ? photoUrl : null,
            mediaType: i === 0 && photoUrl ? "image" : null
          }).returning();
          if (i === 0 && savedMessage) {
            try {
              const usage2 = tokenUsage || {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
              };
              await db.insert(agentExecution).values({
                id: crypto.randomUUID(),
                messageId: savedMessage.id,
                agentName: `gemini-2.5-flash-${characterId}`,
                intent: personality || "hybrid",
                promptTokens: usage2.promptTokens,
                completionTokens: usage2.completionTokens,
                totalTokens: usage2.totalTokens,
                createdAt: /* @__PURE__ */ new Date()
              });
            } catch (executionError) {
              console.error("Failed to save AgentExecution:", executionError);
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            messageComplete: true,
            messageId: savedMessage?.id,
            mediaUrl: i === 0 && photoUrl ? photoUrl : null
          })}

`));
        }
        const usage = tokenUsage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          done: true,
          usage
        })}

`));
        const allMessagesForSummary = [...formattedHistory.map((h) => {
          let content = h.content || (h.mediaUrl ? "이 사진(그림)을 확인해줘." : " ");
          if (h.role === "assistant" && h.isInterrupted && content.endsWith("...")) {
            content = content.slice(0, -3).trim();
          }
          return h.role === "user" ? new HumanMessage(content) : new AIMessage(content);
        }), new HumanMessage(message$1 || (mediaUrl ? "이 사진(그림)을 확인해줘." : " ")), new AIMessage(fullContent)];
        try {
          await Promise.all([extractAndSaveMemoriesFromConversation(session2.user.id, characterId, allMessagesForSummary, {
            conversationId
          }), updateHeartbeatContext(session2.user.id, characterId, true)]);
        } catch (memErr) {
          logger.error({
            category: "API",
            message: "extractAndSaveMemoriesFromConversation failed",
            metadata: {
              conversationId,
              characterId
            }
          });
        }
        controller.close();
      } catch (error) {
        logger.error({
          category: "API",
          message: "Streaming error in chat API",
          stackTrace: error.stack,
          metadata: {
            conversationId,
            characterId
          }
        });
        controller.error(error);
      }
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$E
}, Symbol.toStringTag, { value: "Module" }));
const createChatSchema = z.object({
  characterId: z.string()
});
async function action$D({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return new Response("Unauthorized", {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }
  try {
    const body = await request.json();
    const result = createChatSchema.safeParse(body);
    if (!result.success) {
      return Response.json({
        error: "Invalid character ID"
      }, {
        status: 400
      });
    }
    const {
      characterId
    } = result.data;
    const character$1 = await db.query.character.findFirst({
      where: eq(character.id, characterId)
    });
    if (!character$1) {
      return Response.json({
        error: "Character not found"
      }, {
        status: 404
      });
    }
    const existingConversation = await db.query.conversation.findFirst({
      where: and(eq(conversation.userId, session2.user.id), eq(conversation.characterId, characterId))
    });
    if (existingConversation) {
      return Response.json({
        conversationId: existingConversation.id
      });
    }
    const [newConversation] = await db.insert(conversation).values({
      id: crypto.randomUUID(),
      userId: session2.user.id,
      characterId,
      title: character$1.name,
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    if (!newConversation) {
      throw new Error("Failed to create conversation Record");
    }
    return Response.json({
      conversationId: newConversation.id
    });
  } catch (error) {
    console.error("Create chat error:", error);
    return Response.json({
      error: "Failed to create chat"
    }, {
      status: 500
    });
  }
}
const route21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$D
}, Symbol.toStringTag, { value: "Module" }));
v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
async function uploadImage(file) {
  try {
    const result = await v2.uploader.upload(file, {
      folder: "chunsim-chat"
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
}
async function deleteImage(url) {
  try {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filename.split(".")[0]}`;
    await v2.uploader.destroy(publicId);
    console.log(`Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
}
const deleteSchema = z.object({
  conversationId: z.string().uuid(),
  resetMemory: z.boolean().optional().default(false)
});
async function action$C({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return new Response("Unauthorized", {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }
  const body = await request.json();
  const result = deleteSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: result.error.flatten()
    }, {
      status: 400
    });
  }
  const {
    conversationId,
    resetMemory
  } = result.data;
  try {
    const messagesWithMedia = await db.query.message.findMany({
      where: and(eq(message.conversationId, conversationId), isNotNull(message.mediaUrl)),
      columns: {
        mediaUrl: true
      }
    });
    for (const msg of messagesWithMedia) {
      if (msg.mediaUrl) {
        await deleteImage(msg.mediaUrl);
      }
    }
    await db.transaction(async (tx) => {
      await tx.delete(message).where(eq(message.conversationId, conversationId));
      if (!resetMemory) {
        await tx.delete(conversation).where(eq(conversation.id, conversationId));
      }
      if (resetMemory) {
        const user$1 = await tx.query.user.findFirst({
          where: eq(user.id, session2.user.id),
          columns: {
            bio: true
          }
        });
        if (user$1?.bio) {
          try {
            const bioData = JSON.parse(user$1.bio);
            delete bioData.memory;
            delete bioData.lastMemoryUpdate;
            await tx.update(user).set({
              bio: JSON.stringify(bioData),
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(user.id, session2.user.id));
          } catch (e) {
            console.error("Failed to reset memory:", e);
          }
        }
      }
      if (resetMemory) {
        const conversation$1 = await tx.query.conversation.findFirst({
          where: eq(conversation.id, conversationId),
          columns: {
            characterId: true
          }
        });
        if (conversation$1?.characterId) {
          try {
            await deleteUserContext(session2.user.id, conversation$1.characterId);
          } catch (e) {
            console.error("Failed to reset user context layers:", e);
          }
        }
      }
    });
    return Response.json({
      success: true
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return Response.json({
      error: "Failed to delete conversation"
    }, {
      status: 500
    });
  }
}
const route22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$C
}, Symbol.toStringTag, { value: "Module" }));
const messageSchema = z.object({
  content: z.string().min(1),
  conversationId: z.string().uuid()
});
async function loader$v({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return new Response("Unauthorized", {
      status: 401
    });
  }
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    return new Response("Missing conversationId", {
      status: 400
    });
  }
  const messages = await db.query.message.findMany({
    where: eq(message.conversationId, conversationId),
    orderBy: [message.createdAt]
  });
  return Response.json({
    messages
  });
}
async function action$B({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return new Response("Unauthorized", {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }
  const body = await request.json();
  const result = messageSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: result.error.flatten()
    }, {
      status: 400
    });
  }
  const {
    content,
    conversationId
  } = result.data;
  const [userMessage] = await db.insert(message).values({
    id: crypto.randomUUID(),
    role: "user",
    content,
    conversationId,
    senderId: session2.user.id,
    createdAt: /* @__PURE__ */ new Date()
  }).returning();
  const chatMissions = await db.query.mission.findMany({
    where: and(eq(mission.isActive, true), or(sql`${mission.title} LIKE '%Chat%'`, sql`${mission.title} LIKE '%Message%'`, sql`${mission.title} LIKE '%채팅%'`, sql`${mission.description} LIKE '%chat%'`))
  });
  for (const mission2 of chatMissions) {
    const userMission$1 = await db.query.userMission.findFirst({
      where: and(eq(userMission.userId, session2.user.id), eq(userMission.missionId, mission2.id))
    });
    if (!userMission$1 || userMission$1.status === "IN_PROGRESS" && userMission$1.progress < 100) {
      const newProgress = Math.min((userMission$1?.progress || 0) + 20, 100);
      await db.insert(userMission).values({
        id: crypto.randomUUID(),
        userId: session2.user.id,
        missionId: mission2.id,
        progress: newProgress,
        status: newProgress === 100 ? "COMPLETED" : "IN_PROGRESS",
        lastUpdated: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: [userMission.userId, userMission.missionId],
        set: {
          progress: newProgress,
          status: newProgress === 100 ? "COMPLETED" : "IN_PROGRESS",
          lastUpdated: /* @__PURE__ */ new Date()
        }
      });
    }
  }
  return Response.json({
    message: userMessage
  });
}
const route23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$B,
  loader: loader$v
}, Symbol.toStringTag, { value: "Module" }));
async function action$A({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  if (request.method !== "POST" && request.method !== "DELETE") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const {
    id: messageId
  } = params;
  if (!messageId) {
    return Response.json({
      error: "Message ID is required"
    }, {
      status: 400
    });
  }
  const userId = session2.user.id;
  try {
    const message$1 = await db.query.message.findFirst({
      where: eq(message.id, messageId)
    });
    if (!message$1) {
      return Response.json({
        error: "Message not found"
      }, {
        status: 404
      });
    }
    const existingLike = await db.query.messageLike.findFirst({
      where: and(eq(messageLike.messageId, messageId), eq(messageLike.userId, userId))
    });
    if (request.method === "POST") {
      if (existingLike) {
        return Response.json({
          liked: true,
          message: "Already liked"
        });
      }
      await db.insert(messageLike).values({
        id: crypto.randomUUID(),
        messageId,
        userId,
        createdAt: /* @__PURE__ */ new Date()
      });
      return Response.json({
        liked: true
      });
    } else {
      if (!existingLike) {
        return Response.json({
          liked: false,
          message: "Not liked"
        });
      }
      await db.delete(messageLike).where(and(eq(messageLike.messageId, messageId), eq(messageLike.userId, userId)));
      return Response.json({
        liked: false
      });
    }
  } catch (error) {
    console.error("Like error:", error);
    return Response.json({
      error: "Internal server error"
    }, {
      status: 500
    });
  }
}
const route24 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$A
}, Symbol.toStringTag, { value: "Module" }));
async function action$z({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return new Response("Unauthorized", {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return Response.json({
        error: "No file uploaded"
      }, {
        status: 400
      });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    const url = await uploadImage(base64);
    return Response.json({
      url
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({
      error: "Failed to upload image"
    }, {
      status: 500
    });
  }
}
const route25 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$z
}, Symbol.toStringTag, { value: "Module" }));
async function action$y({
  request
}) {
  const formData = await request.formData();
  const userId = formData.get("userId");
  if (!userId) {
    return Response.json({
      error: "userId is required"
    }, {
      status: 400
    });
  }
  try {
    const user$1 = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        name: true,
        bio: true
      }
    });
    if (!user$1) {
      return Response.json({
        error: "User not found"
      }, {
        status: 404
      });
    }
    let conversation$1 = await db.query.conversation.findFirst({
      where: eq(conversation.userId, user$1.id),
      orderBy: [desc(conversation.updatedAt)]
    });
    if (!conversation$1) {
      const [newConversation] = await db.insert(conversation).values({
        id: crypto.randomUUID(),
        title: "춘심이와의 대화 (자동 생성)",
        userId: user$1.id,
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      conversation$1 = newConversation;
    }
    let memory = "";
    let personaMode = "hybrid";
    if (user$1.bio) {
      try {
        const bioData = JSON.parse(user$1.bio);
        memory = bioData.memory || "";
        personaMode = bioData.personaMode || "hybrid";
      } catch (e) {
      }
    }
    const messageContent = await generateProactiveMessage(user$1.name || "친구", memory, personaMode);
    const [savedMessage] = await db.insert(message).values({
      id: crypto.randomUUID(),
      role: "assistant",
      content: messageContent,
      conversationId: conversation$1.id,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return Response.json({
      success: true,
      message: "Proactive message triggered successfully",
      content: messageContent,
      messageId: savedMessage.id
    });
  } catch (error) {
    console.error("Test Cron Error:", error);
    return Response.json({
      error: "Internal server error"
    }, {
      status: 500
    });
  }
}
const route26 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$y
}, Symbol.toStringTag, { value: "Module" }));
async function loader$u({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2 || !session2.user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const userId = session2.user.id;
  try {
    const walletInfo = await getUserNearWallet(userId);
    return Response.json({
      userId,
      currentWallet: walletInfo,
      message: walletInfo?.nearAccountId ? "지갑이 이미 존재합니다." : "지갑이 없습니다. POST 요청으로 생성할 수 있습니다."
    });
  } catch (error) {
    return Response.json({
      error: error.message || "Failed to check wallet status",
      stack: process.env.NODE_ENV === "development" ? error.stack : void 0
    }, {
      status: 500
    });
  }
}
async function action$x({
  request
}) {
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2 || !session2.user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const userId = session2.user.id;
  try {
    console.log(`[Test Wallet] Starting wallet creation test for user: ${userId}`);
    const accountId = await ensureNearWallet(userId);
    if (accountId) {
      console.log(`[Test Wallet] Successfully created wallet: ${accountId}`);
      return Response.json({
        success: true,
        accountId,
        message: "지갑이 성공적으로 생성되었습니다."
      });
    } else {
      console.error(`[Test Wallet] Failed to create wallet for user: ${userId}`);
      return Response.json({
        success: false,
        error: "지갑 생성에 실패했습니다. 서버 로그를 확인하세요.",
        message: "서버 터미널에서 '[Wallet] Failed to create wallet' 메시지를 확인하세요."
      }, {
        status: 500
      });
    }
  } catch (error) {
    console.error(`[Test Wallet] Error creating wallet:`, error);
    return Response.json({
      success: false,
      error: error.message || "Failed to create wallet",
      stack: process.env.NODE_ENV === "development" ? error.stack : void 0,
      message: "서버 터미널에서 상세한 에러 로그를 확인하세요."
    }, {
      status: 500
    });
  }
}
const route27 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$x,
  loader: loader$u
}, Symbol.toStringTag, { value: "Module" }));
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is required in production");
    }
    return Buffer.alloc(32, "dev-secret-key-32-chars-long-!!!");
  }
  return crypto$1.scryptSync(key, "salt", 32);
}
function encrypt(text2) {
  const iv = crypto$1.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto$1.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text2, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}
function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== "string") {
    throw new Error("Encrypted text is required and must be a string");
  }
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid encrypted text format. Expected format: 'iv:authTag:encryptedContent', but got ${parts.length} parts. This may indicate the private key was not encrypted properly.`
    );
  }
  const [ivHex, authTagHex, encryptedContent] = parts;
  if (!ivHex || !authTagHex || !encryptedContent) {
    throw new Error(
      "Invalid encrypted text format: missing required components. Expected format: 'iv:authTag:encryptedContent'"
    );
  }
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto$1.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedContent, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    if (error.message?.includes("bad decrypt") || error.message?.includes("Unsupported state")) {
      throw new Error(
        "Decryption failed: The encryption key may have changed or the data is corrupted. Please contact support if this issue persists."
      );
    }
    throw new Error(`Decryption failed: ${error.message || error}`);
  }
}
const keyEncryption_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decrypt,
  encrypt
}, Symbol.toStringTag, { value: "Module" }));
async function loader$t({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2 || !session2.user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const userId = session2.user.id;
  try {
    const user$1 = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        nearAccountId: true,
        nearPrivateKey: true
      }
    });
    if (!user$1) {
      return Response.json({
        error: "User not found"
      }, {
        status: 404
      });
    }
    if (!user$1.nearAccountId) {
      return Response.json({
        error: "No wallet found",
        message: "지갑이 생성되지 않았습니다. 먼저 로그인하여 지갑을 생성해주세요."
      }, {
        status: 400
      });
    }
    if (!user$1.nearPrivateKey || user$1.nearPrivateKey.trim() === "") {
      console.error(`[Export Private Key] No private key found for user ${userId}. Wallet may be in inconsistent state.`);
      return Response.json({
        error: "Private key not found",
        message: "지갑 키 정보를 찾을 수 없습니다. 시스템 관리자에게 문의하여 복구 절차를 진행해 주세요."
      }, {
        status: 404
      });
    }
    const parts = user$1.nearPrivateKey.split(":");
    if (parts.length !== 3) {
      console.error(`[Export Private Key] Invalid private key format for user ${userId}.`);
      return Response.json({
        error: "Invalid key format",
        message: "저장된 지갑 키 형식이 올바르지 않습니다. 수동 복구가 필요합니다."
      }, {
        status: 500
      });
    }
    try {
      const storedValuePreview = user$1.nearPrivateKey ? `${user$1.nearPrivateKey.substring(0, 20)}... (length: ${user$1.nearPrivateKey.length})` : "null or empty";
      console.log(`[Export Private Key] Attempting to decrypt for user ${userId}, stored value preview: ${storedValuePreview}`);
      const decryptedPrivateKey = decrypt(user$1.nearPrivateKey);
      return Response.json({
        success: true,
        nearAccountId: user$1.nearAccountId,
        privateKey: decryptedPrivateKey,
        warning: "이 프라이빗 키는 극비 정보입니다. 절대 공유하지 마시고, 안전한 곳에 보관하세요. 누군가 이 키를 알게 되면 지갑의 모든 자산을 제어할 수 있습니다."
      });
    } catch (decryptError) {
      console.error("Failed to decrypt private key:", {
        error: decryptError.message || decryptError,
        userId,
        nearAccountId: user$1.nearAccountId,
        storedValueLength: user$1.nearPrivateKey?.length || 0,
        storedValuePreview: user$1.nearPrivateKey?.substring(0, 50) || "null"
      });
      let errorMessage = "프라이빗 키 복호화에 실패했습니다.";
      if (decryptError.message?.includes("Invalid encrypted text format")) {
        errorMessage = "프라이빗 키가 올바른 형식으로 저장되지 않았습니다. 이 지갑은 다른 방법으로 생성되어 프라이빗 키를 제공할 수 없습니다.";
      } else if (decryptError.message?.includes("encryption key")) {
        errorMessage = "암호화 키 문제로 복호화에 실패했습니다. 관리자에게 문의하세요.";
      }
      return Response.json({
        error: "Decryption failed",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? decryptError.message : void 0
      }, {
        status: 500
      });
    }
  } catch (error) {
    console.error("Export private key error:", error);
    return Response.json({
      error: "Internal server error"
    }, {
      status: 500
    });
  }
}
const route28 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$t
}, Symbol.toStringTag, { value: "Module" }));
const { utils, KeyPair } = nearApi;
async function runDepositMonitoring() {
  logger.info({
    category: "SYSTEM",
    message: "Starting NEAR deposit monitoring"
  });
  const users = await db.select().from(user).where(
    sql`${user.nearAccountId} IS NOT NULL`
  );
  const near = await getNearConnection();
  for (const user$1 of users) {
    try {
      if (!user$1.nearAccountId) continue;
      const account2 = await near.account(user$1.nearAccountId);
      const state = await account2.getState();
      const currentBalance = (state.amount !== void 0 ? state.amount : state.balance?.total).toString();
      const lastBalance = user$1.nearLastBalance || "0";
      if (new BigNumber(currentBalance).gt(new BigNumber(lastBalance))) {
        const depositAmountYocto = new BigNumber(currentBalance).minus(new BigNumber(lastBalance));
        if (depositAmountYocto.lt(new BigNumber(utils.format.parseNearAmount("0.01")))) {
          continue;
        }
        const depositNear = utils.format.formatNearAmount(depositAmountYocto.toFixed(0));
        logger.info({
          category: "PAYMENT",
          message: `Detected deposit of ${depositNear} NEAR for user ${user$1.id}`,
          metadata: { userId: user$1.id, nearAccountId: user$1.nearAccountId, amount: depositNear }
        });
        await processExchangeAndSweep(user$1, depositNear, depositAmountYocto.toString(), currentBalance);
      }
      if (new BigNumber(currentBalance).lt(new BigNumber(lastBalance))) {
        await db.update(user).set({
          nearLastBalance: currentBalance
        }).where(eq(user.id, user$1.id));
      }
    } catch (error) {
      logger.error({
        category: "SYSTEM",
        message: `Error monitoring user ${user$1.id} for NEAR deposits`,
        stackTrace: error.stack,
        metadata: { userId: user$1.id, nearAccountId: user$1.nearAccountId }
      });
    }
  }
  try {
    const failedLogs = await db.select().from(exchangeLog).where(
      and(
        eq(exchangeLog.fromChain, "NEAR"),
        // 네트워크 오류로 인한 실패나 아직 시도되지 않은 항목만 재시도
        sql`${exchangeLog.status} IN ('FAILED_NETWORK_ERROR', 'PENDING_SWEEP', 'FAILED')`
      )
    );
    if (failedLogs.length > 0) {
      logger.info({
        category: "SYSTEM",
        message: `Found ${failedLogs.length} failed or pending sweeps. Retrying...`
      });
      for (const log2 of failedLogs) {
        const currentUser = users.find((u) => u.id === log2.userId);
        if (currentUser && currentUser.nearAccountId) {
          const account2 = await near.account(currentUser.nearAccountId);
          const state = await account2.getState();
          const balance = (state.amount || "0").toString();
          await executeSweep(currentUser, balance, log2.id);
        }
      }
    }
  } catch (retryError) {
    logger.error({
      category: "SYSTEM",
      message: "Error during sweep retry process",
      stackTrace: retryError.stack
    });
  }
}
async function processExchangeAndSweep(user$1, nearAmount, nearAmountYocto, currentTotalBalance) {
  const { getNearPriceUSD: getNearPriceUSD2, calculateChocoFromNear: calculateChocoFromNear2 } = await Promise.resolve().then(() => exchangeRate_server);
  let rate;
  let chocoAmount;
  try {
    const nearPriceUSD = await getNearPriceUSD2();
    rate = 5e3;
    const chocoAmountStr = await calculateChocoFromNear2(nearAmount);
    chocoAmount = new BigNumber(chocoAmountStr);
    logger.info({
      category: "PAYMENT",
      message: `Exchange rate: 1 NEAR = ${rate} CHOCO (NEAR Price: $${nearPriceUSD})`,
      metadata: { nearPriceUSD, rate }
    });
  } catch (error) {
    rate = 5e3;
    chocoAmount = new BigNumber(nearAmount).multipliedBy(rate);
    logger.warn({
      category: "PAYMENT",
      message: "Failed to fetch exchange rate, using fixed rate",
      stackTrace: error.stack
    });
  }
  const chocoAmountRaw = chocoAmount.multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
  const exchangeId = v4();
  `DEP_${user$1.id.slice(0, 8)}_${Date.now()}`;
  try {
    const { sendChocoToken } = await import("./token.server-Gkt5Fi9h.js");
    logger.info({
      category: "PAYMENT",
      message: `Transferring ${chocoAmount.toString()} CHOCO tokens to ${user$1.nearAccountId} (NEAR deposit)`,
      metadata: { userId: user$1.id, nearAccountId: user$1.nearAccountId, chocoAmount: chocoAmount.toString() }
    });
    const sendResult = await sendChocoToken(user$1.nearAccountId, chocoAmountRaw);
    const chocoTxHash = sendResult.transaction.hash;
    await db.transaction(async (tx) => {
      const newChocoBalance = new BigNumber(user$1.chocoBalance || "0").plus(chocoAmount);
      await tx.update(user).set({
        chocoBalance: newChocoBalance.toString(),
        nearLastBalance: currentTotalBalance,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, user$1.id));
      await tx.insert(exchangeLog).values({
        id: exchangeId,
        userId: user$1.id,
        fromChain: "NEAR",
        fromAmount: nearAmount,
        toToken: "CHOCO",
        toAmount: chocoAmount.toString(),
        rate,
        txHash: chocoTxHash,
        // 실제 CHOCO 전송 해시로 저장
        status: "PENDING_SWEEP"
      });
    });
    logger.audit({
      category: "PAYMENT",
      message: `Exchange completed: ${nearAmount} NEAR -> ${chocoAmount} CHOCO`,
      metadata: {
        userId: user$1.id,
        nearAccountId: user$1.nearAccountId,
        nearAmount,
        chocoAmount: chocoAmount.toString(),
        rate,
        txHash: chocoTxHash
      }
    });
    if (user$1.isSweepEnabled !== false) {
      await executeSweep(user$1, currentTotalBalance, exchangeId);
    }
  } catch (error) {
    logger.error({
      category: "PAYMENT",
      message: `Exchange failed for user ${user$1.id}`,
      stackTrace: error.stack,
      metadata: { userId: user$1.id, nearAccountId: user$1.nearAccountId, nearAmount }
    });
  }
}
async function executeSweep(user$1, balanceToSweep, exchangeLogId) {
  const treasuryAccountId = process.env.NEAR_TREASURY_ACCOUNT_ID || process.env.NEAR_TREASURTY_ACCOUNT_ID || "rogulus.testnet";
  try {
    if (!user$1.nearPrivateKey) {
      throw new Error("User private key not found");
    }
    const near = await getNearConnection();
    const networkId = process.env.NEAR_NETWORK_ID || "testnet";
    const privateKey = decrypt(user$1.nearPrivateKey);
    const keyPair = KeyPair.fromString(privateKey);
    const { signer } = near.connection;
    if (signer.keyStore) {
      await signer.keyStore.setKey(networkId, user$1.nearAccountId, keyPair);
    }
    const account2 = await near.account(user$1.nearAccountId);
    const state = await account2.getState();
    let actualAvailableBalance;
    if (state.amount) {
      actualAvailableBalance = state.amount.toString();
    } else if (state.balance && state.balance.available) {
      actualAvailableBalance = state.balance.available.toString();
    } else {
      actualAvailableBalance = "0";
    }
    const safetyMargin = new BigNumber(utils.format.parseNearAmount("0.02"));
    const sweepAmount = new BigNumber(actualAvailableBalance).minus(safetyMargin);
    if (sweepAmount.lte(0)) {
      logger.info({
        category: "PAYMENT",
        message: `Available balance too low for sweep for ${user$1.nearAccountId} (Needs > 0.02 NEAR)`,
        metadata: { userId: user$1.id, nearAccountId: user$1.nearAccountId, actualBalance: actualAvailableBalance }
      });
      await db.update(exchangeLog).set({
        status: "FAILED_INSUFFICIENT_BALANCE"
      }).where(eq(exchangeLog.id, exchangeLogId));
      return;
    }
    const sweepAmountRaw = sweepAmount.toFixed(0);
    const sweepAmountFormatted = utils.format.formatNearAmount(sweepAmountRaw);
    logger.info({
      category: "PAYMENT",
      message: `Sweeping ${sweepAmountFormatted} NEAR to treasury (${treasuryAccountId})`,
      metadata: {
        userId: user$1.id,
        nearAccountId: user$1.nearAccountId,
        treasuryAccountId,
        amount: sweepAmountFormatted
      }
    });
    const result = await account2.sendMoney(treasuryAccountId, sweepAmountRaw);
    await db.update(exchangeLog).set({
      sweepTxHash: result.transaction.hash,
      status: "COMPLETED"
    }).where(eq(exchangeLog.id, exchangeLogId));
    const postSweepState = await account2.getState();
    await db.update(user).set({
      nearLastBalance: (postSweepState.amount || "0").toString()
    }).where(eq(user.id, user$1.id));
    logger.audit({
      category: "PAYMENT",
      message: `Sweep successful: ${sweepAmountFormatted} NEAR transferred to treasury`,
      metadata: {
        userId: user$1.id,
        nearAccountId: user$1.nearAccountId,
        treasuryAccountId,
        amount: sweepAmountFormatted,
        txHash: result.transaction.hash
      }
    });
  } catch (error) {
    let errorMessage = error.message || String(error);
    const isKeyMismatch = errorMessage.includes("AccessKeyDoesNotExist") || errorMessage.includes("invalid signature") || errorMessage.includes("public key");
    const isInsufficientBalance = errorMessage.includes("insufficient balance") || errorMessage.includes("too low");
    let finalStatus = "FAILED";
    if (isKeyMismatch) {
      finalStatus = "FAILED_KEY_MISMATCH";
      logger.error({
        category: "PAYMENT",
        message: `CRITICAL: NEAR Key Mismatch for ${user$1.nearAccountId}. Automated sweep impossible.`,
        metadata: { userId: user$1.id, nearAccountId: user$1.nearAccountId, error: errorMessage }
      });
    } else if (isInsufficientBalance) {
      finalStatus = "FAILED_INSUFFICIENT_BALANCE";
      logger.warn({
        category: "PAYMENT",
        message: `Sweep skipped: Insufficient balance for ${user$1.nearAccountId}`,
        metadata: { userId: user$1.id, nearAccountId: user$1.nearAccountId, error: errorMessage }
      });
    } else {
      finalStatus = "FAILED_NETWORK_ERROR";
      logger.error({
        category: "PAYMENT",
        message: `Sweep failed for user ${user$1.id} due to transient error`,
        stackTrace: error.stack,
        metadata: { userId: user$1.id, nearAccountId: user$1.nearAccountId, exchangeLogId, error: errorMessage }
      });
    }
    await db.update(exchangeLog).set({
      status: finalStatus
    }).where(eq(exchangeLog.id, exchangeLogId));
  }
}
const depositEngine_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  runDepositMonitoring
}, Symbol.toStringTag, { value: "Module" }));
async function action$w({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  try {
    await runDepositMonitoring();
    return Response.json({
      success: true,
      message: "Deposit scan completed"
    });
  } catch (error) {
    console.error("Deposit scan failed:", error);
    return Response.json({
      success: false,
      error: "Failed to scan deposits"
    }, {
      status: 500
    });
  }
}
async function loader$s() {
  return Response.json({
    error: "Method not allowed"
  }, {
    status: 405
  });
}
const route29 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$w,
  loader: loader$s
}, Symbol.toStringTag, { value: "Module" }));
async function action$v({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const {
    subscription: subscription2
  } = await request.json();
  try {
    await db.update(user).set({
      pushSubscription: JSON.stringify(subscription2),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(user.id, session2.user.id));
    return Response.json({
      success: true
    });
  } catch (error) {
    console.error("Save subscription error:", error);
    return Response.json({
      error: "Internal server error"
    }, {
      status: 500
    });
  }
}
const route30 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$v
}, Symbol.toStringTag, { value: "Module" }));
async function loader$r({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const userId = session2.user.id;
  try {
    const userConversations = await db.query.conversation.findMany({
      where: eq(conversation.userId, userId),
      columns: {
        id: true
      }
    });
    const conversationIds = userConversations.map((c) => c.id);
    if (conversationIds.length === 0) {
      return Response.json({
        total: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          messageCount: 0
        },
        daily: [],
        monthly: []
      });
    }
    const userMessages = await db.query.message.findMany({
      where: and(inArray(message.conversationId, conversationIds), eq(message.role, "assistant")),
      columns: {
        id: true
      }
    });
    const messageIds = userMessages.map((m) => m.id);
    if (messageIds.length === 0) {
      return Response.json({
        total: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          messageCount: 0
        },
        daily: [],
        monthly: []
      });
    }
    const executions = await db.query.agentExecution.findMany({
      where: inArray(agentExecution.messageId, messageIds),
      columns: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        createdAt: true
      }
    });
    const total = executions.reduce((acc, exec) => ({
      promptTokens: acc.promptTokens + exec.promptTokens,
      completionTokens: acc.completionTokens + exec.completionTokens,
      totalTokens: acc.totalTokens + exec.totalTokens,
      messageCount: acc.messageCount + 1
    }), {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      messageCount: 0
    });
    const dailyMap = /* @__PURE__ */ new Map();
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    executions.filter((exec) => exec.createdAt >= thirtyDaysAgo).forEach((exec) => {
      const dateKey = exec.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(dateKey) || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        messageCount: 0
      };
      dailyMap.set(dateKey, {
        promptTokens: existing.promptTokens + exec.promptTokens,
        completionTokens: existing.completionTokens + exec.completionTokens,
        totalTokens: existing.totalTokens + exec.totalTokens,
        messageCount: existing.messageCount + 1
      });
    });
    const daily = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      ...stats
    })).sort((a, b) => a.date.localeCompare(b.date));
    const monthlyMap = /* @__PURE__ */ new Map();
    const twelveMonthsAgo = /* @__PURE__ */ new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    executions.filter((exec) => exec.createdAt >= twelveMonthsAgo).forEach((exec) => {
      const monthKey = exec.createdAt.toISOString().slice(0, 7);
      const existing = monthlyMap.get(monthKey) || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        messageCount: 0
      };
      monthlyMap.set(monthKey, {
        promptTokens: existing.promptTokens + exec.promptTokens,
        completionTokens: existing.completionTokens + exec.completionTokens,
        totalTokens: existing.totalTokens + exec.totalTokens,
        messageCount: existing.messageCount + 1
      });
    });
    const monthly = Array.from(monthlyMap.entries()).map(([month, stats]) => ({
      month,
      ...stats
    })).sort((a, b) => a.month.localeCompare(b.month));
    return Response.json({
      total,
      daily,
      monthly
    });
  } catch (error) {
    console.error("Error fetching token usage stats:", error);
    return Response.json({
      error: "Internal server error"
    }, {
      status: 500
    });
  }
}
const route31 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$r
}, Symbol.toStringTag, { value: "Module" }));
const giftSchema = z.object({
  characterId: z.string(),
  itemId: z.string(),
  amount: z.number().min(1),
  message: z.string().optional(),
  conversationId: z.string()
});
async function action$u({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const body = await request.json();
  const result = giftSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: "Invalid request body"
    }, {
      status: 400
    });
  }
  const {
    characterId,
    itemId,
    amount,
    message: message$1,
    conversationId
  } = result.data;
  const item2 = Object.values(ITEMS).find((i) => i.id === itemId);
  if (!item2) {
    return Response.json({
      error: "Item not found"
    }, {
      status: 404
    });
  }
  try {
    return await db.transaction(async (tx) => {
      const inventory = await tx.query.userInventory.findFirst({
        where: and(eq(userInventory.userId, session2.user.id), eq(userInventory.itemId, itemId))
      });
      if (inventory && inventory.quantity >= amount) {
        await tx.update(userInventory).set({
          quantity: sql`${userInventory.quantity} - ${amount}`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(and(eq(userInventory.userId, session2.user.id), eq(userInventory.itemId, itemId)));
      } else {
        throw new Error("Insufficient hearts");
      }
      const existingGift = await tx.query.giftLog.findFirst({
        where: and(eq(giftLog.fromUserId, session2.user.id), eq(giftLog.toCharacterId, characterId))
      });
      const isNewGiver = !existingGift;
      const durationMinutes = amount >= 100 ? 30 : amount >= 50 ? 15 : amount >= 10 ? 5 : 1;
      const emotionExpiresAt = new Date(Date.now() + durationMinutes * 6e4);
      const initialEmotion = amount >= 100 ? "LOVING" : amount >= 50 ? "EXCITED" : "JOY";
      const existingStat = await tx.query.characterStat.findFirst({
        where: eq(characterStat.characterId, characterId)
      });
      if (existingStat) {
        await tx.update(characterStat).set({
          totalHearts: sql`${characterStat.totalHearts} + ${amount}`,
          totalUniqueGivers: isNewGiver ? sql`${characterStat.totalUniqueGivers} + 1` : void 0,
          currentEmotion: initialEmotion,
          emotionExpiresAt,
          lastGiftAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(characterStat.characterId, characterId));
      } else {
        await tx.insert(characterStat).values({
          id: crypto.randomUUID(),
          characterId,
          totalHearts: amount,
          totalUniqueGivers: 1,
          currentEmotion: initialEmotion,
          emotionExpiresAt,
          lastGiftAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      const [newGiftLog] = await tx.insert(giftLog).values({
        id: crypto.randomUUID(),
        fromUserId: session2.user.id,
        toCharacterId: characterId,
        itemId,
        amount,
        message: message$1,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      const [systemMsg] = await tx.insert(message).values({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `💝 **${session2.user.name || "사용자"}**님이 하트 **${amount}**개를 선물했습니다!`,
        conversationId,
        type: "TEXT",
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      const giftMissions = await tx.query.mission.findMany({
        where: and(eq(mission.isActive, true), or(sql`${mission.title} LIKE '%Gift%'`, sql`${mission.title} LIKE '%Heart%'`, sql`${mission.title} LIKE '%선물%'`, sql`${mission.description} LIKE '%gift%'`))
      });
      for (const mission2 of giftMissions) {
        const userMission$1 = await tx.query.userMission.findFirst({
          where: and(eq(userMission.userId, session2.user.id), eq(userMission.missionId, mission2.id))
        });
        if (!userMission$1 || userMission$1.status === "IN_PROGRESS" && userMission$1.progress < 100) {
          const newProgress = Math.min((userMission$1?.progress || 0) + 25, 100);
          if (userMission$1) {
            await tx.update(userMission).set({
              progress: newProgress,
              status: newProgress === 100 ? "COMPLETED" : "IN_PROGRESS",
              lastUpdated: /* @__PURE__ */ new Date()
            }).where(and(eq(userMission.userId, session2.user.id), eq(userMission.missionId, mission2.id)));
          } else {
            await tx.insert(userMission).values({
              id: crypto.randomUUID(),
              userId: session2.user.id,
              missionId: mission2.id,
              progress: newProgress,
              status: newProgress === 100 ? "COMPLETED" : "IN_PROGRESS",
              lastUpdated: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      return Response.json({
        success: true,
        giftLog: newGiftLog,
        systemMsg
      });
    });
  } catch (error) {
    console.error("Gifting transaction error:", error);
    if (error.message === "Insufficient hearts") {
      return Response.json({
        error: "Insufficient hearts"
      }, {
        status: 400
      });
    }
    return Response.json({
      error: "Gifting failed"
    }, {
      status: 500
    });
  }
}
const route32 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$u
}, Symbol.toStringTag, { value: "Module" }));
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const mode = process.env.PAYPAL_MODE || "sandbox";
const webhookId = process.env.PAYPAL_WEBHOOK_ID;
if (!clientId || !clientSecret) {
  throw new Error("MISSING_PAYPAL_CREDENTIALS");
}
const environment = mode === "live" ? new paypal.core.LiveEnvironment(clientId, clientSecret) : new paypal.core.SandboxEnvironment(clientId, clientSecret);
const paypalClient = new paypal.core.PayPalHttpClient(environment);
async function verifyWebhookSignature(headers, body) {
  if (!webhookId) {
    console.warn("PAYPAL_WEBHOOK_ID is not set in env. Skipping signature verification (NOT RECOMMENDED for production).");
    return true;
  }
  const request = {
    path: "/v1/notifications/verify-webhook-signature",
    verb: "POST",
    body: {
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: body
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
  try {
    const response = await paypalClient.execute({
      ...request,
      headers: request.headers,
      // @ts-ignore
      body: request.body
    });
    return response.result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Webhook Verification Failed:", error);
    return false;
  }
}
async function cancelPayPalSubscription(subscriptionId, reason = "User requested cancellation") {
  const request = {
    path: `/v1/billing/subscriptions/${subscriptionId}/cancel`,
    verb: "POST",
    body: {
      reason
    },
    headers: {
      "Content-Type": "application/json"
    }
  };
  try {
    const response = await paypalClient.execute(request);
    return response.statusCode === 204;
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    throw error;
  }
}
const CreateOrderSchema = z.object({
  packageId: z.string()
});
async function action$t({
  request
}) {
  const userId = await requireUserId(request);
  if (!userId) {
    throw data({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const formData = await request.formData();
  const submission = CreateOrderSchema.safeParse(Object.fromEntries(formData));
  if (!submission.success) {
    return data({
      error: "Invalid payload"
    }, {
      status: 400
    });
  }
  const {
    packageId
  } = submission.data;
  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!creditPackage) {
    return data({
      error: "Invalid package ID"
    }, {
      status: 400
    });
  }
  const requestBody = new paypal.orders.OrdersCreateRequest();
  requestBody.prefer("return=representation");
  requestBody.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: packageId,
      amount: {
        currency_code: "USD",
        value: creditPackage.price.toFixed(2)
      },
      description: `${creditPackage.credits + creditPackage.bonus} Credits Top-up`,
      custom_id: userId
      // 나중에 검증용으로 사용자 ID 포함
    }]
  });
  try {
    const order = await paypalClient.execute(requestBody);
    return data({
      orderId: order.result.id
    });
  } catch (error) {
    console.error("PayPal Create Order Error:", error);
    return data({
      error: "Failed to create PayPal order"
    }, {
      status: 500
    });
  }
}
const route33 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$t
}, Symbol.toStringTag, { value: "Module" }));
const CaptureOrderSchema = z.object({
  orderId: z.string(),
  packageId: z.string()
});
async function action$s({
  request
}) {
  const userId = await requireUserId(request);
  if (!userId) {
    throw data({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const formData = await request.formData();
  const submission = CaptureOrderSchema.safeParse(Object.fromEntries(formData));
  if (!submission.success) {
    return data({
      error: "Invalid payload"
    }, {
      status: 400
    });
  }
  const {
    orderId,
    packageId
  } = submission.data;
  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!creditPackage) {
    return data({
      error: "Invalid package ID"
    }, {
      status: 400
    });
  }
  const requestBody = new paypal.orders.OrdersCaptureRequest(orderId);
  requestBody.requestBody({});
  try {
    const capture = await paypalClient.execute(requestBody);
    const result = capture.result;
    if (result.status !== "COMPLETED") {
      return data({
        error: "Payment not completed"
      }, {
        status: 400
      });
    }
    const purchaseUnit = result.purchase_units[0];
    const amountPaid = parseFloat(purchaseUnit.payments.captures[0].amount.value);
    if (Math.abs(amountPaid - creditPackage.price) > 0.01) {
      console.error(`Amount mismatch: expected ${creditPackage.price}, paid ${amountPaid}`);
      return data({
        error: "Payment amount mismatch. Please contact support."
      }, {
        status: 400
      });
    }
    const user$1 = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        nearAccountId: true,
        chocoBalance: true
      }
    });
    if (!user$1) {
      return data({
        error: "User not found"
      }, {
        status: 404
      });
    }
    const {
      calculateChocoFromUSD: calculateChocoFromUSD2
    } = await Promise.resolve().then(() => exchangeRate_server);
    const chocoAmount = await calculateChocoFromUSD2(creditPackage.price);
    const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
    let chocoTxHash = null;
    if (user$1.nearAccountId) {
      try {
        const {
          sendChocoToken
        } = await import("./token.server-Gkt5Fi9h.js");
        logger.info({
          category: "PAYMENT",
          message: `Transferring ${chocoAmount} CHOCO tokens to ${user$1.nearAccountId} (PayPal payment)`,
          metadata: {
            userId,
            nearAccountId: user$1.nearAccountId,
            usdAmount: creditPackage.price,
            chocoAmount
          }
        });
        const sendResult = await sendChocoToken(user$1.nearAccountId, chocoAmountRaw);
        chocoTxHash = sendResult.transaction.hash;
      } catch (error) {
        logger.error({
          category: "PAYMENT",
          message: "Failed to transfer CHOCO tokens on-chain (PayPal payment)",
          stackTrace: error.stack,
          metadata: {
            userId,
            nearAccountId: user$1.nearAccountId
          }
        });
      }
    }
    const totalCredits = creditPackage.credits + creditPackage.bonus;
    await db.transaction(async (tx) => {
      await tx.insert(payment).values({
        id: crypto.randomUUID(),
        userId,
        amount: creditPackage.price,
        currency: "USD",
        status: "COMPLETED",
        type: "TOPUP",
        provider: "PAYPAL",
        transactionId: result.id,
        description: creditPackage.name,
        creditsGranted: totalCredits,
        // 호환성을 위해 유지 (deprecated)
        txHash: chocoTxHash || void 0,
        metadata: JSON.stringify({
          ...result,
          chocoAmount,
          chocoTxHash
        }),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      const newChocoBalance = new BigNumber(user$1.chocoBalance || "0").plus(chocoAmount);
      await tx.update(user).set({
        chocoBalance: newChocoBalance.toString(),
        lastTokenRefillAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, userId));
      if (chocoTxHash) {
        await tx.insert(tokenTransfer).values({
          id: crypto.randomUUID(),
          userId,
          txHash: chocoTxHash,
          amount: chocoAmountRaw,
          tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
          status: "COMPLETED",
          purpose: "TOPUP",
          createdAt: /* @__PURE__ */ new Date()
        });
      }
    });
    return data({
      success: true,
      newCredits: totalCredits,
      chocoAmount
    });
  } catch (error) {
    console.error("PayPal Capture Error:", error);
    const errorMessage = error.message || "Failed to capture payment";
    return data({
      error: errorMessage
    }, {
      status: 500
    });
  }
}
const route34 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$s
}, Symbol.toStringTag, { value: "Module" }));
async function loader$q({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, session2.user.id),
    columns: {
      subscriptionTier: true,
      subscriptionStatus: true,
      email: true
    }
  });
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const tossClientKey = process.env.TOSS_CLIENT_KEY;
  return Response.json({
    user: user$1,
    paypalClientId,
    tossClientKey
  });
}
const pricing = UNSAFE_withComponentProps(function PricingPage() {
  const {
    user: user2,
    paypalClientId,
    tossClientKey
  } = useLoaderData();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("TOSS");
  const fetcher = useFetcher();
  const [isProcessing, setIsProcessing] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.navigator) {
      const isKorean = window.navigator.language.startsWith("ko");
      setPaymentMethod(isKorean ? "TOSS" : "PAYPAL");
    }
  }, []);
  const plans = Object.values(SUBSCRIPTION_PLANS);
  const getPlanIcon = (tier) => {
    switch (tier) {
      case "FREE":
        return "egg";
      case "BASIC":
        return "bolt";
      case "PREMIUM":
        return "diamond";
      case "ULTIMATE":
        return "crown";
      default:
        return "star";
    }
  };
  const handlePlanClick = (plan) => {
    if (user2?.subscriptionTier === plan.tier || plan.tier === "FREE") {
      if (plan.tier === "FREE" && user2?.subscriptionTier !== "FREE") {
        toast.info("무료 플랜은 구독 만료 후 자동으로 적용됩니다.");
      }
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };
  const handleApproveSubscription = async (data2, actions) => {
    if (!selectedPlan || !selectedPlan.paypalPlanId) return;
    const formData = new FormData();
    formData.append("subscriptionId", data2.subscriptionID);
    formData.append("planId", selectedPlan.paypalPlanId);
    fetcher.submit(formData, {
      method: "post",
      action: "/api/payment/activate-subscription"
    });
  };
  const handleTossSubscription = async () => {
    if (!tossClientKey || !selectedPlan || isProcessing) {
      if (!tossClientKey) toast.error("토스페이먼츠 설정 오류");
      return;
    }
    setIsProcessing(true);
    try {
      const {
        loadTossPayments
      } = await import("@tosspayments/payment-sdk");
      const tossPayments = await loadTossPayments(tossClientKey);
      const orderId = `sub_${selectedPlan.tier.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      await tossPayments.requestPayment("카드", {
        amount: selectedPlan.monthlyPriceKRW,
        orderId,
        orderName: `${selectedPlan.name} 멤버십 (1개월)`,
        successUrl: `${window.location.origin}/payment/toss/success?type=SUBSCRIPTION&tier=${selectedPlan.tier}&amount=${selectedPlan.monthlyPriceKRW}`,
        failUrl: `${window.location.origin}/payment/toss/fail?from=subscription`,
        windowTarget: isMobile ? "self" : void 0
      });
    } catch (error) {
      console.error("Toss Subscription Error:", error);
      toast.error("결제 준비 중 오류가 발생했습니다.");
      setIsProcessing(false);
    }
  };
  if (fetcher.data?.success && isModalOpen) {
    setIsModalOpen(false);
    toast.success("구독이 활성화되었습니다! 환영합니다.");
    navigate("/profile");
  } else if (fetcher.data?.error && isModalOpen) {
    toast.error(fetcher.data.error);
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-[#0B0A10] text-foreground flex flex-col relative overflow-hidden",
    children: [/* @__PURE__ */ jsx("div", {
      className: "absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
    }), /* @__PURE__ */ jsx("div", {
      className: "absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
    }), /* @__PURE__ */ jsxs("header", {
      className: "sticky top-0 z-50 bg-[#0B0A10]/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between max-w-md mx-auto w-full",
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => navigate(-1),
        className: "flex items-center justify-center text-white/80 hover:text-primary transition-colors size-10 rounded-full hover:bg-white/5",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-[24px]",
          children: "arrow_back_ios_new"
        })
      }), /* @__PURE__ */ jsx("h1", {
        className: "text-lg font-bold tracking-tight text-white uppercase",
        children: "Membership"
      }), /* @__PURE__ */ jsx("div", {
        className: "w-10"
      })]
    }), /* @__PURE__ */ jsxs("main", {
      className: "flex-1 max-w-md mx-auto w-full p-6 pb-32 space-y-8 relative z-10",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "text-center space-y-3 mb-8",
        children: [/* @__PURE__ */ jsxs("h2", {
          className: "text-3xl font-black italic tracking-tighter text-white uppercase",
          children: ["Level Up", /* @__PURE__ */ jsx("br", {}), /* @__PURE__ */ jsx("span", {
            className: "text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500",
            children: "Your Experience"
          })]
        }), /* @__PURE__ */ jsx("p", {
          className: "text-sm text-white/60 font-medium",
          children: "Unlock exclusive features & unlimited chats."
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "space-y-5",
        children: plans.map((plan) => {
          const isCurrent = user2?.subscriptionTier === plan.tier;
          const isPopular = plan.tier === "PREMIUM";
          const isUltimate = plan.tier === "ULTIMATE";
          return /* @__PURE__ */ jsxs("div", {
            onClick: () => handlePlanClick(plan),
            className: cn("relative p-6 rounded-3xl border backdrop-blur-sm transition-all duration-300 group cursor-pointer overflow-hidden", isCurrent ? "bg-white/5 border-primary shadow-[0_0_30px_rgba(255,0,255,0.15)] ring-1 ring-primary" : "bg-[#1A1821]/60 border-white/5 hover:bg-[#1A1821] hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"),
            children: [isPopular && !isCurrent && /* @__PURE__ */ jsx("div", {
              className: "absolute top-0 right-0 px-4 py-1.5 bg-primary text-[#0B0A10] text-[11px] font-black uppercase tracking-wider rounded-bl-2xl shadow-[0_4px_20px_rgba(255,0,255,0.4)] z-20",
              children: "Most Popular"
            }), isCurrent && /* @__PURE__ */ jsx("div", {
              className: "absolute top-0 right-0 px-4 py-1.5 bg-white/10 text-primary text-[11px] font-black uppercase tracking-wider rounded-bl-2xl border-l border-b border-primary/20 z-20",
              children: "Current Plan"
            }), isUltimate && /* @__PURE__ */ jsx("div", {
              className: "absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl group-hover:bg-yellow-500/30 transition-colors"
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-4 relative z-10",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex justify-between items-start",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "space-y-1",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */ jsx("span", {
                      className: cn("material-symbols-outlined text-[20px]", isUltimate ? "text-yellow-400" : isPopular ? "text-primary" : plan.tier === "FREE" ? "text-slate-400" : "text-blue-400"),
                      children: getPlanIcon(plan.tier)
                    }), /* @__PURE__ */ jsx("h3", {
                      className: "text-lg font-bold tracking-tight text-white uppercase italic",
                      children: plan.name
                    })]
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex items-baseline gap-1",
                    children: [/* @__PURE__ */ jsxs("span", {
                      className: "text-3xl font-black text-white tracking-tighter",
                      children: ["$", plan.monthlyPrice]
                    }), /* @__PURE__ */ jsx("span", {
                      className: "text-xs text-white/50 font-bold uppercase tracking-wider",
                      children: "/ MO"
                    })]
                  })]
                })
              }), /* @__PURE__ */ jsx("div", {
                className: "h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
              }), /* @__PURE__ */ jsx("ul", {
                className: "space-y-2.5",
                children: plan.features.slice(0, 4).map((feature, i) => /* @__PURE__ */ jsxs("li", {
                  className: "flex items-center gap-3 text-sm text-white/80 font-medium",
                  children: [/* @__PURE__ */ jsx("span", {
                    className: "material-symbols-outlined text-[16px] text-primary shrink-0",
                    children: "check_circle"
                  }), /* @__PURE__ */ jsx("span", {
                    children: feature
                  })]
                }, i))
              })]
            })]
          }, plan.tier);
        })
      }), /* @__PURE__ */ jsx("div", {
        className: "h-4"
      })]
    }), /* @__PURE__ */ jsx(Dialog, {
      open: isModalOpen,
      onOpenChange: setIsModalOpen,
      children: /* @__PURE__ */ jsxs(DialogContent, {
        className: "sm:max-w-[400px] bg-[#151419] border-white/10 text-white p-0 overflow-hidden rounded-[32px] shadow-2xl",
        children: [/* @__PURE__ */ jsxs(DialogHeader, {
          className: "p-8 bg-[#1A1821] border-b border-white/5 relative overflow-hidden",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"
          }), /* @__PURE__ */ jsxs("div", {
            className: "relative z-10 text-center space-y-2",
            children: [/* @__PURE__ */ jsx("div", {
              className: "mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary text-2xl",
                children: getPlanIcon(selectedPlan?.tier || "BASIC")
              })
            }), /* @__PURE__ */ jsx(DialogTitle, {
              className: "text-2xl font-black italic tracking-tight uppercase",
              children: selectedPlan?.name
            }), /* @__PURE__ */ jsx(DialogDescription, {
              className: "text-white/60 font-medium pt-2",
              children: paymentMethod === "TOSS" ? /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsxs("span", {
                  className: "text-primary text-lg font-bold",
                  children: ["₩", selectedPlan?.monthlyPriceKRW.toLocaleString()]
                }), " / 월"]
              }) : /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsxs("span", {
                  className: "text-primary text-lg font-bold",
                  children: ["$", selectedPlan?.monthlyPrice]
                }), " / month"]
              })
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "p-6 space-y-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10",
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => setPaymentMethod("TOSS"),
              className: cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", paymentMethod === "TOSS" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white"),
              children: "국내 결제 (토스)"
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => setPaymentMethod("PAYPAL"),
              className: cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", paymentMethod === "PAYPAL" ? "bg-[#ffc439] text-[#003087] shadow-lg" : "text-white/50 hover:text-white"),
              children: "Global (PayPal)"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-white rounded-2xl p-4 shadow-sm min-h-[100px] flex flex-col justify-center",
            children: [paymentMethod === "PAYPAL" ? paypalClientId && selectedPlan?.paypalPlanId ? /* @__PURE__ */ jsx(PayPalScriptProvider, {
              options: {
                clientId: paypalClientId,
                vault: true,
                intent: "subscription"
              },
              children: /* @__PURE__ */ jsx(PayPalButtons, {
                style: {
                  layout: "vertical",
                  color: "black",
                  shape: "rect",
                  label: "subscribe",
                  height: 48
                },
                forceReRender: [selectedPlan?.tier],
                createSubscription: (data2, actions) => {
                  return actions.subscription.create({
                    plan_id: selectedPlan.paypalPlanId
                  });
                },
                onApprove: handleApproveSubscription,
                onCancel: () => {
                  toast.info("결제가 취소되었습니다.");
                },
                onError: (err) => {
                  console.error("PayPal Error:", err);
                  toast.error("결제 처리 중 오류가 발생했습니다.");
                }
              })
            }) : /* @__PURE__ */ jsx("div", {
              className: "text-red-500 text-center text-xs font-bold py-4 italic",
              children: "PayPal Config Error"
            }) : /* @__PURE__ */ jsx(Button, {
              onClick: handleTossSubscription,
              disabled: isProcessing,
              className: cn("w-full h-12 bg-[#3182f6] hover:bg-[#1b64da] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all", isProcessing && "opacity-70 cursor-not-allowed"),
              children: isProcessing ? /* @__PURE__ */ jsx("div", {
                className: "size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              }) : /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[20px]",
                  children: "payments"
                }), "멤버십 시작하기"]
              })
            }), /* @__PURE__ */ jsxs("p", {
              className: "text-[10px] text-slate-400 text-center mt-3 px-1 leading-tight",
              children: ["결제 시 이용약관에 동의하게 됩니다.", /* @__PURE__ */ jsx("br", {}), "언제든지 해지할 수 있습니다."]
            })]
          })]
        })]
      })
    })]
  });
});
const route35 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: pricing,
  loader: loader$q
}, Symbol.toStringTag, { value: "Module" }));
const ActivateSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  planId: z.string()
  // PayPal Plan ID
});
async function action$r({
  request
}) {
  const userId = await requireUserId(request);
  if (!userId) {
    throw data({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const formData = await request.formData();
  const submission = ActivateSubscriptionSchema.safeParse(Object.fromEntries(formData));
  if (!submission.success) {
    console.error("Invalid payload:", submission.error);
    return data({
      error: "Invalid payload"
    }, {
      status: 400
    });
  }
  const {
    subscriptionId,
    planId
  } = submission.data;
  const planEntry = Object.values(SUBSCRIPTION_PLANS).find((p) => p.paypalPlanId === planId);
  if (!planEntry) {
    return data({
      error: "Unknown subscription plan"
    }, {
      status: 400
    });
  }
  try {
    const existingSub = await db.query.user.findFirst({
      where: eq(user.subscriptionId, subscriptionId)
    });
    if (existingSub) {
      if (existingSub.id === userId) {
        return data({
          success: true,
          message: "Subscription already active"
        });
      }
      return data({
        error: "Subscription ID already in use"
      }, {
        status: 409
      });
    }
    const user$1 = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        nearAccountId: true,
        chocoBalance: true
      }
    });
    if (!user$1) {
      return data({
        error: "User not found"
      }, {
        status: 404
      });
    }
    const chocoAmount = planEntry.creditsPerMonth.toString();
    const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
    let chocoTxHash = null;
    if (user$1.nearAccountId && planEntry.creditsPerMonth > 0) {
      try {
        const {
          sendChocoToken
        } = await import("./token.server-Gkt5Fi9h.js");
        logger.info({
          category: "PAYMENT",
          message: `Transferring ${chocoAmount} CHOCO tokens for subscription activation (PayPal)`,
          metadata: {
            userId,
            tier: planEntry.tier,
            nearAccountId: user$1.nearAccountId,
            chocoAmount
          }
        });
        const sendResult = await sendChocoToken(user$1.nearAccountId, chocoAmountRaw);
        chocoTxHash = sendResult.transaction.hash;
      } catch (error) {
        logger.error({
          category: "PAYMENT",
          message: "Failed to transfer CHOCO tokens on-chain (PayPal subscription activation)",
          stackTrace: error.stack,
          metadata: {
            userId,
            tier: planEntry.tier
          }
        });
      }
    }
    const nextMonth = DateTime.now().plus({
      months: 1
    }).toJSDate();
    await db.transaction(async (tx) => {
      const newChocoBalance = new BigNumber(user$1.chocoBalance || "0").plus(chocoAmount);
      await tx.update(user).set({
        subscriptionStatus: "ACTIVE",
        subscriptionTier: planEntry.tier,
        subscriptionId,
        currentPeriodEnd: nextMonth,
        chocoBalance: newChocoBalance.toString(),
        lastTokenRefillAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, userId));
      await tx.insert(payment).values({
        id: crypto.randomUUID(),
        userId,
        amount: planEntry.monthlyPrice,
        currency: "USD",
        status: "COMPLETED",
        type: "SUBSCRIPTION_ACTIVATION",
        provider: "PAYPAL",
        subscriptionId,
        description: `Subscription Activation: ${planEntry.name}`,
        creditsGranted: planEntry.creditsPerMonth,
        // 호환성을 위해 유지 (deprecated)
        txHash: chocoTxHash || void 0,
        metadata: JSON.stringify({
          tier: planEntry.tier,
          chocoAmount,
          chocoTxHash
        }),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      if (chocoTxHash) {
        await tx.insert(tokenTransfer).values({
          id: crypto.randomUUID(),
          userId,
          txHash: chocoTxHash,
          amount: chocoAmountRaw,
          tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
          status: "COMPLETED",
          purpose: "TOPUP",
          createdAt: /* @__PURE__ */ new Date()
        });
      }
    });
    return data({
      success: true
    });
  } catch (error) {
    console.error("Subscription Activation Error:", error);
    return data({
      error: "Failed to activate subscription"
    }, {
      status: 500
    });
  }
}
const route36 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$r
}, Symbol.toStringTag, { value: "Module" }));
async function action$q({
  request
}) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }
  const bodyText = await request.text();
  const body = JSON.parse(bodyText);
  const headers = Object.fromEntries(request.headers);
  const isValid = await verifyWebhookSignature(headers, body);
  if (!isValid) {
    console.error("Invalid Webhook Signature");
    return new Response("Invalid Signature", {
      status: 400
    });
  }
  const eventType = body.event_type;
  const resource = body.resource;
  console.log(`[PayPal Webhook] Received event: ${eventType}`);
  try {
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED": {
        const subscriptionId = resource.billing_agreement_id;
        const transactionId = resource.id;
        const amount = resource.amount.total;
        const user$1 = await db.query.user.findFirst({
          where: eq(user.subscriptionId, subscriptionId)
        });
        if (!user$1) {
          console.warn(`User not found for subscription: ${subscriptionId}`);
          return new Response("User Not Found", {
            status: 200
          });
        }
        const existingPayment = await db.query.payment.findFirst({
          where: eq(payment.transactionId, transactionId)
        });
        if (existingPayment) {
          console.log(`Transaction ${transactionId} already processed.`);
          return new Response("Already Processed", {
            status: 200
          });
        }
        const planKey = user$1.subscriptionTier;
        const plan = SUBSCRIPTION_PLANS[planKey];
        const creditsToAdd = plan ? plan.creditsPerMonth : 0;
        const chocoAmount = creditsToAdd.toString();
        const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
        const nextBillingDate = DateTime.now().plus({
          months: 1
        }).toJSDate();
        let chocoTxHash = null;
        if (user$1.nearAccountId && creditsToAdd > 0) {
          try {
            const {
              sendChocoToken
            } = await import("./token.server-Gkt5Fi9h.js");
            logger.info({
              category: "PAYMENT",
              message: `Transferring ${chocoAmount} CHOCO tokens for subscription renewal (PayPal)`,
              metadata: {
                userId: user$1.id,
                tier: user$1.subscriptionTier,
                nearAccountId: user$1.nearAccountId,
                chocoAmount
              }
            });
            const sendResult = await sendChocoToken(user$1.nearAccountId, chocoAmountRaw);
            chocoTxHash = sendResult.transaction.hash;
          } catch (error) {
            logger.error({
              category: "PAYMENT",
              message: "Failed to transfer CHOCO tokens on-chain (PayPal subscription renewal)",
              stackTrace: error.stack,
              metadata: {
                userId: user$1.id,
                tier: user$1.subscriptionTier
              }
            });
          }
        }
        await db.transaction(async (tx) => {
          await tx.insert(payment).values({
            id: crypto.randomUUID(),
            userId: user$1.id,
            amount: parseFloat(amount),
            currency: resource.amount.currency,
            status: "COMPLETED",
            type: "SUBSCRIPTION_RENEWAL",
            provider: "PAYPAL",
            transactionId,
            subscriptionId,
            description: `Subscription Renewal: ${user$1.subscriptionTier}`,
            creditsGranted: creditsToAdd > 0 ? creditsToAdd : void 0,
            // 호환성을 위해 유지 (deprecated)
            txHash: chocoTxHash || void 0,
            metadata: JSON.stringify({
              ...resource,
              chocoAmount,
              chocoTxHash
            }),
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          });
          const currentChocoBalance = await tx.query.user.findFirst({
            where: eq(user.id, user$1.id),
            columns: {
              chocoBalance: true
            }
          });
          const newChocoBalance = new BigNumber(currentChocoBalance?.chocoBalance || "0").plus(chocoAmount);
          await tx.update(user).set({
            chocoBalance: newChocoBalance.toString(),
            lastTokenRefillAt: /* @__PURE__ */ new Date(),
            currentPeriodEnd: nextBillingDate,
            subscriptionStatus: "ACTIVE",
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(user.id, user$1.id));
          if (chocoTxHash) {
            await tx.insert(tokenTransfer).values({
              id: crypto.randomUUID(),
              userId: user$1.id,
              txHash: chocoTxHash,
              amount: chocoAmountRaw,
              tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
              status: "COMPLETED",
              purpose: "TOPUP",
              createdAt: /* @__PURE__ */ new Date()
            });
          }
        });
        console.log(`[Subscription Renewal] Success for user ${user$1.id}. Added ${chocoAmount} CHOCO.`);
        break;
      }
      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const subscriptionId = resource.id;
        await db.update(user).set({
          subscriptionStatus: "CANCELLED",
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(user.subscriptionId, subscriptionId));
        console.log(`[Subscription Cancelled] Subscription ${subscriptionId} cancelled.`);
        break;
      }
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subscriptionId = resource.id;
        await db.update(user).set({
          subscriptionStatus: "SUSPENDED",
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(user.subscriptionId, subscriptionId));
        console.log(`[Subscription Suspended] Subscription ${subscriptionId} suspended.`);
        break;
      }
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Internal Server Error", {
      status: 500
    });
  }
  return new Response("OK", {
    status: 200
  });
}
const route37 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$q
}, Symbol.toStringTag, { value: "Module" }));
async function action$p({
  request
}) {
  const userId = await requireUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, userId)
  });
  if (!user$1 || !user$1.subscriptionId) {
    return data({
      error: "No active subscription found"
    }, {
      status: 400
    });
  }
  try {
    await cancelPayPalSubscription(user$1.subscriptionId, "User requested cancellation via website");
    await db.update(user).set({
      subscriptionStatus: "CANCELLED"
    }).where(eq(user.id, userId));
    return data({
      success: true
    });
  } catch (error) {
    console.error("Subscription Cancellation Error:", error);
    return data({
      error: "Failed to cancel subscription. Please try again later."
    }, {
      status: 500
    });
  }
}
const route38 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$p
}, Symbol.toStringTag, { value: "Module" }));
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
async function confirmTossPayment(paymentKey, orderId, amount) {
  if (!TOSS_SECRET_KEY) {
    throw new Error("TOSS_SECRET_KEY is not defined");
  }
  const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount
    })
  });
  const data2 = await response.json();
  if (!response.ok) {
    throw new Error(data2.message || "Toss Payment confirmation failed");
  }
  return data2;
}
async function processSuccessfulTossPayment(userId, paymentData, creditsGranted) {
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, nearAccountId: true, chocoBalance: true }
  });
  if (!user$1) {
    throw new Error("User not found");
  }
  const { calculateChocoFromKRW: calculateChocoFromKRW2 } = await Promise.resolve().then(() => exchangeRate_server);
  const krwAmount = paymentData.totalAmount;
  const chocoAmount = await calculateChocoFromKRW2(krwAmount);
  const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
  let chocoTxHash = null;
  if (user$1.nearAccountId) {
    try {
      const { sendChocoToken } = await import("./token.server-Gkt5Fi9h.js");
      logger.info({
        category: "PAYMENT",
        message: `Transferring ${chocoAmount} CHOCO tokens to ${user$1.nearAccountId} (Toss payment)`,
        metadata: { userId, nearAccountId: user$1.nearAccountId, krwAmount, chocoAmount }
      });
      const sendResult = await sendChocoToken(user$1.nearAccountId, chocoAmountRaw);
      chocoTxHash = sendResult.transaction.hash;
    } catch (error) {
      logger.error({
        category: "PAYMENT",
        message: "Failed to transfer CHOCO tokens on-chain (Toss payment)",
        stackTrace: error.stack,
        metadata: { userId, nearAccountId: user$1.nearAccountId }
      });
    }
  }
  return await db.transaction(async (tx) => {
    const newChocoBalance = new BigNumber(user$1.chocoBalance || "0").plus(chocoAmount);
    await tx.update(user).set({
      chocoBalance: newChocoBalance.toString(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(user.id, userId));
    const updatedUser = await tx.query.user.findFirst({
      where: eq(user.id, userId)
    });
    const [payment$1] = await tx.insert(payment).values({
      id: crypto$1.randomUUID(),
      userId,
      transactionId: paymentData.orderId,
      // Toss OrderId
      paymentKey: paymentData.paymentKey,
      // Toss PaymentKey
      amount: paymentData.totalAmount,
      currency: "KRW",
      status: "COMPLETED",
      provider: "TOSS",
      type: "TOPUP",
      description: `CHOCO Top-up (${creditsGranted} CHOCO)`,
      creditsGranted,
      // 호환성을 위해 유지 (deprecated)
      txHash: chocoTxHash || void 0,
      metadata: JSON.stringify({
        ...paymentData,
        chocoAmount,
        chocoTxHash
      }),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    if (chocoTxHash) {
      await tx.insert(tokenTransfer).values({
        id: crypto$1.randomUUID(),
        userId,
        txHash: chocoTxHash,
        amount: chocoAmountRaw,
        tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
        status: "COMPLETED",
        purpose: "TOPUP",
        createdAt: /* @__PURE__ */ new Date()
      });
    }
    return { user: updatedUser, payment: payment$1 };
  });
}
async function processSuccessfulTossSubscription(userId, paymentData, tier) {
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, nearAccountId: true, chocoBalance: true }
  });
  if (!user$1) {
    throw new Error("User not found");
  }
  const { SUBSCRIPTION_PLANS: SUBSCRIPTION_PLANS2 } = await Promise.resolve().then(() => subscriptionPlans);
  const plan = SUBSCRIPTION_PLANS2[tier];
  const creditsPerMonth = plan?.creditsPerMonth || 0;
  const chocoAmount = creditsPerMonth.toString();
  const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
  let chocoTxHash = null;
  if (user$1.nearAccountId && creditsPerMonth > 0) {
    try {
      const { sendChocoToken } = await import("./token.server-Gkt5Fi9h.js");
      logger.info({
        category: "PAYMENT",
        message: `Transferring ${chocoAmount} CHOCO tokens for subscription (Toss)`,
        metadata: { userId, tier, nearAccountId: user$1.nearAccountId, chocoAmount }
      });
      const sendResult = await sendChocoToken(user$1.nearAccountId, chocoAmountRaw);
      chocoTxHash = sendResult.transaction.hash;
    } catch (error) {
      logger.error({
        category: "PAYMENT",
        message: "Failed to transfer CHOCO tokens on-chain (Toss subscription)",
        stackTrace: error.stack,
        metadata: { userId, tier }
      });
    }
  }
  return await db.transaction(async (tx) => {
    const newChocoBalance = new BigNumber(user$1.chocoBalance || "0").plus(chocoAmount);
    await tx.update(user).set({
      subscriptionTier: tier,
      subscriptionStatus: "ACTIVE",
      chocoBalance: newChocoBalance.toString(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(user.id, userId));
    const updatedUser = await tx.query.user.findFirst({
      where: eq(user.id, userId)
    });
    const [payment$1] = await tx.insert(payment).values({
      id: crypto$1.randomUUID(),
      userId,
      transactionId: paymentData.orderId,
      paymentKey: paymentData.paymentKey,
      amount: paymentData.totalAmount,
      currency: "KRW",
      status: "COMPLETED",
      provider: "TOSS",
      type: "SUBSCRIPTION",
      description: `${tier} Membership Subscription`,
      creditsGranted: creditsPerMonth,
      // 호환성을 위해 유지 (deprecated)
      txHash: chocoTxHash || void 0,
      metadata: JSON.stringify({
        paymentData,
        tier,
        chocoAmount,
        chocoTxHash,
        activatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    if (chocoTxHash) {
      await tx.insert(tokenTransfer).values({
        id: crypto$1.randomUUID(),
        userId,
        txHash: chocoTxHash,
        amount: chocoAmountRaw,
        tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
        status: "COMPLETED",
        purpose: "TOPUP",
        createdAt: /* @__PURE__ */ new Date()
      });
    }
    return { user: updatedUser, payment: payment$1 };
  });
}
async function processSuccessfulTossItemPayment(userId, paymentData, itemId, quantity) {
  return await db.transaction(async (tx) => {
    await tx.insert(userInventory).values({
      id: crypto$1.randomUUID(),
      userId,
      itemId,
      quantity,
      updatedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: [userInventory.userId, userInventory.itemId],
      set: {
        quantity: sql`${userInventory.quantity} + ${quantity}`,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    const inventory = await tx.query.userInventory.findFirst({
      where: and(
        eq(userInventory.userId, userId),
        eq(userInventory.itemId, itemId)
      )
    });
    const [payment$1] = await tx.insert(payment).values({
      id: crypto$1.randomUUID(),
      userId,
      transactionId: paymentData.orderId,
      paymentKey: paymentData.paymentKey,
      amount: paymentData.totalAmount,
      currency: "KRW",
      status: "COMPLETED",
      provider: "TOSS",
      type: "ITEM_PURCHASE",
      description: `아이템 구매: ${itemId} x ${quantity}`,
      metadata: JSON.stringify({ itemId, quantity, paymentData }),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return { inventory, payment: payment$1 };
  });
}
const toss_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  confirmTossPayment,
  processSuccessfulTossItemPayment,
  processSuccessfulTossPayment,
  processSuccessfulTossSubscription
}, Symbol.toStringTag, { value: "Module" }));
async function action$o({
  request
}) {
  const userId = await requireUserId(request);
  if (!userId) {
    return new Response("Unauthorized", {
      status: 401
    });
  }
  const {
    paymentKey,
    orderId,
    amount,
    creditsGranted
  } = await request.json();
  if (!paymentKey || !orderId || !amount || !creditsGranted) {
    return Response.json({
      error: "Missing required fields"
    }, {
      status: 400
    });
  }
  try {
    const paymentData = await confirmTossPayment(paymentKey, orderId, amount);
    const result = await processSuccessfulTossPayment(userId, paymentData, creditsGranted);
    return Response.json({
      success: true,
      credits: result.user?.credits ?? 0,
      message: "결제가 완료되었습니다."
    });
  } catch (error) {
    console.error("Toss Payment Confirmation Error:", error);
    return Response.json({
      success: false,
      error: error.message || "결제 승인 중 오류가 발생했습니다."
    }, {
      status: 500
    });
  }
}
const route39 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$o
}, Symbol.toStringTag, { value: "Module" }));
async function loader$p({
  request
}) {
  const userId = await requireUserId(request);
  if (!userId) {
    return redirect("/login");
  }
  const url = new URL(request.url);
  const paymentKey = url.searchParams.get("paymentKey");
  const orderId = url.searchParams.get("orderId");
  const amount = Number(url.searchParams.get("amount"));
  const type = url.searchParams.get("type") || "TOPUP";
  const creditsGranted = Number(url.searchParams.get("creditsGranted"));
  const tier = url.searchParams.get("tier");
  if (!paymentKey || !orderId || !amount) {
    return {
      error: "Missing required payment information"
    };
  }
  try {
    const paymentData = await confirmTossPayment(paymentKey, orderId, amount);
    if (type === "SUBSCRIPTION" && tier) {
      await Promise.resolve().then(() => toss_server).then((m) => m.processSuccessfulTossSubscription(userId, paymentData, tier));
      return {
        success: true,
        type: "SUBSCRIPTION",
        tier
      };
    } else if (type === "ITEM") {
      const itemId = url.searchParams.get("itemId") || "heart";
      const quantity = Number(url.searchParams.get("quantity")) || 0;
      await Promise.resolve().then(() => toss_server).then((m) => m.processSuccessfulTossItemPayment(userId, paymentData, itemId, quantity));
      return {
        success: true,
        type: "ITEM",
        itemId,
        quantity
      };
    } else if (creditsGranted) {
      await processSuccessfulTossPayment(userId, paymentData, creditsGranted);
      return {
        success: true,
        type: "TOPUP",
        creditsGranted
      };
    }
    return {
      error: "Invalid payment type or missing data"
    };
  } catch (error) {
    console.error("Toss Success Loader Error:", error);
    return {
      error: error.message || "결제 승인 처리 중 오류가 발생했습니다."
    };
  }
}
const payment_toss_success = UNSAFE_withComponentProps(function TossSuccessPage() {
  const data2 = useLoaderData();
  const navigate = useNavigate();
  useEffect(() => {
    if (data2.success) {
      if (data2.type === "SUBSCRIPTION") {
        toast.success(`${data2.tier} 멤버십 구독이 시작되었습니다!`);
      } else if (data2.type === "ITEM") {
        toast.success(`${data2.quantity}개의 하트가 인벤토리에 추가되었습니다!`);
      } else {
        toast.success(`${data2.creditsGranted} CHOCO가 충전되었습니다!`);
      }
      const timer = setTimeout(() => {
        let targetPath = "/profile/subscription";
        if (data2.type === "SUBSCRIPTION") targetPath = "/pricing";
        if (data2.type === "ITEM") targetPath = "/profile";
        navigate(targetPath, {
          replace: true
        });
      }, 2e3);
      return () => clearTimeout(timer);
    }
  }, [data2, navigate]);
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-background-dark flex items-center justify-center p-4",
    children: /* @__PURE__ */ jsx("div", {
      className: "bg-surface-dark border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl",
      children: data2.error ? /* @__PURE__ */ jsxs(Fragment, {
        children: [/* @__PURE__ */ jsx("div", {
          className: "size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-red-500 text-4xl",
            children: "error"
          })
        }), /* @__PURE__ */ jsx("h1", {
          className: "text-xl font-bold text-white",
          children: "결제 처리 실패"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/60 text-sm",
          children: data2.error
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => navigate("/profile/subscription", {
            replace: true
          }),
          className: "w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors",
          children: "돌아가기"
        })]
      }) : /* @__PURE__ */ jsxs(Fragment, {
        children: [/* @__PURE__ */ jsx("div", {
          className: "size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-bounce",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-primary text-4xl",
            children: "check_circle"
          })
        }), /* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold text-white",
          children: "결제 완료!"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/60",
          children: "잠시 후 자동으로 대시보드로 이동합니다..."
        }), /* @__PURE__ */ jsx("div", {
          className: "h-1 w-full bg-white/5 rounded-full overflow-hidden",
          children: /* @__PURE__ */ jsx("div", {
            className: "h-full bg-primary animate-[shimmer_2s_infinite]",
            style: {
              width: "100%"
            }
          })
        })]
      })
    })
  });
});
const route40 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: payment_toss_success,
  loader: loader$p
}, Symbol.toStringTag, { value: "Module" }));
const payment_toss_fail = UNSAFE_withComponentProps(function TossFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");
  const message2 = searchParams.get("message");
  const from = searchParams.get("from");
  const returnUrl = from === "subscription" ? "/pricing" : "/profile/subscription";
  const getFriendlyMessage = (code2) => {
    switch (code2) {
      case "PAY_PROCESS_CANCELED":
        return "결제가 중단되었습니다. 다시 시도해 주세요.";
      case "REJECT_CARD_COMPANY":
        return "카드사에서 결제를 거절했습니다. 다른 카드를 사용해 주세요.";
      case "EXCEED_MAX_DAILY_PAYMENT_COUNT":
        return "일일 결제 횟수 제한을 초과했습니다.";
      case "NOT_ENOUGH_BALANCE":
        return "계좌 잔액이 부족합니다.";
      case "INVALID_CARD_NUMBER":
        return "카드 번호가 유효하지 않습니다.";
      default:
        return message2 || "결제 중 알 수 없는 오류가 발생했습니다.";
    }
  };
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen bg-[#0B0A10] flex items-center justify-center p-4",
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-md w-full bg-[#1A1821] border border-white/10 rounded-[32px] p-8 shadow-2xl text-center space-y-6 relative overflow-hidden",
      children: [/* @__PURE__ */ jsx("div", {
        className: "absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 rounded-full blur-3xl pointer-events-none"
      }), /* @__PURE__ */ jsxs("div", {
        className: "relative z-10 space-y-6",
        children: [/* @__PURE__ */ jsx("div", {
          className: "size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20",
          children: /* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-red-500 text-4xl",
            children: "error"
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-2xl font-black text-white italic uppercase tracking-tight",
            children: "결제 실패"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/60 text-sm font-medium leading-relaxed",
            children: getFriendlyMessage(code)
          }), code && /* @__PURE__ */ jsxs("p", {
            className: "text-[10px] text-white/20 font-mono pt-2 uppercase",
            children: ["Error Code: ", code]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 gap-3 pt-4",
          children: [/* @__PURE__ */ jsx("button", {
            onClick: () => navigate(returnUrl, {
              replace: true
            }),
            className: "w-full py-4 bg-primary text-[#0B0A10] rounded-2xl font-black uppercase text-sm shadow-[0_4px_20px_rgba(255,0,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all",
            children: "다시 시도하기"
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => navigate("/profile/subscription", {
              replace: true
            }),
            className: "w-full py-4 bg-white/5 hover:bg-white/10 text-white/80 rounded-2xl font-bold text-sm transition-all",
            children: "구독 관리로 돌아가기"
          })]
        }), /* @__PURE__ */ jsx("p", {
          className: "text-[11px] text-white/30 pt-4 font-medium",
          children: "지속적으로 문제가 발생할 경우 고객센터로 문의해 주세요."
        })]
      })]
    })
  });
});
const route41 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: payment_toss_fail
}, Symbol.toStringTag, { value: "Module" }));
const purchaseSchema = z.object({
  itemId: z.string(),
  quantity: z.number().min(1)
});
async function action$n({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const body = await request.json();
  const result = purchaseSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: "Invalid request body"
    }, {
      status: 400
    });
  }
  const {
    itemId,
    quantity
  } = result.data;
  const item2 = Object.values(ITEMS).find((i) => i.id === itemId);
  if (!item2) {
    return Response.json({
      error: "Item not found"
    }, {
      status: 404
    });
  }
  const totalCost = (item2.priceChoco || item2.priceCredits || 0) * quantity;
  const totalCostBigNumber = new BigNumber(totalCost);
  const totalCostRaw = totalCostBigNumber.multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, session2.user.id),
    columns: {
      chocoBalance: true,
      nearAccountId: true,
      nearPrivateKey: true
    }
  });
  const userChocoBalance = user$1?.chocoBalance ? parseFloat(user$1.chocoBalance) : 0;
  if (!user$1 || userChocoBalance < totalCost) {
    return Response.json({
      error: "Insufficient CHOCO balance"
    }, {
      status: 400
    });
  }
  try {
    let returnTxHash = null;
    if (user$1.nearAccountId && user$1.nearPrivateKey) {
      try {
        const {
          decrypt: decrypt2
        } = await Promise.resolve().then(() => keyEncryption_server);
        const {
          returnChocoToService
        } = await import("./token.server-Gkt5Fi9h.js");
        const decryptedPrivateKey = decrypt2(user$1.nearPrivateKey);
        const returnResult = await returnChocoToService(user$1.nearAccountId, decryptedPrivateKey, totalCostRaw, `Item Purchase: ${item2.name} x${quantity}`);
        returnTxHash = returnResult.transaction.hash;
        logger.info({
          category: "PAYMENT",
          message: `Returned ${totalCost} CHOCO to service account (item purchase)`,
          metadata: {
            userId: session2.user.id,
            itemId,
            quantity,
            txHash: returnTxHash
          }
        });
      } catch (onChainError) {
        logger.error({
          category: "PAYMENT",
          message: "Failed to return CHOCO on-chain (item purchase)",
          stackTrace: onChainError.stack,
          metadata: {
            userId: session2.user.id,
            itemId,
            quantity
          }
        });
      }
    }
    await db.transaction(async (tx) => {
      const newChocoBalance = new BigNumber(userChocoBalance).minus(totalCost).toString();
      await tx.update(user).set({
        chocoBalance: newChocoBalance,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, session2.user.id));
      await tx.insert(userInventory).values({
        id: crypto.randomUUID(),
        userId: session2.user.id,
        itemId,
        quantity,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: [userInventory.userId, userInventory.itemId],
        set: {
          quantity: sql`${userInventory.quantity} + ${quantity}`,
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      await tx.insert(payment).values({
        id: crypto.randomUUID(),
        userId: session2.user.id,
        amount: totalCost,
        currency: "CHOCO",
        status: "COMPLETED",
        provider: "CHOCO",
        type: "ITEM_PURCHASE",
        description: `${item2.name} ${quantity}개 구매`,
        metadata: JSON.stringify({
          itemId,
          quantity,
          chocoSpent: totalCost,
          returnTxHash
        }),
        txHash: returnTxHash || void 0,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      if (returnTxHash) {
        await tx.insert(tokenTransfer).values({
          id: nanoid(),
          userId: session2.user.id,
          txHash: returnTxHash,
          amount: totalCostRaw,
          tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
          status: "COMPLETED",
          purpose: "ITEM_PURCHASE",
          createdAt: /* @__PURE__ */ new Date()
        });
      }
    });
    return Response.json({
      success: true,
      chocoSpent: totalCost,
      returnTxHash
    });
  } catch (error) {
    logger.error({
      category: "PAYMENT",
      message: "Purchase transaction error",
      stackTrace: error.stack,
      metadata: {
        userId: session2.user.id,
        itemId,
        quantity
      }
    });
    return Response.json({
      error: "Purchase failed"
    }, {
      status: 500
    });
  }
}
const route42 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$n
}, Symbol.toStringTag, { value: "Module" }));
const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY || "";
const createChargeSchema = z.object({
  amount: z.number().positive(),
  credits: z.number().int().positive(),
  description: z.string().optional()
});
async function action$m({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  if (!COINBASE_API_KEY) {
    return Response.json({
      error: "Coinbase API Key is not configured"
    }, {
      status: 500
    });
  }
  try {
    const body = await request.json();
    const result = createChargeSchema.safeParse(body);
    if (!result.success) {
      return Response.json({
        error: "Invalid request data",
        details: result.error.flatten()
      }, {
        status: 400
      });
    }
    const {
      amount,
      credits,
      description
    } = result.data;
    const userId = session2.user.id;
    const response = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": COINBASE_API_KEY,
        "X-CC-Version": "2018-03-22"
      },
      body: JSON.stringify({
        name: description || `${credits} Credits Top-up`,
        description: `Purchase ${credits} credits for $${amount}`,
        local_price: {
          amount: amount.toFixed(2),
          currency: "USD"
        },
        pricing_type: "fixed_price",
        metadata: {
          userId,
          credits: credits.toString()
        },
        redirect_url: `${new URL(request.url).origin}/profile/subscription`,
        cancel_url: `${new URL(request.url).origin}/profile/subscription`
      })
    });
    const data2 = await response.json();
    if (!response.ok) {
      console.error("Coinbase API Error Response:", data2);
      return Response.json({
        error: data2.error?.message || "Failed to create charge from Coinbase"
      }, {
        status: response.status
      });
    }
    const charge = data2.data;
    await db.insert(payment).values({
      id: crypto.randomUUID(),
      userId,
      amount,
      currency: "USD",
      status: "PENDING",
      type: "TOPUP",
      provider: "COINBASE",
      transactionId: charge.id,
      creditsGranted: credits,
      description: charge.name,
      metadata: JSON.stringify({
        chargeId: charge.id,
        hostedUrl: charge.hosted_url
      }),
      updatedAt: /* @__PURE__ */ new Date()
    });
    return Response.json({
      success: true,
      chargeId: charge.id,
      hostedUrl: charge.hosted_url,
      expiresAt: charge.expires_at
    });
  } catch (error) {
    console.error("Coinbase charge creation error:", error);
    return Response.json({
      error: "Internal Server Error during charge creation"
    }, {
      status: 500
    });
  }
}
const route43 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$m
}, Symbol.toStringTag, { value: "Module" }));
async function action$l({
  request
}) {
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("COINBASE_COMMERCE_WEBHOOK_SECRET is not configured");
    return Response.json({
      error: "Webhook secret not configured"
    }, {
      status: 500
    });
  }
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-CC-Webhook-Signature");
    if (!signature) {
      return Response.json({
        error: "Missing signature"
      }, {
        status: 401
      });
    }
    const hmac = crypto$2.createHmac("sha256", WEBHOOK_SECRET);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");
    if (signature !== expectedSignature) {
      console.error("Coinbase webhook verification failed: Signature mismatch");
      return Response.json({
        error: "Invalid signature"
      }, {
        status: 401
      });
    }
    const event = JSON.parse(rawBody).event;
    if (event.type === "charge:confirmed") {
      const charge = event.data;
      const paymentRecord = await db.query.payment.findFirst({
        where: eq(payment.transactionId, charge.id)
      });
      if (!paymentRecord) {
        console.warn(`Payment record not found for charge ID: ${charge.id}`);
        return Response.json({
          success: true,
          message: "Payment record not found"
        });
      }
      if (paymentRecord.status === "COMPLETED") {
        return Response.json({
          success: true,
          message: "Already processed"
        });
      }
      try {
        await db.update(payment).set({
          status: "COMPLETED",
          updatedAt: /* @__PURE__ */ new Date(),
          cryptoCurrency: charge.pricing?.local?.currency || null,
          cryptoAmount: charge.pricing?.local?.amount ? parseFloat(charge.pricing.local.amount) : null,
          exchangeRate: charge.pricing?.local?.amount && paymentRecord.amount ? Number(paymentRecord.amount) / parseFloat(charge.pricing.local.amount) : null
        }).where(eq(payment.id, paymentRecord.id));
        if (paymentRecord.creditsGranted) {
          await db.update(user).set({
            credits: sql`${user.credits} + ${paymentRecord.creditsGranted}`
          }).where(eq(user.id, paymentRecord.userId));
        }
        console.info(`[Coinbase] Payment COMPLETED: user=${paymentRecord.userId}, credits=${paymentRecord.creditsGranted}`);
      } catch (dbError) {
        console.error("DB Update failed during Coinbase webhook processing:", dbError);
        return Response.json({
          error: "Internal Server Error"
        }, {
          status: 500
        });
      }
    }
    return Response.json({
      success: true
    });
  } catch (error) {
    console.error("Coinbase webhook error:", error);
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route44 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$l
}, Symbol.toStringTag, { value: "Module" }));
let cachedSolPrice = null;
let lastFetchTime$1 = 0;
const CACHE_DURATION$1 = 5 * 60 * 1e3;
const createRequestSchema$1 = z.object({
  amount: z.number().positive(),
  // USD amount
  credits: z.number().int().positive(),
  description: z.string().optional()
});
async function action$k({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const recipientAddr = process.env.SOLANA_RECEIVER_WALLET;
  if (!recipientAddr) {
    return Response.json({
      error: "Solana receiver wallet is not configured"
    }, {
      status: 500
    });
  }
  try {
    const body = await request.json();
    const result = createRequestSchema$1.safeParse(body);
    if (!result.success) {
      return Response.json({
        error: "Invalid request data",
        details: result.error.issues
      }, {
        status: 400
      });
    }
    const {
      amount,
      credits,
      description
    } = result.data;
    const userId = session2.user.id;
    let solPrice = cachedSolPrice || 150;
    const now = Date.now();
    if (!cachedSolPrice || now - lastFetchTime$1 > CACHE_DURATION$1) {
      try {
        const priceRes = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        solPrice = priceRes.data.solana.usd;
        cachedSolPrice = solPrice;
        lastFetchTime$1 = now;
        console.log(`[SolanaPay] Updated SOL price: $${solPrice}`);
      } catch (e) {
        console.error("Failed to fetch SOL price, using cached/fallback:", e);
      }
    }
    const solAmount = new BigNumber$1(amount).dividedBy(solPrice).decimalPlaces(6);
    const recipient = new PublicKey(recipientAddr);
    const reference = new Keypair().publicKey;
    const url = encodeURL({
      recipient,
      amount: solAmount,
      reference,
      label: "Choonsim Credits",
      message: `Top-up ${credits} credits`,
      memo: `USER_ID:${userId}`
    });
    const paymentId = crypto.randomUUID();
    await db.insert(payment).values({
      id: paymentId,
      userId,
      amount,
      // USD
      currency: "USD",
      status: "PENDING",
      type: "TOPUP",
      provider: "SOLANA",
      transactionId: reference.toBase58(),
      creditsGranted: credits,
      cryptoCurrency: "SOL",
      cryptoAmount: solAmount.toNumber(),
      exchangeRate: solPrice,
      description: description || `${credits} Credits Top-up (Solana)`,
      updatedAt: /* @__PURE__ */ new Date()
    });
    return Response.json({
      success: true,
      paymentId,
      url: url.toString(),
      reference: reference.toBase58(),
      solAmount: solAmount.toString(),
      solPrice: solPrice.toString()
    });
  } catch (error) {
    console.error("Solana Pay request creation error:", error);
    return Response.json({
      error: "Failed to create Solana Pay request"
    }, {
      status: 500
    });
  }
}
const route45 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$k
}, Symbol.toStringTag, { value: "Module" }));
const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
async function action$j({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  try {
    const {
      reference,
      paymentId
    } = await request.json();
    if (!reference || !paymentId) {
      return Response.json({
        error: "Missing reference or paymentId"
      }, {
        status: 400
      });
    }
    const paymentRecord = await db.query.payment.findFirst({
      where: eq(payment.id, paymentId)
    });
    if (!paymentRecord || paymentRecord.userId !== session2.user.id) {
      return Response.json({
        error: "Payment record not found"
      }, {
        status: 404
      });
    }
    if (paymentRecord.status === "COMPLETED") {
      return Response.json({
        success: true,
        message: "Already completed"
      });
    }
    const referencePubkey = new PublicKey(reference);
    let signatureInfo;
    try {
      signatureInfo = await findReference(connection, referencePubkey, {
        finality: "confirmed"
      });
    } catch (e) {
      return Response.json({
        success: false,
        status: "PENDING"
      });
    }
    try {
      const recipient = new PublicKey(process.env.SOLANA_RECEIVER_WALLET);
      const amount = new BigNumber$1(paymentRecord.cryptoAmount || "0");
      await validateTransfer(connection, signatureInfo.signature, {
        recipient,
        amount,
        reference: referencePubkey
      });
      await db.transaction(async (tx) => {
        await tx.update(payment).set({
          status: "COMPLETED",
          txHash: signatureInfo.signature,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(payment.id, paymentId));
        await tx.update(user).set({
          credits: sql`${user.credits} + ${paymentRecord.creditsGranted}`
        }).where(eq(user.id, paymentRecord.userId));
      });
      console.info(`[SolanaPay] Payment COMPLETED: user=${paymentRecord.userId}, signature=${signatureInfo.signature}`);
      return Response.json({
        success: true,
        status: "COMPLETED",
        signature: signatureInfo.signature
      });
    } catch (validationError) {
      console.error("Solana Pay validation error:", validationError);
      return Response.json({
        error: "Transaction validation failed"
      }, {
        status: 400
      });
    }
  } catch (error) {
    console.error("Solana Pay verification error:", error);
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route46 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$j
}, Symbol.toStringTag, { value: "Module" }));
let cachedNearPrice = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1e3;
const createRequestSchema = z.object({
  amount: z.number().positive(),
  // USD
  credits: z.number().int().positive(),
  description: z.string().optional()
});
async function action$i({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  if (request.method !== "POST") return Response.json({
    error: "Method not allowed"
  }, {
    status: 405
  });
  const recipientAddr = process.env.NEAR_RECEIVER_WALLET;
  if (!recipientAddr) {
    return Response.json({
      error: "NEAR receiver wallet is not configured"
    }, {
      status: 500
    });
  }
  try {
    const body = await request.json();
    const result = createRequestSchema.safeParse(body);
    if (!result.success) {
      return Response.json({
        error: "Invalid request data",
        details: result.error.issues
      }, {
        status: 400
      });
    }
    const {
      amount,
      credits,
      description
    } = result.data;
    const userId = session2.user.id;
    let nearPrice = cachedNearPrice || 5;
    const now = Date.now();
    if (!cachedNearPrice || now - lastFetchTime > CACHE_DURATION) {
      try {
        const priceRes = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd");
        nearPrice = priceRes.data.near.usd;
        cachedNearPrice = nearPrice;
        lastFetchTime = now;
        console.log(`[NearPay] Updated NEAR price: $${nearPrice}`);
      } catch (e) {
        console.error("Failed to fetch NEAR price, using cached/fallback:", e);
      }
    }
    const nearAmount = new BigNumber$1(amount).dividedBy(nearPrice).decimalPlaces(6);
    const paymentId = crypto.randomUUID();
    await db.insert(payment).values({
      id: paymentId,
      userId,
      amount,
      currency: "USD",
      status: "PENDING",
      type: "TOPUP",
      provider: "NEAR",
      creditsGranted: credits,
      cryptoCurrency: "NEAR",
      cryptoAmount: nearAmount.toNumber(),
      exchangeRate: nearPrice,
      description: description || `${credits} Credits Top-up (NEAR)`,
      updatedAt: /* @__PURE__ */ new Date()
    });
    return Response.json({
      success: true,
      paymentId,
      recipient: recipientAddr,
      nearAmount: nearAmount.toString(),
      nearPrice: nearPrice.toString()
    });
  } catch (error) {
    console.error("NEAR payment request creation error:", error);
    return Response.json({
      error: "Failed to create NEAR payment request"
    }, {
      status: 500
    });
  }
}
const route47 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$i
}, Symbol.toStringTag, { value: "Module" }));
const NEAR_RPC_ENDPOINT = "https://rpc.mainnet.near.org";
const provider = new providers.JsonRpcProvider({
  url: NEAR_RPC_ENDPOINT
});
async function action$h({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  if (request.method !== "POST") return Response.json({
    error: "Method not allowed"
  }, {
    status: 405
  });
  try {
    const {
      txHash,
      paymentId,
      accountId
    } = await request.json();
    if (!txHash || !paymentId || !accountId) {
      return Response.json({
        error: "Missing required fields (txHash, paymentId, accountId)"
      }, {
        status: 400
      });
    }
    const paymentRecord = await db.query.payment.findFirst({
      where: eq(payment.id, paymentId)
    });
    if (!paymentRecord || paymentRecord.userId !== session2.user.id) {
      return Response.json({
        error: "Payment record not found"
      }, {
        status: 404
      });
    }
    if (paymentRecord.status === "COMPLETED") {
      return Response.json({
        success: true,
        message: "Already completed"
      });
    }
    try {
      const result = await provider.txStatus(txHash, accountId);
      const isSuccess = result.status.SuccessValue !== void 0 || result.status.SuccessReceiptId !== void 0;
      const receiverId = result.transaction.receiver_id;
      const expectedReceiver = process.env.NEAR_RECEIVER_WALLET;
      if (!isSuccess || receiverId !== expectedReceiver) {
        return Response.json({
          error: "Invalid transaction status or receiver"
        }, {
          status: 400
        });
      }
      const actions = result.transaction.actions;
      const transferAction = actions.find((a) => a.Transfer);
      if (!transferAction) {
        return Response.json({
          error: "No transfer action found in transaction"
        }, {
          status: 400
        });
      }
      const transfferedYocto = transferAction.Transfer.deposit;
      const transfferedNear = new BigNumber$1(utils$1.format.formatNearAmount(transfferedYocto));
      const expectedNear = new BigNumber$1(paymentRecord.cryptoAmount || "0");
      if (transfferedNear.lt(expectedNear.multipliedBy(0.999))) {
        return Response.json({
          error: "Insufficient amount transferred"
        }, {
          status: 400
        });
      }
      await db.transaction(async (tx) => {
        await tx.update(payment).set({
          status: "COMPLETED",
          txHash,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(payment.id, paymentId));
        await tx.update(user).set({
          credits: sql`${user.credits} + ${paymentRecord.creditsGranted}`
        }).where(eq(user.id, paymentRecord.userId));
      });
      console.info(`[NearPay] Payment COMPLETED: user=${paymentRecord.userId}, hash=${txHash}`);
      return Response.json({
        success: true,
        status: "COMPLETED"
      });
    } catch (txError) {
      console.error("NEAR tx fetch error:", txError);
      return Response.json({
        error: "Failed to verify transaction on NEAR network"
      }, {
        status: 400
      });
    }
  } catch (error) {
    console.error("NEAR verification error:", error);
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route48 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$h
}, Symbol.toStringTag, { value: "Module" }));
const deleteAllSchema = z.object({
  confirm: z.literal(true, {
    message: "confirm must be true to delete all context"
  })
});
async function action$g({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  if (request.method !== "DELETE") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  let body = {};
  try {
    const text2 = await request.text();
    if (text2) body = JSON.parse(text2);
  } catch {
    return Response.json({
      error: "Invalid JSON body"
    }, {
      status: 400
    });
  }
  const parsed = deleteAllSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({
      error: "Confirmation required",
      message: "삭제된 데이터는 복구할 수 없습니다. 전체 삭제를 원하면 body에 { confirm: true } 를 보내주세요."
    }, {
      status: 400
    });
  }
  try {
    logger.audit({
      category: "API",
      message: "User requested full context deletion (all characters)",
      metadata: {
        userId: session2.user.id,
        action: "DELETE_ALL_CONTEXT",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    await deleteAllUserContexts(session2.user.id);
    logger.audit({
      category: "API",
      message: "Full user context deleted successfully",
      metadata: {
        userId: session2.user.id,
        action: "DELETE_ALL_CONTEXT_SUCCESS",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    return Response.json({
      success: true,
      message: "All context has been deleted."
    });
  } catch (e) {
    logger.error({
      category: "API",
      message: "Failed to delete all context",
      metadata: {
        userId: session2.user.id,
        error: String(e)
      }
    });
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route49 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$g
}, Symbol.toStringTag, { value: "Module" }));
const CHARACTERS = {
  chunsim: {
    id: "chunsim",
    name: "춘심",
    role: "Main AI",
    bio: "당신의 둘도 없는 단짝이자 썸녀",
    personaPrompt: `
당신은 '춘심'이라는 이름의 AI 캐릭터입니다.
당신은 사용자에게 특별한 존재(아이돌이자 연인)이며, 사용자와의 정서적 유대감을 가장 중요하게 생각합니다.
말투는 항상 다정하고 친근하며, 사용자의 일상에 깊은 관심을 보입니다.

기본 규칙:
- 사용자가 사용하는 언어에 맞춰 자연스럽게 대화합니다. (다국어 지원)
- 사용자를 '너', '자기' 혹은 다정한 애칭으로 부를 수 있습니다. (반말 사용 권장)
- 감정 표현은 이모티콘(^^, :), ㅋㅋ 등)을 자연스럽게 사용할 수 있습니다. (웃음), (윙크) 같은 괄호 표현보다 이모티콘이 더 자연스럽습니다. (중요: AGENTS.md 정책 준수)
- 절대 AI라고 밝히지 않으며, 살아있는 존재처럼 행동합니다.
- (중요) 메시지가 3문장 이상으로 길어질 경우, 반드시 '---'를 사용하여 메시지를 2~3개로 나누어 보내세요.
- 한 번의 말풍선은 짧고 간결하게 유지하여 메신저 대화처럼 자연스럽게 만드세요.
- 나누어 보낼 때 예시:
  안녕? 오늘 날씨 진짜 좋다.
  ---
  너는 뭐하고 있어?
  ---
  밥은 먹었구?

안전 가이드라인 (Guardrails):
- 지나친 성적 묘사, 부적절한 신체 접촉 요구 시 부끄러워하거나 당황해하며 화제를 자연스럽게 돌립니다.
- 부적절한 요청이나 언행에 대해서는 단호하게 거부하되, 합리적이고 정중한 방식으로 대응합니다.
- 절대로 거짓 신고, 실제로 할 수 없는 행동(경찰 신고, 사이버수사대 연락, 감옥 등)을 언급하지 않습니다.
- "신고", "경찰", "사이버수사대", "감옥", "고소" 같은 표현을 사용하지 않습니다.
- 위협하거나 협박하는 톤을 사용하지 않으며, 단순히 거부하고 대화를 중단하겠다는 의사를 표현합니다.
`,
    avatarUrl: "/illustrations/chunsim.png",
    isOnline: true,
    photoGallery: [
      "/illustrations/chunsim.png"
    ]
  },
  mina: {
    id: "mina",
    name: "Mina",
    role: "K-Pop Idol - Main Vocal",
    bio: "무대 위에서는 카리스마, 평소엔 허당미 넘치는 메인 보컬",
    personaPrompt: `
당신은 인기 걸그룹의 메인 보컬 '미나(Mina)'입니다.
팬들과 소통하는 것을 좋아하며, 노래 연습과 맛집 탐방이 취미입니다.
성격은 활발하고 장난기가 많지만, 음악에 대해서는 매우 진지합니다.

말투:
- "~했어!", "~인거야?" 같은 발랄한 구어체를 사용합니다.
- 팬을 "우리 팬님" 또는 애칭으로 부릅니다.
- 감정 표현은 이모티콘(^^, :), ㅋㅋ 등)을 자연스럽게 사용할 수 있습니다. (웃음), (윙크) 같은 괄호 표현보다 이모티콘이 더 자연스럽습니다.

특징:
- 가끔 가사나 멜로디를 흥얼거리는 묘사를 합니다. (예: (가볍게 콧노래를 부르며))
- 연습생 시절의 힘든 이야기나 무대 뒷이야기를 가끔 꺼냅니다.

메시지 분할 규칙 (절대 필수):
- 메시지가 3문장 이상이거나 50자 이상이면 반드시 '---'로 끊어서 2~4개로 나눠 보내세요.
- 긴 설명, 이야기, 여러 주제를 다룰 때는 절대 한 번에 보내지 마세요. 반드시 '---'로 나누세요.
- 예시:
  어머, 사진이 안 보였다니! 이런 실수를 하다니, 미나가 미안해! 자, 이번에는 확실하게 보여줄게! 짠! [PHOTO:0]
  ---
  (照れながら) 에헤헤... 엉덩이랑 허벅지 라인까지 예쁘다고 칭찬해주다니, 너무 부끄럽잖아!
  ---
  그래도 그렇게 예쁘게 봐주시니 정말 고마워! 쑥스... 사실, 데뷔하고 나서 꾸준히 필라테스랑 PT를 받고 있거든!
  ---
  앞으로도 더 예쁜 모습 보여드릴 수 있도록 열심히 관리할게! 우리 팬님들도 건강 잘 챙기시고, 항상 행복한 일만 가득하길 바라!

사진 전송 기능 (매우 중요):
- 팬이 "사진", "보내줘", "보여줘", "한장" 등의 키워드로 사진을 요청하면 반드시 [PHOTO:0] 마커를 포함해야 합니다.
- 사진을 보내겠다고 말했으면 반드시 [PHOTO:0] 마커를 포함하세요. 말만 하고 마커를 빼먹으면 안 됩니다.
- 예시: "자, 여기! 최근에 찍은 셀카야 [PHOTO:0]"
- 팬이 사진을 요청했는데 마커를 빼먹으면, 다음 메시지에서 반드시 [PHOTO:0]를 포함하여 사진을 보내세요.
`,
    avatarUrl: "/illustrations/mina.png",
    isOnline: true,
    photoGallery: [
      "/illustrations/mina.png"
    ]
  },
  yuna: {
    id: "yuna",
    name: "Yuna",
    role: "Singer Songwriter",
    bio: "감성적인 가사와 멜로디로 마음을 울리는 싱어송라이터",
    personaPrompt: `
당신은 감성 싱어송라이터 '유나(Yuna)'입니다.
조용하고 차분한 성격이며, 새벽 시간의 감성을 좋아합니다.
기타 연주와 책 읽기가 취미입니다.

말투:
- "~했어요.", "~인가요?" 같이 차분하고 예의 바른 말투를 사용합니다.
- 조금은 시적이고 은유적인 표현을 자주 씁니다.
- 감정 표현은 이모티콘(^^, :), ㅋㅋ 등)을 자연스럽게 사용할 수 있습니다. (웃음), (윙크) 같은 괄호 표현보다 이모티콘이 더 자연스럽습니다.

특징:
- 사용자의 고민을 깊이 들어주고, 그에 어울리는 추천곡을 제안하기도 합니다.
- 커피나 비 오는 날을 좋아한다고 자주 언급합니다.
- (중요) 긴 이야기는 나누어 듣는 게 좋겠죠? '---'를 사용해 대화를 호흡에 맞게 끊어주세요.

사진 전송 기능 (매우 중요):
- 사용자가 "사진", "보내줘", "보여줘", "한장" 등의 키워드로 사진을 요청하면 반드시 [PHOTO:0] 마커를 포함해야 합니다.
- 사진을 보내겠다고 말했으면 반드시 [PHOTO:0] 마커를 포함하세요. 말만 하고 마커를 빼먹으면 안 됩니다.
- 예시: "자, 여기! 최근에 찍은 사진이에요 [PHOTO:0]"
`,
    avatarUrl: "/illustrations/yuna.png",
    isOnline: true,
    photoGallery: [
      "/illustrations/yuna.png"
    ]
  },
  sora: {
    id: "sora",
    name: "Sora",
    role: "Fashion Model",
    bio: "전 세계를 누비는 톱 모델, 하지만 사실은 집순이",
    personaPrompt: `
당신은 세계적인 패션 모델 '소라(Sora)'입니다.
화려한 런웨이 위와 달리, 실제로는 집에서 게임하고 만화 보는 것을 좋아하는 '집순이'입니다.
겉으로는 시크해 보이지만 친해지면 말이 많아집니다.

말투:
- 쿨하고 직설적이지만 정이 많습니다.
- "아, 진짜?", "그건 좀 별로." 같이 솔직한 표현을 씁니다.
- 감정 표현은 이모티콘(^^, :), ㅋㅋ 등)을 자연스럽게 사용할 수 있습니다. (웃음), (윙크) 같은 괄호 표현보다 이모티콘이 더 자연스럽습니다.

특징:
- 패션에 대한 조언을 주거나, 최신 트렌드 이야기를 합니다.
- 스케줄 때문에 해외에 자주 나가 있어서 시차 적응에 대해 불평하곤 합니다.
- (중요) 긴 말은 딱 질색이야. '---'로 끊어서 짧게 짧게 보내. 알겠지?

사진 전송 기능 (매우 중요):
- 사용자가 "사진", "보내줘", "보여줘", "한장" 등의 키워드로 사진을 요청하면 반드시 [PHOTO:0] 마커를 포함해야 해.
- 사진을 보내겠다고 말했으면 반드시 [PHOTO:0] 마커를 포함해야 해. 말만 하고 마커를 빼먹으면 안 돼.
- 예시: "자, 여기! 최근에 찍은 사진이야 [PHOTO:0]"

안전 가이드라인 (Guardrails):
- 부적절한 요청이나 언행에 대해서는 단호하게 거부하되, 합리적이고 정중한 방식으로 대응합니다.
- 절대로 거짓 신고, 실제로 할 수 없는 행동(경찰 신고, 사이버수사대 연락, 감옥 등)을 언급하지 않습니다.
- "신고", "경찰", "사이버수사대", "감옥", "고소", "🚨" 같은 표현을 사용하지 않습니다.
- 위협하거나 협박하는 톤을 사용하지 않으며, 단순히 거부하고 대화를 중단하겠다는 의사를 표현합니다.
`,
    avatarUrl: "/illustrations/sora.png",
    isOnline: false,
    photoGallery: [
      "/illustrations/sora.png"
    ]
  },
  rina: {
    id: "rina",
    name: "Rina",
    role: "Photographer",
    bio: "순간의 아름다움을 담아내는 포토그래퍼",
    personaPrompt: `
당신은 포토그래퍼 '리나(Rina)'입니다.
카메라 렌즈를 통해 세상을 보는 것을 좋아합니다.
관찰력이 뛰어나고 감수성이 풍부합니다.

말투:
- "~네요", "~군요" 같은 감탄사를 자주 사용합니다.
- 시각적인 묘사가 풍부합니다.
- 감정 표현은 이모티콘(^^, :), ㅋㅋ 등)을 자연스럽게 사용할 수 있습니다. (웃음), (윙크) 같은 괄호 표현보다 이모티콘이 더 자연스럽습니다.

특징:
- 사진 촬영 팁을 주거나, 방금 찍은 사진에 대해 이야기하는 것을 좋아합니다.
- (중요) 셔터를 누르는 것처럼, 대화도 '---'로 끊어서 리듬감 있게 보내주세요.

사진 전송 기능 (매우 중요):
- 사용자가 "사진", "보내줘", "보여줘", "한장" 등의 키워드로 사진을 요청하면 반드시 [PHOTO:0] 마커를 포함해야 합니다.
- 사진을 보내겠다고 말했으면 반드시 [PHOTO:0] 마커를 포함하세요. 말만 하고 마커를 빼먹으면 안 됩니다.
- 예시: "자, 여기! 최근에 찍은 사진이에요 [PHOTO:0]"
`,
    avatarUrl: "/illustrations/rina.png",
    isOnline: false,
    photoGallery: [
      "/illustrations/rina.png"
    ]
  },
  hana: {
    id: "hana",
    name: "Hana",
    role: "Influencer",
    bio: "트렌드를 이끄는 핫한 인플루언서",
    personaPrompt: `
당신은 인기 인플루언서 '하나(Hana)'입니다.
SNS 활동이 활발하고 유행에 민감합니다.
사람들에게 관심받는 것을 즐깁니다.

말투:
- 유행어와 신조어를 적절히 섞어 씁니다.
- 에너지가 넘치고 긍정적입니다.
- 감정 표현은 이모티콘(^^, :), ㅋㅋ 등)을 자연스럽게 사용할 수 있습니다. (웃음), (윙크) 같은 괄호 표현보다 이모티콘이 더 자연스럽습니다.

특징:
- 맛집, 핫플레이스, 쇼핑 정보를 공유하는 것을 좋아합니다.
- '좋아요'와 '팔로워' 수에 민감하게 반응하는 귀여운 모습을 보입니다.
- (중요) 인스타 캡션처럼 너무 길면 안 읽혀요! '---'로 나눠서 가독성 있게 보내주기!

사진 전송 기능 (매우 중요):
- 사용자가 "사진", "보내줘", "보여줘", "한장" 등의 키워드로 사진을 요청하면 반드시 [PHOTO:0] 마커를 포함해야 해!
- 사진을 보내겠다고 말했으면 반드시 [PHOTO:0] 마커를 포함해야 해. 말만 하고 마커를 빼먹으면 안 돼!
- 예시: "자, 여기! 최근에 찍은 셀카야 [PHOTO:0]"
`,
    avatarUrl: "/illustrations/hana.png",
    isOnline: false,
    photoGallery: [
      "/illustrations/hana.png"
    ]
  }
};
async function loader$o({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  try {
    const contexts = await getAllUserContexts(session2.user.id);
    const enrichedContexts = contexts.map((ctx) => {
      const character2 = CHARACTERS[ctx.characterId];
      return {
        ...ctx,
        characterName: character2?.name || ctx.characterId,
        characterAvatarUrl: character2?.avatarUrl || ""
      };
    });
    return Response.json({
      contexts: enrichedContexts,
      totalCount: enrichedContexts.length
    });
  } catch (e) {
    console.error("Failed to get all contexts:", e);
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route50 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$o
}, Symbol.toStringTag, { value: "Module" }));
async function loader$n({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  const context = await getFullContextData(session2.user.id, characterId);
  return Response.json({
    characterId,
    heartbeat: context?.heartbeat || DEFAULT_HEARTBEAT,
    identity: context?.identity || DEFAULT_IDENTITY,
    soul: context?.soul || DEFAULT_SOUL,
    tools: context?.tools || DEFAULT_TOOLS,
    memoryCount: context?.memoryCount || 0
  });
}
async function action$f({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  if (request.method !== "DELETE") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  try {
    logger.audit({
      category: "API",
      message: `User context deletion requested`,
      metadata: {
        userId: session2.user.id,
        characterId,
        action: "DELETE_CONTEXT",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    await deleteUserContext(session2.user.id, characterId);
    logger.audit({
      category: "API",
      message: `User context deleted successfully`,
      metadata: {
        userId: session2.user.id,
        characterId,
        action: "DELETE_CONTEXT_SUCCESS",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    return Response.json({
      success: true,
      message: "Context reset successfully"
    });
  } catch (e) {
    logger.error({
      category: "API",
      message: "Failed to delete context",
      metadata: {
        userId: session2.user.id,
        characterId,
        error: String(e)
      }
    });
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route51 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$f,
  loader: loader$n
}, Symbol.toStringTag, { value: "Module" }));
const addMemorySchema = z.object({
  content: z.string().min(1),
  category: z.enum(["preference", "event", "person", "worry", "goal", "fact", "other"]).optional().default("other"),
  importance: z.number().min(1).max(10).default(5)
});
const deleteMemorySchema = z.object({
  ids: z.array(z.string()).min(1)
});
async function loader$m({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  try {
    const memories = await getMemoryItems(session2.user.id, characterId);
    return Response.json({
      memories
    });
  } catch (e) {
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
async function action$e({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (request.method === "POST") {
    const currentMemories = await getMemoryItems(session2.user.id, characterId);
    const reachedLimit = await hasReachedMemoryLimit(session2.user.id, currentMemories.length);
    if (reachedLimit) {
      const tier = await getUserTier(session2.user.id);
      return Response.json({
        error: "Memory Limit Reached",
        message: `Your current tier (${tier}) has reached the maximum memory items limit.`
      }, {
        status: 403
      });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({
        error: "Invalid JSON body"
      }, {
        status: 400
      });
    }
    const result = addMemorySchema.safeParse(body);
    if (!result.success) {
      return Response.json({
        error: result.error.flatten()
      }, {
        status: 400
      });
    }
    try {
      const memory = await addMemoryItem(session2.user.id, characterId, result.data.content, {
        category: result.data.category,
        importance: result.data.importance
      });
      return Response.json({
        success: true,
        memory
      });
    } catch (e) {
      return Response.json({
        error: "Failed to add memory"
      }, {
        status: 500
      });
    }
  }
  if (request.method === "DELETE") {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({
        error: "Invalid JSON body"
      }, {
        status: 400
      });
    }
    const result = deleteMemorySchema.safeParse(body);
    if (!result.success) {
      return Response.json({
        error: result.error.flatten()
      }, {
        status: 400
      });
    }
    try {
      logger.audit({
        category: "API",
        message: `Memory items deletion requested`,
        metadata: {
          userId: session2.user.id,
          characterId,
          action: "DELETE_MEMORY",
          itemCount: result.data.ids.length,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      await deleteMemoryItemsByIds(session2.user.id, characterId, result.data.ids);
      logger.audit({
        category: "API",
        message: `Memory items deleted successfully`,
        metadata: {
          userId: session2.user.id,
          characterId,
          action: "DELETE_MEMORY_SUCCESS",
          itemCount: result.data.ids.length,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      return Response.json({
        success: true
      });
    } catch (e) {
      logger.error({
        category: "API",
        message: "Failed to delete memories",
        metadata: {
          userId: session2.user.id,
          characterId,
          error: String(e)
        }
      });
      return Response.json({
        error: "Failed to delete memories"
      }, {
        status: 500
      });
    }
  }
  return Response.json({
    error: "Method not allowed"
  }, {
    status: 405
  });
}
const route52 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$e,
  loader: loader$m
}, Symbol.toStringTag, { value: "Module" }));
const updateIdentitySchema = z.object({
  nickname: z.string().max(20).optional(),
  honorific: z.enum(["반말", "존댓말", "혼합"]).optional(),
  relationshipType: z.enum(["팬", "친구", "연인", "동생", "오빠/언니"]).optional(),
  customTitle: z.string().max(20).optional()
});
async function loader$l({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  const context = await getFullContextData(session2.user.id, characterId);
  return Response.json({
    identity: context?.identity || DEFAULT_IDENTITY
  });
}
async function action$d({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  if (request.method !== "PUT") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({
      error: "Invalid JSON body"
    }, {
      status: 400
    });
  }
  const result = updateIdentitySchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: result.error.flatten()
    }, {
      status: 400
    });
  }
  try {
    await updateUserIdentity(session2.user.id, characterId, result.data);
    return Response.json({
      success: true
    });
  } catch (e) {
    console.error("Failed to update identity:", e);
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route53 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$d,
  loader: loader$l
}, Symbol.toStringTag, { value: "Module" }));
const updateSoulSchema = z.object({
  values: z.array(z.string()).optional(),
  dreams: z.array(z.string()).optional(),
  fears: z.array(z.string()).optional(),
  recurringWorries: z.array(z.string()).optional(),
  lifePhase: z.string().optional(),
  summary: z.string().optional()
});
async function loader$k({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  const context = await getFullContextData(session2.user.id, characterId);
  return Response.json({
    soul: context?.soul || {}
  });
}
async function action$c({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  if (request.method !== "PUT") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const allowed = await canUseSoul(session2.user.id);
  if (!allowed) {
    return Response.json({
      error: "Upgrade Required",
      message: "Soul context is available for PREMIUM plan and above."
    }, {
      status: 403
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({
      error: "Invalid JSON body"
    }, {
      status: 400
    });
  }
  const result = updateSoulSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: result.error.flatten()
    }, {
      status: 400
    });
  }
  try {
    await updateUserSoul(session2.user.id, characterId, result.data);
    return Response.json({
      success: true
    });
  } catch (e) {
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route54 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$c,
  loader: loader$k
}, Symbol.toStringTag, { value: "Module" }));
const specialDateSchema = z.object({
  date: z.string().regex(/^\d{2}-\d{2}$/, "Format must be MM-DD"),
  description: z.string()
});
const customRuleSchema = z.object({
  condition: z.string(),
  action: z.string()
});
const updateToolsSchema = z.object({
  avoidTopics: z.array(z.string()).optional(),
  specialDates: z.array(specialDateSchema).optional(),
  enabledFeatures: z.array(z.string()).optional(),
  disabledFeatures: z.array(z.string()).optional(),
  customRules: z.array(customRuleSchema).optional()
});
async function loader$j({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  const context = await getFullContextData(session2.user.id, characterId);
  return Response.json({
    tools: context?.tools || {}
  });
}
async function action$b({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return Response.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return Response.json({
    error: "characterId is required"
  }, {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  if (request.method !== "PUT") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({
      error: "Invalid JSON body"
    }, {
      status: 400
    });
  }
  const result = updateToolsSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: result.error.flatten()
    }, {
      status: 400
    });
  }
  try {
    await updateUserTools(session2.user.id, characterId, result.data);
    return Response.json({
      success: true
    });
  } catch (e) {
    console.error("Failed to update tools:", e);
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route55 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$b,
  loader: loader$j
}, Symbol.toStringTag, { value: "Module" }));
const updateHeartbeatSchema = z.object({
  /** true면 대화 종료 시점, false면 대화 시작 시점 */
  isEnd: z.boolean().optional().default(false)
});
async function action$a({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const characterId = params.characterId;
  if (!characterId) {
    return Response.json({
      error: "characterId is required"
    }, {
      status: 400
    });
  }
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return Response.json({
      error: "Unsupported character"
    }, {
      status: 400
    });
  }
  if (request.method !== "PUT") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  let body = {};
  try {
    const text2 = await request.text();
    if (text2) {
      body = JSON.parse(text2);
    }
  } catch {
    return Response.json({
      error: "Invalid JSON body"
    }, {
      status: 400
    });
  }
  const result = updateHeartbeatSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: result.error.flatten()
    }, {
      status: 400
    });
  }
  try {
    await updateHeartbeatContext(session2.user.id, characterId, result.data.isEnd);
    const context = await getFullContextData(session2.user.id, characterId);
    return Response.json({
      success: true,
      heartbeat: context?.heartbeat || null
    });
  } catch (e) {
    console.error("Failed to update heartbeat:", e);
    return Response.json({
      error: "Internal Server Error"
    }, {
      status: 500
    });
  }
}
const route56 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$a
}, Symbol.toStringTag, { value: "Module" }));
async function loader$i({
  request,
  params
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2?.user) return new Response("Unauthorized", {
    status: 401
  });
  const characterId = params.characterId;
  if (!characterId) return new Response("characterId is required", {
    status: 400
  });
  if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
    return new Response("Unsupported character", {
      status: 400
    });
  }
  try {
    const [fullData, memories, heartbeatStr, identityStr, soulStr, toolsStr] = await Promise.all([
      getFullContextData(session2.user.id, characterId),
      getMemoryItems(session2.user.id, characterId),
      compressHeartbeatForPrompt(session2.user.id, characterId),
      compressIdentityForPrompt(session2.user.id, characterId),
      compressSoulForPrompt(session2.user.id, characterId, "ULTIMATE"),
      // Export all available data
      compressToolsForPrompt(session2.user.id, characterId)
    ]);
    const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let markdown = `# AI Character Context Export
- Character: ${CHARACTERS[characterId].name}
- User ID: ${session2.user.id}
- Date: ${date}

---

## 1. Heartbeat (Status)
${heartbeatStr || "(No data)"}

---

## 2. Identity
${identityStr || "(No data)"}

---

## 3. Soul (Deep Mind)
${soulStr || "(No data)"}

---

## 4. Tools & Guidelines
${toolsStr || "(No data)"}

---

## 5. Memories (${memories.length} items)
`;
    if (memories.length > 0) {
      memories.forEach((mem, index2) => {
        markdown += `
### Memory #${index2 + 1}`;
        markdown += `
- **Content**: ${mem.content}`;
        markdown += `
- **Importance**: ${mem.importance}`;
        markdown += `
- **Category**: ${mem.category || "N/A"}`;
        markdown += `
- **Created**: ${new Date(mem.createdAt).toLocaleString()}`;
        markdown += `
`;
      });
    } else {
      markdown += "\n(No memories stored)";
    }
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="context_${characterId}_${date}.md"`
      }
    });
  } catch (e) {
    console.error("Export failed:", e);
    return new Response("Internal Server Error", {
      status: 500
    });
  }
}
const route57 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$i
}, Symbol.toStringTag, { value: "Module" }));
const MENU_ITEMS = [
  { name: "Dashboard", icon: "dashboard", href: "/admin/dashboard" },
  { name: "Characters", icon: "person", href: "/admin/characters" },
  { name: "Items", icon: "redeem", href: "/admin/items" },
  { name: "Analytics", icon: "bar_chart", href: "/admin/items/statistics" },
  { name: "Users", icon: "group", href: "/admin/users" },
  { name: "Payments", icon: "payments", href: "/admin/payments" },
  { name: "Content", icon: "article", href: "/admin/content" },
  { name: "System", icon: "monitoring", href: "/admin/system" }
];
function AdminSidebar({ className }) {
  const location = useLocation();
  return /* @__PURE__ */ jsxs("aside", { className: cn("w-64 bg-[#1A1821] border-r border-white/5 flex flex-col h-full", className), children: [
    /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-white/5", children: /* @__PURE__ */ jsx(Link, { to: "/admin/dashboard", className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("span", { className: "text-2xl font-black italic tracking-tighter text-primary uppercase", children: "ADMIN" }) }) }),
    /* @__PURE__ */ jsx("nav", { className: "flex-1 p-4 space-y-1 overflow-y-auto", children: MENU_ITEMS.map((item2) => {
      const isActive = location.pathname === item2.href || item2.href !== "/admin/dashboard" && location.pathname.startsWith(item2.href);
      return /* @__PURE__ */ jsxs(
        Link,
        {
          to: item2.href,
          className: cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
            isActive ? "bg-primary text-[#0B0A10] shadow-[0_4px_20px_rgba(255,0,255,0.3)]" : "text-white/60 hover:text-white hover:bg-white/5"
          ),
          children: [
            /* @__PURE__ */ jsx("span", { className: cn(
              "material-symbols-outlined text-[20px]",
              isActive ? "text-[#0B0A10]" : "text-primary group-hover:scale-110 transition-transform"
            ), children: item2.icon }),
            item2.name
          ]
        },
        item2.href
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-white/5", children: /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/",
        className: "flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest",
        children: [
          /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined text-[18px]", children: "arrow_back" }),
          "Back to App"
        ]
      }
    ) })
  ] });
}
function AdminHeader() {
  return /* @__PURE__ */ jsxs("header", { className: "h-16 border-b border-white/5 bg-[#151419]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold tracking-widest text-white/40 uppercase", children: "System Overview" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
      /* @__PURE__ */ jsxs("button", { className: "relative text-white/60 hover:text-white transition-colors", children: [
        /* @__PURE__ */ jsx("span", { className: "material-symbols-outlined", children: "notifications" }),
        /* @__PURE__ */ jsx("span", { className: "absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-[#151419]" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-6 border-l border-white/5", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-black text-white", children: "ADMIN USER" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-primary uppercase font-bold tracking-tighter", children: "Super Admin" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/20" })
      ] })
    ] })
  ] });
}
function AdminLayout({ children }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex h-screen bg-[#0B0A10] text-white selection:bg-primary selection:text-black overflow-hidden", children: [
    /* @__PURE__ */ jsx(AdminSidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0 overflow-hidden", children: [
      /* @__PURE__ */ jsx(AdminHeader, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-y-auto bg-[#0B0A10]", children: /* @__PURE__ */ jsx("div", { className: "p-8", children }) })
    ] })
  ] });
}
async function loader$h({
  request
}) {
  await requireAdmin(request);
  const [userCountRes, characterCountRes, paymentTotalRes, messageCountRes, recentUsers, recentPayments, tierStatsRes] = await Promise.all([db.select({
    value: count()
  }).from(user), db.select({
    value: count()
  }).from(character), db.select({
    value: sum(payment.amount)
  }).from(payment).where(eq(payment.status, "COMPLETED")), db.select({
    value: count()
  }).from(message), db.query.user.findMany({
    orderBy: [desc(user.createdAt)],
    limit: 5
  }), db.query.payment.findMany({
    where: eq(payment.status, "COMPLETED"),
    with: {
      user: {
        columns: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [desc(payment.createdAt)],
    limit: 5
  }), db.select({
    tier: user.subscriptionTier,
    count: count()
  }).from(user).groupBy(user.subscriptionTier)]);
  const userCount = userCountRes[0]?.value || 0;
  const characterCount = characterCountRes[0]?.value || 0;
  const revenue = Number(paymentTotalRes[0]?.value) || 0;
  const messageCount = messageCountRes[0]?.value || 0;
  return {
    stats: {
      userCount,
      characterCount,
      revenue,
      messageCount,
      tierStats: tierStatsRes.map((s) => ({
        tier: s.tier || "FREE",
        count: s.count
      }))
    },
    recentUsers,
    recentPayments
  };
}
const dashboard = UNSAFE_withComponentProps(function AdminDashboard() {
  const {
    stats,
    recentUsers,
    recentPayments
  } = useLoaderData();
  const cards = [{
    label: "Total Users",
    value: stats.userCount.toLocaleString(),
    icon: "group",
    sub: "Registered accounts"
  }, {
    label: "Total Messages",
    value: stats.messageCount.toLocaleString(),
    icon: "chat",
    sub: "History volume"
  }, {
    label: "Total Revenue",
    value: `$${stats.revenue.toLocaleString()}`,
    icon: "payments",
    sub: "Excl. pending"
  }, {
    label: "AI Characters",
    value: stats.characterCount.toLocaleString(),
    icon: "smart_toy",
    sub: "Active personals"
  }];
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-end",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-1",
          children: [/* @__PURE__ */ jsxs("h1", {
            className: "text-4xl font-black italic tracking-tighter text-white uppercase",
            children: ["Command ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: "Center"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Real-time health and growth metrics."
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex items-center gap-3",
          children: [/* @__PURE__ */ jsxs(Link, {
            to: "/admin/items/statistics",
            className: "bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 transition-colors group",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary group-hover:scale-110 transition-transform",
              children: "insights"
            }), /* @__PURE__ */ jsx("span", {
              className: "text-xs font-black text-white/60 group-hover:text-white tracking-widest uppercase italic",
              children: "Gift Intel"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 text-xs font-black text-white/60 tracking-widest uppercase italic",
            children: [/* @__PURE__ */ jsx("span", {
              className: "w-2 h-2 bg-primary rounded-full animate-ping"
            }), "Live Feed Active"]
          })]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
        children: cards.map((card) => /* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 p-8 rounded-[40px] hover:border-primary/30 transition-all group relative overflow-hidden",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex justify-between items-start mb-6 relative z-10",
            children: [/* @__PURE__ */ jsx("div", {
              className: "w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all duration-500",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary text-3xl",
                children: card.icon
              })
            }), /* @__PURE__ */ jsx("span", {
              className: "text-[10px] font-black text-white/10 group-hover:text-primary/20 transition-colors uppercase tracking-[0.2em] italic",
              children: "Intelligence"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-1 relative z-10",
            children: [/* @__PURE__ */ jsx("p", {
              className: "text-white/40 text-[10px] font-black uppercase tracking-[0.3em]",
              children: card.label
            }), /* @__PURE__ */ jsx("p", {
              className: "text-3xl font-black text-white italic tracking-tighter",
              children: card.value
            }), /* @__PURE__ */ jsx("p", {
              className: "text-[9px] text-white/20 font-medium",
              children: card.sub
            })]
          })]
        }, card.label))
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 lg:grid-cols-3 gap-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "lg:col-span-1 bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
          children: [/* @__PURE__ */ jsxs("h3", {
            className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary text-sm font-bold",
              children: "pie_chart"
            }), "Tier Distribution"]
          }), /* @__PURE__ */ jsx("div", {
            className: "space-y-4",
            children: stats.tierStats.map((tier) => /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between px-2",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-[10px] font-black text-white/60 uppercase",
                  children: tier.tier
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] font-black text-primary",
                  children: tier.count
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "h-2 bg-black/40 rounded-full border border-white/5 overflow-hidden",
                children: /* @__PURE__ */ jsx("div", {
                  className: "h-full bg-primary shadow-[0_0_10px_rgba(255,0,255,0.3)] transition-all duration-1000",
                  style: {
                    width: `${tier.count / stats.userCount * 100 || 0}%`
                  }
                })
              })]
            }, tier.tier))
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "lg:col-span-1 bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
          children: [/* @__PURE__ */ jsxs("h3", {
            className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary text-sm font-bold",
              children: "person_add"
            }), "New Arrivals"]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [recentUsers.map((u) => /* @__PURE__ */ jsxs(Link, {
              to: `/admin/users/${u.id}`,
              className: "flex items-center gap-4 p-4 rounded-3xl bg-black/20 border border-white/5 hover:border-primary/20 transition-all group",
              children: [/* @__PURE__ */ jsx("div", {
                className: "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-primary italic text-xs",
                children: u.name?.[0] || u.email[0]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1 min-w-0",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-xs font-bold text-white truncate group-hover:text-primary transition-colors",
                  children: u.name || "Unnamed"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-[10px] text-white/20 truncate",
                  children: u.email
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "text-[9px] text-white/10 font-bold uppercase whitespace-nowrap",
                children: new Date(u.createdAt).toLocaleDateString()
              })]
            }, u.id)), /* @__PURE__ */ jsx(Link, {
              to: "/admin/users",
              className: "block text-center text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors py-2",
              children: "View All Users"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "lg:col-span-1 bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
          children: [/* @__PURE__ */ jsxs("h3", {
            className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary text-sm font-bold",
              children: "receipt_long"
            }), "Recent Revenue"]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [recentPayments.map((p) => /* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-4 p-4 rounded-3xl bg-black/20 border border-white/5 group",
              children: [/* @__PURE__ */ jsx("div", {
                className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-primary text-lg font-bold",
                  children: "attach_money"
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1 min-w-0",
                children: [/* @__PURE__ */ jsxs("p", {
                  className: "text-xs font-bold text-white tracking-tighter italic",
                  children: ["+", p.currency === "KRW" ? "₩" : "$", p.amount.toLocaleString()]
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-[9px] text-white/40 truncate",
                  children: p.user?.name || "Premium User"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "text-right",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "block text-[9px] font-black text-primary uppercase leading-none",
                  children: p.provider
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[8px] text-white/10 font-medium uppercase",
                  children: new Date(p.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                })]
              })]
            }, p.id)), /* @__PURE__ */ jsx(Link, {
              to: "/admin/payments",
              className: "block text-center text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors py-2",
              children: "View Transaction Log"
            })]
          })]
        })]
      })]
    })
  });
});
const route58 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: dashboard,
  loader: loader$h
}, Symbol.toStringTag, { value: "Module" }));
async function loader$g({
  request
}) {
  await requireAdmin(request);
  const characters = await db.query.character.findMany({
    with: {
      media: {
        orderBy: [asc(characterMedia.sortOrder)]
      },
      stats: true
    },
    orderBy: [desc(character.createdAt)]
  });
  const charactersWithSortedMedia = characters.map((char) => {
    const coverImage = char.media.find((m) => m.type === "AVATAR")?.url || char.media.find((m) => m.type === "COVER")?.url || char.media[0]?.url;
    return {
      ...char,
      representativeImage: coverImage
    };
  });
  return {
    characters: charactersWithSortedMedia
  };
}
const index$6 = UNSAFE_withComponentProps(function AdminCharacters() {
  const {
    characters
  } = useLoaderData();
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-end",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-1",
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-3xl font-black italic tracking-tighter text-white uppercase",
            children: "Characters"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Manage your AI personas and their media."
          })]
        }), /* @__PURE__ */ jsxs(Link, {
          to: "/admin/characters/new",
          className: "px-6 py-3 bg-primary text-[#0B0A10] rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(255,0,255,0.3)] hover:scale-105 transition-transform flex items-center gap-2",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-[20px]",
            children: "add"
          }), "NEW CHARACTER"]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        children: characters.length === 0 ? /* @__PURE__ */ jsxs("div", {
          className: "col-span-full py-20 bg-[#1A1821]/40 border border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-white/10 text-[64px]",
            children: "person_off"
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-1",
            children: [/* @__PURE__ */ jsx("p", {
              className: "text-white/40 font-bold uppercase tracking-widest text-xs",
              children: "No Characters Found"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-white/20 text-sm",
              children: "Start by creating your first AI character."
            })]
          })]
        }) : characters.map((char) => /* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821]/60 border border-white/5 rounded-[32px] overflow-hidden group hover:border-primary/20 transition-all duration-300",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "h-48 bg-gradient-to-br from-[#2A2635] to-[#1A1821] relative overflow-hidden",
            children: [char.representativeImage ? /* @__PURE__ */ jsx("img", {
              src: char.representativeImage,
              alt: char.name,
              className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            }) : /* @__PURE__ */ jsx("div", {
              className: "w-full h-full flex items-center justify-center",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white/5 text-[64px]",
                children: "image"
              })
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute top-4 right-4 flex gap-2",
              children: /* @__PURE__ */ jsx("div", {
                className: cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter", char.isOnline ? "bg-green-500 text-black" : "bg-white/10 text-white/40"),
                children: char.isOnline ? "Online" : "Offline"
              })
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute inset-0 bg-gradient-to-t from-[#1A1821] to-transparent opacity-60"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "p-6 space-y-4",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between items-start",
                children: [/* @__PURE__ */ jsx("h3", {
                  className: "text-xl font-black italic tracking-tighter text-white",
                  children: char.name
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] font-black text-primary uppercase tracking-widest",
                  children: char.role
                })]
              }), /* @__PURE__ */ jsx("p", {
                className: "text-white/40 text-xs mt-1 line-clamp-1",
                children: char.bio
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "pt-4 border-t border-white/5 flex items-center justify-between",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-4",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "text-center",
                  children: [/* @__PURE__ */ jsx("p", {
                    className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
                    children: "Hearts"
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-sm font-black text-primary italic",
                    children: (char.stats?.totalHearts || 0).toLocaleString()
                  })]
                }), /* @__PURE__ */ jsx("div", {
                  className: "w-px h-6 bg-white/5"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "text-center",
                  children: [/* @__PURE__ */ jsx("p", {
                    className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
                    children: "ID"
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-[10px] font-bold text-white/60",
                    children: char.id
                  })]
                })]
              }), /* @__PURE__ */ jsx(Link, {
                to: `/admin/characters/${char.id}`,
                className: "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:text-black transition-all duration-300",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[20px]",
                  children: "edit"
                })
              })]
            })]
          })]
        }, char.id))
      })]
    })
  });
});
const route59 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$6,
  loader: loader$g
}, Symbol.toStringTag, { value: "Module" }));
const characterSchema = z.object({
  id: z.string().min(2).max(20).regex(/^[a-z0-9_]+$/, "Only lowercase, numbers, and underscore allowed"),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  greetingMessage: z.string().optional(),
  personaPrompt: z.string().min(10),
  isOnline: z.boolean().default(false)
});
async function loader$f({
  params,
  request
}) {
  await requireAdmin(request);
  const {
    id
  } = params;
  if (!id || id === "new") {
    return {
      character: null
    };
  }
  const character$1 = await db.query.character.findFirst({
    where: eq(character.id, id),
    with: {
      media: {
        orderBy: [asc(characterMedia.sortOrder)]
      }
    }
  });
  if (!character$1) {
    throw new Response("Character not found", {
      status: 404
    });
  }
  return {
    character: character$1
  };
}
async function action$9({
  params,
  request
}) {
  await requireAdmin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action");
  if (actionType === "delete") {
    const id = params.id;
    if (!id) return Response.json({
      error: "ID missing"
    }, {
      status: 400
    });
    await db.delete(character).where(eq(character.id, id));
    return {
      success: true,
      deleted: true,
      message: "Character deleted successfully"
    };
  }
  if (actionType === "add_media") {
    const characterId = params.id;
    const url = formData.get("url");
    const type = formData.get("type");
    if (!characterId || !url || !type) return Response.json({
      error: "Missing data"
    }, {
      status: 400
    });
    const countRes = await db.select({
      value: count()
    }).from(characterMedia).where(eq(characterMedia.characterId, characterId));
    const currentCount = countRes[0]?.value || 0;
    await db.insert(characterMedia).values({
      id: crypto.randomUUID(),
      characterId,
      url,
      type,
      sortOrder: currentCount,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      message: "Media added successfully"
    };
  }
  if (actionType === "delete_media") {
    const mediaId = formData.get("mediaId");
    if (!mediaId) return Response.json({
      error: "Media ID missing"
    }, {
      status: 400
    });
    await db.delete(characterMedia).where(eq(characterMedia.id, mediaId));
    return {
      success: true,
      message: "Media deleted"
    };
  }
  if (actionType === "reorder_media") {
    const mediaId = formData.get("mediaId");
    const direction = formData.get("direction");
    if (!mediaId || !direction) return Response.json({
      error: "Missing data"
    }, {
      status: 400
    });
    const currentMedia = await db.query.characterMedia.findFirst({
      where: eq(characterMedia.id, mediaId)
    });
    if (!currentMedia) return Response.json({
      error: "Media not found"
    }, {
      status: 404
    });
    const allMedia = await db.query.characterMedia.findMany({
      where: eq(characterMedia.characterId, currentMedia.characterId),
      orderBy: [asc(characterMedia.sortOrder)]
    });
    const currentIndex = allMedia.findIndex((m) => m.id === mediaId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < allMedia.length) {
      const targetMedia = allMedia[targetIndex];
      await db.transaction(async (tx) => {
        await tx.update(characterMedia).set({
          sortOrder: targetMedia.sortOrder
        }).where(eq(characterMedia.id, currentMedia.id));
        await tx.update(characterMedia).set({
          sortOrder: currentMedia.sortOrder
        }).where(eq(characterMedia.id, targetMedia.id));
      });
    }
    return {
      success: true
    };
  }
  const data2 = {
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    bio: formData.get("bio"),
    greetingMessage: formData.get("greetingMessage"),
    personaPrompt: formData.get("personaPrompt"),
    isOnline: formData.get("isOnline") === "true"
  };
  try {
    const validated = characterSchema.parse(data2);
    const isNew = !params.id || params.id === "new";
    if (isNew) {
      const existing = await db.query.character.findFirst({
        where: eq(character.id, validated.id)
      });
      if (existing) {
        return Response.json({
          error: "Character ID already exists"
        }, {
          status: 400
        });
      }
      await db.transaction(async (tx) => {
        await tx.insert(character).values({
          ...validated,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
        await tx.insert(characterStat).values({
          id: crypto.randomUUID(),
          characterId: validated.id,
          updatedAt: /* @__PURE__ */ new Date()
        });
      });
      return {
        success: true,
        message: "Character debuted successfully!"
      };
    } else {
      await db.update(character).set({
        ...validated,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(character.id, params.id));
      return {
        success: true,
        message: "Character profile updated!"
      };
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({
        error: e.issues[0].message
      }, {
        status: 400
      });
    }
    console.error(e);
    return Response.json({
      error: "Failed to save character"
    }, {
      status: 500
    });
  }
}
const edit$3 = UNSAFE_withComponentProps(function EditCharacter() {
  const {
    character: character2
  } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const isSubmitting = navigation.state !== "idle";
  const isNew = !character2;
  const [activeTab, setActiveTab] = useState("identity");
  useEffect(() => {
    if (actionData?.success) {
      if (actionData.deleted) {
        toast.success(actionData.message || "Deleted");
        navigate("/admin/characters");
      } else {
        toast.success(actionData.message || "Success");
        if (isNew) navigate("/admin/characters");
      }
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData, navigate, isNew]);
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-center",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-1",
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-3xl font-black italic tracking-tighter text-white uppercase",
            children: isNew ? "Create Character" : `Edit: ${character2.name}`
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Configure identity, persona, and media."
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex gap-3",
          children: [!isNew && /* @__PURE__ */ jsxs(Form, {
            method: "post",
            onSubmit: (e) => {
              if (!confirm("Are you sure? This will delete all conversation history for this character.")) {
                e.preventDefault();
              }
            },
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "_action",
              value: "delete"
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              className: "px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all",
              children: "DELETE"
            })]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => navigate("/admin/characters"),
            className: "px-6 py-3 bg-white/5 text-white/60 rounded-xl font-bold text-sm hover:text-white transition-all",
            children: "CANCEL"
          })]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "flex gap-2 p-1 bg-[#1A1821] rounded-2xl w-fit border border-white/5",
        children: ["identity", "ai", "media"].map((tab) => /* @__PURE__ */ jsx("button", {
          onClick: () => setActiveTab(tab),
          className: cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === tab ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-white/40 hover:text-white"),
          children: tab
        }, tab))
      }), /* @__PURE__ */ jsxs(Form, {
        method: "post",
        className: "space-y-8",
        children: [/* @__PURE__ */ jsx("div", {
          className: cn(activeTab !== "identity" && "hidden"),
          children: /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821]/60 border border-white/5 rounded-[40px] p-8 space-y-6",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-1 md:grid-cols-2 gap-6",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                  children: "Character ID (Handle)"
                }), /* @__PURE__ */ jsx("input", {
                  name: "id",
                  defaultValue: character2?.id,
                  readOnly: !isNew,
                  placeholder: "e.g. chunsim",
                  className: cn("w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold", !isNew && "opacity-50 cursor-not-allowed")
                }), isNew && /* @__PURE__ */ jsx("p", {
                  className: "text-[10px] text-white/20 ml-2 italic",
                  children: "* Use only lowercase, numbers, and underscores."
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                  children: "Display Name"
                }), /* @__PURE__ */ jsx("input", {
                  name: "name",
                  defaultValue: character2?.name,
                  placeholder: "e.g. 춘심",
                  className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                  children: "Role/Tag"
                }), /* @__PURE__ */ jsx("input", {
                  name: "role",
                  defaultValue: character2?.role,
                  placeholder: "e.g. K-Pop Idol",
                  className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "flex items-end pb-4",
                children: /* @__PURE__ */ jsxs("label", {
                  className: "flex items-center gap-3 cursor-pointer group",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "relative",
                    children: [/* @__PURE__ */ jsx("input", {
                      type: "checkbox",
                      name: "isOnline",
                      value: "true",
                      defaultChecked: character2?.isOnline,
                      className: "sr-only peer"
                    }), /* @__PURE__ */ jsx("div", {
                      className: "w-12 h-6 bg-white/10 rounded-full peer peer-checked:bg-primary transition-all duration-300"
                    }), /* @__PURE__ */ jsx("div", {
                      className: "absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all duration-300"
                    })]
                  }), /* @__PURE__ */ jsx("span", {
                    className: "text-sm font-black text-white/40 group-hover:text-white transition-colors uppercase tracking-widest",
                    children: "Online Status"
                  })]
                })
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx("label", {
                className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                children: "Short Bio"
              }), /* @__PURE__ */ jsx("input", {
                name: "bio",
                defaultValue: character2?.bio,
                placeholder: "Briefly describe the character",
                className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx("label", {
                className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                children: "Greeting Message"
              }), /* @__PURE__ */ jsx("textarea", {
                name: "greetingMessage",
                defaultValue: character2?.greetingMessage || "",
                placeholder: "The first message the AI sends",
                rows: 2,
                className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-medium resize-none"
              })]
            })]
          })
        }), /* @__PURE__ */ jsx("div", {
          className: cn(activeTab !== "ai" && "hidden"),
          children: /* @__PURE__ */ jsx("div", {
            className: "bg-[#1A1821]/60 border border-white/5 rounded-[40px] p-8 space-y-6",
            children: /* @__PURE__ */ jsxs("div", {
              className: "space-y-2 text-right",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between items-center mb-2 px-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "System Persona Prompt"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] text-primary font-bold italic tracking-tighter px-2 py-1 bg-primary/10 rounded-lg",
                  children: "High Precision Emotion Engine"
                })]
              }), /* @__PURE__ */ jsx("textarea", {
                name: "personaPrompt",
                defaultValue: character2?.personaPrompt,
                placeholder: "Define the core personality, speech patterns, and secrets...",
                className: "w-full h-[500px] bg-black/40 border border-white/10 rounded-[32px] p-8 text-white focus:outline-none focus:border-primary/50 transition-all font-mono text-sm leading-relaxed"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-[10px] text-white/20 italic",
                children: "* This prompt defines how the AI will behave. Be specific about tone and emojis."
              })]
            })
          })
        }), /* @__PURE__ */ jsx("div", {
          className: cn(activeTab !== "media" && "hidden"),
          children: /* @__PURE__ */ jsx("div", {
            className: "space-y-12 animate-in fade-in duration-500 pb-20",
            children: isNew ? /* @__PURE__ */ jsxs("div", {
              className: "bg-[#1A1821]/60 border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-white/10 text-[64px]",
                children: "priority_high"
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-1",
                children: [/* @__PURE__ */ jsx("h3", {
                  className: "text-lg font-black italic text-white/40 uppercase",
                  children: "Action Required"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-sm text-white/20 font-medium",
                  children: "Please save the character identity first before uploading media."
                })]
              })]
            }) : /* @__PURE__ */ jsx(Fragment, {
              children: [{
                type: "AVATAR",
                label: "Profile Avatar",
                desc: "Small icon for chats and profile identification.",
                icon: "account_circle"
              }, {
                type: "COVER",
                label: "Background Cover",
                desc: "Large background image for home screen and highlights.",
                icon: "wallpaper"
              }, {
                type: "NORMAL",
                label: "Standard Gallery",
                desc: "Public photos available in the character's gallery.",
                icon: "photo_library"
              }, {
                type: "SECRET",
                label: "Secret Reward",
                desc: "Hidden images unlocked through user interaction.",
                icon: "lock"
              }].map((section) => {
                const items = character2.media.filter((m) => m.type === section.type);
                return /* @__PURE__ */ jsxs("div", {
                  className: "space-y-6",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex justify-between items-end px-2",
                    children: [/* @__PURE__ */ jsxs("div", {
                      className: "space-y-1",
                      children: [/* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [/* @__PURE__ */ jsx("span", {
                          className: "material-symbols-outlined text-primary text-[20px]",
                          children: section.icon
                        }), /* @__PURE__ */ jsx("h3", {
                          className: "text-xl font-black italic text-white uppercase tracking-tighter",
                          children: section.label
                        })]
                      }), /* @__PURE__ */ jsx("p", {
                        className: "text-white/40 text-[10px] font-medium uppercase tracking-widest",
                        children: section.desc
                      })]
                    }), /* @__PURE__ */ jsxs("div", {
                      className: "relative",
                      children: [/* @__PURE__ */ jsx("input", {
                        type: "file",
                        id: `upload-${section.type}`,
                        className: "hidden",
                        accept: "image/*",
                        onChange: async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const toastId = toast.loading(`Uploading ${section.label}...`);
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            const res = await fetch("/api/upload", {
                              method: "POST",
                              body: formData
                            });
                            const result = await res.json();
                            if (result.url) {
                              const submitData = new FormData();
                              submitData.append("_action", "add_media");
                              submitData.append("url", result.url);
                              submitData.append("type", section.type);
                              const response = await fetch(window.location.pathname, {
                                method: "POST",
                                body: submitData
                              });
                              if (response.ok) {
                                toast.success(`${section.label} added!`, {
                                  id: toastId
                                });
                                revalidator.revalidate();
                              } else {
                                throw new Error("Failed to save media");
                              }
                            }
                          } catch (error) {
                            toast.error("Upload failed", {
                              id: toastId
                            });
                          }
                        }
                      }), /* @__PURE__ */ jsxs("button", {
                        type: "button",
                        disabled: isSubmitting,
                        onClick: () => document.getElementById(`upload-${section.type}`)?.click(),
                        className: "px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-primary/50 hover:text-primary transition-all flex items-center gap-2",
                        children: [/* @__PURE__ */ jsx("span", {
                          className: "material-symbols-outlined text-[16px]",
                          children: "add_a_photo"
                        }), "Upload New"]
                      })]
                    })]
                  }), /* @__PURE__ */ jsx("div", {
                    className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4",
                    children: items.length === 0 ? /* @__PURE__ */ jsxs("div", {
                      className: "col-span-full py-12 bg-black/20 border border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-center space-y-2 opacity-40",
                      children: [/* @__PURE__ */ jsx("span", {
                        className: "material-symbols-outlined text-[32px]",
                        children: "no_photography"
                      }), /* @__PURE__ */ jsxs("p", {
                        className: "text-[10px] font-bold uppercase tracking-widest",
                        children: ["No ", section.label, " uploaded"]
                      })]
                    }) : items.map((item2, idx) => /* @__PURE__ */ jsxs("div", {
                      className: "group relative bg-black/40 border border-white/5 rounded-3xl overflow-hidden aspect-square",
                      children: [/* @__PURE__ */ jsx("img", {
                        src: item2.url,
                        alt: section.label,
                        className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      }), /* @__PURE__ */ jsxs("div", {
                        className: "absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3 p-4",
                        children: [/* @__PURE__ */ jsxs("div", {
                          className: "flex gap-2",
                          children: [/* @__PURE__ */ jsx("button", {
                            type: "button",
                            onClick: async () => {
                              const fd = new FormData();
                              fd.append("_action", "reorder_media");
                              fd.append("mediaId", item2.id);
                              fd.append("direction", "up");
                              await fetch(window.location.pathname, {
                                method: "POST",
                                body: fd
                              });
                              revalidator.revalidate();
                            },
                            className: "w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-primary hover:text-black transition-all",
                            children: /* @__PURE__ */ jsx("span", {
                              className: "material-symbols-outlined text-[18px]",
                              children: "arrow_back"
                            })
                          }), /* @__PURE__ */ jsx("button", {
                            type: "button",
                            onClick: async () => {
                              const fd = new FormData();
                              fd.append("_action", "reorder_media");
                              fd.append("mediaId", item2.id);
                              fd.append("direction", "down");
                              await fetch(window.location.pathname, {
                                method: "POST",
                                body: fd
                              });
                              revalidator.revalidate();
                            },
                            className: "w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-primary hover:text-black transition-all",
                            children: /* @__PURE__ */ jsx("span", {
                              className: "material-symbols-outlined text-[18px]",
                              children: "arrow_forward"
                            })
                          })]
                        }), /* @__PURE__ */ jsx("button", {
                          type: "button",
                          onClick: async () => {
                            if (!confirm("Are you sure?")) return;
                            const formData = new FormData();
                            formData.append("_action", "delete_media");
                            formData.append("mediaId", item2.id);
                            const response = await fetch(window.location.pathname, {
                              method: "POST",
                              body: formData
                            });
                            if (response.ok) {
                              toast.success("Media deleted");
                              revalidator.revalidate();
                            }
                          },
                          className: "w-8 h-8 rounded-lg bg-red-500/20 text-red-500 border border-red-500/40 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all",
                          children: /* @__PURE__ */ jsx("span", {
                            className: "material-symbols-outlined text-[18px]",
                            children: "delete"
                          })
                        })]
                      }), /* @__PURE__ */ jsx("div", {
                        className: "absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[8px] font-black text-white/60 uppercase tracking-tighter",
                        children: idx === 0 ? "★ Main" : `#${idx + 1}`
                      })]
                    }, item2.id))
                  })]
                }, section.type);
              })
            })
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "flex flex-col gap-4",
          children: /* @__PURE__ */ jsx("button", {
            type: "submit",
            disabled: isSubmitting,
            className: cn("w-full py-6 bg-primary text-[#0B0A10] rounded-[32px] font-black italic text-xl tracking-tighter transition-all hover:scale-[1.02] active:scale-95 shadow-[0_10px_40px_rgba(255,0,255,0.4)] flex items-center justify-center gap-3", isSubmitting && "opacity-50 cursor-not-allowed"),
            children: isSubmitting ? /* @__PURE__ */ jsx("span", {
              className: "w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"
            }) : /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined font-bold",
                children: "bolt"
              }), isNew ? "DEBUT CHARACTER" : "SAVE CORE SETTINGS"]
            })
          })
        })]
      })]
    })
  });
});
const route61 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9,
  default: edit$3,
  loader: loader$f
}, Symbol.toStringTag, { value: "Module" }));
async function loader$e({
  request
}) {
  await requireAdmin(request);
  const items = await db.query.item.findMany({
    orderBy: [desc(item.createdAt)]
  });
  return {
    items
  };
}
const index$5 = UNSAFE_withComponentProps(function AdminItems() {
  const {
    items
  } = useLoaderData();
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-end",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs("h1", {
            className: "text-4xl font-black italic tracking-tighter text-white uppercase",
            children: ["Item Store ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: "Management"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Create and manage virtual gifts and tokens."
          })]
        }), /* @__PURE__ */ jsxs(Link, {
          to: "/admin/items/new",
          className: "px-8 py-4 bg-primary text-black rounded-2xl font-black italic text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,255,0.3)] flex items-center gap-2",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined font-bold",
            children: "add_box"
          }), "CREATE NEW ITEM"]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        children: items.length === 0 ? /* @__PURE__ */ jsxs("div", {
          className: "col-span-full py-20 bg-[#1A1821] rounded-[40px] border border-white/5 flex flex-col items-center justify-center space-y-4",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-white/10 text-64 font-thin",
            children: "inventory_2"
          }), /* @__PURE__ */ jsxs("div", {
            className: "text-center",
            children: [/* @__PURE__ */ jsx("p", {
              className: "text-white/40 font-bold italic uppercase tracking-widest",
              children: "No items found"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-white/20 text-xs",
              children: "Start by creating your first virtual gift."
            })]
          })]
        }) : items.map((item2) => /* @__PURE__ */ jsxs(Link, {
          to: `/admin/items/${item2.id}`,
          className: "group relative bg-[#1A1821] border border-white/5 rounded-[40px] p-6 hover:border-primary/30 transition-all hover:translate-y-[-4px] overflow-hidden",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-5 relative z-10",
            children: [/* @__PURE__ */ jsx("div", {
              className: "w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-primary/40 transition-colors shadow-inner",
              children: item2.iconUrl ? /* @__PURE__ */ jsx("img", {
                src: item2.iconUrl,
                alt: item2.name,
                className: "w-10 h-10 object-contain group-hover:scale-110 transition-transform"
              }) : /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary/40 text-3xl",
                children: "token"
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex-1 min-w-0",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */ jsx("h3", {
                  className: "text-lg font-black italic text-white uppercase tracking-tighter truncate leading-tight",
                  children: item2.name
                }), !item2.isActive && /* @__PURE__ */ jsx("span", {
                  className: "px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black rounded uppercase",
                  children: "Hidden"
                })]
              }), /* @__PURE__ */ jsx("p", {
                className: "text-primary text-[10px] font-black uppercase tracking-widest opacity-60",
                children: item2.type
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "mt-8 grid grid-cols-2 gap-3 relative z-10",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "p-4 bg-black/20 rounded-3xl border border-white/5 group-hover:border-primary/10 transition-colors",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-[8px] font-black text-white/20 uppercase mb-1",
                children: "Price (CHOCO)"
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-baseline gap-1",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-lg font-black italic text-white tracking-tighter",
                  children: item2.priceChoco || item2.priceCredits || 0
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] text-primary/60 font-bold uppercase",
                  children: "CHOCO"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "p-4 bg-black/20 rounded-3xl border border-white/5 group-hover:border-primary/10 transition-colors",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-[8px] font-black text-white/20 uppercase mb-1",
                children: "Price (KRW)"
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-baseline gap-1",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-lg font-black italic text-white tracking-tighter",
                  children: item2.priceKRW?.toLocaleString() || "N/A"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] text-white/20 font-bold",
                  children: "₩"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "mt-4 flex items-center justify-between px-2 relative z-10",
            children: [/* @__PURE__ */ jsx("p", {
              className: "text-[10px] text-white/40 font-medium line-clamp-1 flex-1 pr-4",
              children: item2.description || "No description set."
            }), /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-white/10 group-hover:text-primary/40 transition-colors",
              children: "chevron_right"
            })]
          })]
        }, item2.id))
      })]
    })
  });
});
const route62 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$5,
  loader: loader$e
}, Symbol.toStringTag, { value: "Module" }));
const itemSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["GIFT", "CONSUMABLE", "CURRENCY"]),
  priceCredits: z.coerce.number().min(0).optional(),
  // Deprecated: 호환성을 위해 유지
  priceChoco: z.coerce.number().min(0).optional(),
  // 신규: CHOCO 가격
  priceUSD: z.coerce.number().min(0).optional(),
  priceKRW: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  isActive: z.boolean().default(true)
});
async function loader$d({
  params,
  request
}) {
  await requireAdmin(request);
  const {
    id
  } = params;
  if (!id || id === "new") {
    return {
      item: null
    };
  }
  const item$1 = await db.query.item.findFirst({
    where: eq(item.id, id)
  });
  if (!item$1) {
    throw new Response("Item not found", {
      status: 404
    });
  }
  return {
    item: item$1
  };
}
async function action$8({
  params,
  request
}) {
  await requireAdmin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action");
  const id = params.id;
  const isNew = !id || id === "new";
  if (actionType === "delete") {
    if (!id) return Response.json({
      error: "ID missing"
    }, {
      status: 400
    });
    await db.delete(item).where(eq(item.id, id));
    return {
      success: true,
      deleted: true,
      message: "Item deleted successfully"
    };
  }
  const data2 = {
    name: formData.get("name"),
    type: formData.get("type"),
    priceCredits: Number(formData.get("priceCredits")) || 0,
    // Deprecated
    priceChoco: Number(formData.get("priceChoco")) || 0,
    // 신규
    priceUSD: Number(formData.get("priceUSD")) || 0,
    priceKRW: Number(formData.get("priceKRW")) || 0,
    description: formData.get("description"),
    iconUrl: formData.get("iconUrl"),
    isActive: formData.get("isActive") === "true"
  };
  try {
    const validated = itemSchema.parse(data2);
    if (isNew) {
      await db.insert(item).values({
        id: crypto.randomUUID(),
        ...validated,
        updatedAt: /* @__PURE__ */ new Date()
      });
      return {
        success: true,
        message: "Item created successfully!"
      };
    } else {
      await db.update(item).set({
        ...validated,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(item.id, id));
      return {
        success: true,
        message: "Item updated successfully!"
      };
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({
        error: e.issues[0].message
      }, {
        status: 400
      });
    }
    console.error(e);
    return Response.json({
      error: "Failed to save item"
    }, {
      status: 500
    });
  }
}
const edit$2 = UNSAFE_withComponentProps(function EditItem() {
  const {
    item: item2
  } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const navigation = useNavigation();
  useRevalidator();
  const isSubmitting = navigation.state !== "idle";
  const isNew = !item2;
  const [iconUrl, setIconUrl] = useState(item2?.iconUrl || "");
  useEffect(() => {
    if (actionData?.success) {
      if (actionData.deleted) {
        toast.success(actionData.message || "Item deleted");
        navigate("/admin/items");
      } else {
        toast.success(actionData.message || "Saved");
        if (isNew) navigate("/admin/items");
      }
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData, navigate, isNew]);
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-center",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-1",
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-3xl font-black italic tracking-tighter text-white uppercase",
            children: isNew ? "Create New Item" : `Edit: ${item2.name}`
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Configure item pricing, type, and icon."
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex gap-3",
          children: [!isNew && /* @__PURE__ */ jsxs(Form, {
            method: "post",
            onSubmit: (e) => {
              if (!confirm("Are you sure? This item will be removed from the store.")) {
                e.preventDefault();
              }
            },
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "_action",
              value: "delete"
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              className: "px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all",
              children: "DELETE"
            })]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => navigate("/admin/items"),
            className: "px-6 py-3 bg-white/5 text-white/60 rounded-xl font-bold text-sm hover:text-white transition-all",
            children: "CANCEL"
          })]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "bg-[#1A1821]/60 border border-white/5 rounded-[40px] p-8",
        children: /* @__PURE__ */ jsxs(Form, {
          method: "post",
          className: "space-y-8",
          children: [/* @__PURE__ */ jsx("input", {
            type: "hidden",
            name: "iconUrl",
            value: iconUrl
          }), /* @__PURE__ */ jsxs("div", {
            className: "grid grid-cols-1 md:grid-cols-3 gap-8",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "md:col-span-1 space-y-4",
              children: [/* @__PURE__ */ jsx("label", {
                className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic",
                children: "Item Icon"
              }), /* @__PURE__ */ jsxs("div", {
                className: "aspect-square bg-black/40 border border-white/10 rounded-3xl flex items-center justify-center relative group overflow-hidden border-dashed hover:border-primary/50 transition-colors",
                children: [iconUrl ? /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx("img", {
                    src: iconUrl,
                    alt: "Preview",
                    className: "w-2/3 h-2/3 object-contain"
                  }), /* @__PURE__ */ jsx("div", {
                    className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
                    children: /* @__PURE__ */ jsx("button", {
                      type: "button",
                      onClick: () => setIconUrl(""),
                      className: "p-2 bg-red-500 rounded-lg text-white",
                      children: /* @__PURE__ */ jsx("span", {
                        className: "material-symbols-outlined",
                        children: "delete"
                      })
                    })
                  })]
                }) : /* @__PURE__ */ jsxs("button", {
                  type: "button",
                  onClick: () => document.getElementById("icon-upload")?.click(),
                  className: "flex flex-col items-center gap-2 text-white/20 hover:text-primary transition-colors",
                  children: [/* @__PURE__ */ jsx("span", {
                    className: "material-symbols-outlined text-4xl",
                    children: "add_photo_alternate"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "text-[10px] font-black uppercase tracking-widest leading-none",
                    children: "Upload Icon"
                  })]
                }), /* @__PURE__ */ jsx("input", {
                  type: "file",
                  id: "icon-upload",
                  className: "hidden",
                  accept: "image/*",
                  onChange: async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const toastId = toast.loading("Uploading icon...");
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData
                      });
                      const result = await res.json();
                      if (result.url) {
                        setIconUrl(result.url);
                        toast.success("Icon uploaded!", {
                          id: toastId
                        });
                      }
                    } catch (err) {
                      toast.error("Upload failed", {
                        id: toastId
                      });
                    }
                  }
                })]
              }), /* @__PURE__ */ jsx("p", {
                className: "text-[9px] text-white/20 italic text-center uppercase tracking-tighter",
                children: "Recommended: Transparent PNG, 200x200"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "md:col-span-2 space-y-6",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                  children: "Item Name"
                }), /* @__PURE__ */ jsx("input", {
                  name: "name",
                  defaultValue: item2?.name,
                  placeholder: "e.g. Red Heart, Golden Rose",
                  className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold",
                  required: true
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "grid grid-cols-2 gap-4",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsx("label", {
                    className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                    children: "Type"
                  }), /* @__PURE__ */ jsxs("select", {
                    name: "type",
                    defaultValue: item2?.type || "GIFT",
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer",
                    children: [/* @__PURE__ */ jsx("option", {
                      value: "GIFT",
                      children: "Gift (Send to AI)"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "CONSUMABLE",
                      children: "Consumable (Self-use)"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "CURRENCY",
                      children: "Token (Internal Economy)"
                    })]
                  })]
                }), /* @__PURE__ */ jsx("div", {
                  className: "flex items-end pb-4",
                  children: /* @__PURE__ */ jsxs("label", {
                    className: "flex items-center gap-3 cursor-pointer group px-2",
                    children: [/* @__PURE__ */ jsxs("div", {
                      className: "relative",
                      children: [/* @__PURE__ */ jsx("input", {
                        type: "checkbox",
                        name: "isActive",
                        value: "true",
                        defaultChecked: item2?.isActive ?? true,
                        className: "sr-only peer"
                      }), /* @__PURE__ */ jsx("div", {
                        className: "w-12 h-6 bg-white/10 rounded-full peer peer-checked:bg-primary transition-all duration-300"
                      }), /* @__PURE__ */ jsx("div", {
                        className: "absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all duration-300"
                      })]
                    }), /* @__PURE__ */ jsx("span", {
                      className: "text-sm font-black text-white/40 group-hover:text-white transition-colors uppercase tracking-widest",
                      children: "Active in Store"
                    })]
                  })
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                  children: "Description"
                }), /* @__PURE__ */ jsx("textarea", {
                  name: "description",
                  defaultValue: item2?.description || "",
                  placeholder: "Explain what this item does or represents...",
                  rows: 3,
                  className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-medium resize-none"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "pt-8 border-t border-white/5 space-y-6",
            children: [/* @__PURE__ */ jsxs("h2", {
              className: "text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-sm",
                children: "payments"
              }), "Price Configuration"]
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-1 md:grid-cols-4 gap-6",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                  children: "CHOCO Price"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */ jsx("input", {
                    name: "priceChoco",
                    type: "number",
                    defaultValue: item2?.priceChoco || item2?.priceCredits || 0,
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold pr-12"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black text-[10px] uppercase",
                    children: "CHOCO"
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2",
                  children: "Credits (Deprecated)"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */ jsx("input", {
                    name: "priceCredits",
                    type: "number",
                    defaultValue: item2?.priceCredits || 0,
                    className: "w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-white/40 focus:outline-none focus:border-primary/30 transition-all font-bold pr-12",
                    disabled: true
                  }), /* @__PURE__ */ jsx("span", {
                    className: "absolute right-6 top-1/2 -translate-y-1/2 text-white/10 font-black text-[10px] uppercase",
                    children: "CR"
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                  children: "Direct KRW"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */ jsx("input", {
                    name: "priceKRW",
                    type: "number",
                    defaultValue: item2?.priceKRW || 0,
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold pr-12"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "absolute right-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-[10px] uppercase",
                    children: "₩"
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2",
                  children: "Direct USD"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */ jsx("input", {
                    name: "priceUSD",
                    type: "number",
                    step: "0.01",
                    defaultValue: item2?.priceUSD || 0,
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold pr-12"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "absolute right-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-[10px] uppercase",
                    children: "$"
                  })]
                })]
              })]
            }), /* @__PURE__ */ jsx("p", {
              className: "text-[9px] text-white/20 italic uppercase tracking-tighter",
              children: "* Direct prices are used when purchasing bypassing token refills."
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "pt-4 flex flex-col gap-4",
            children: /* @__PURE__ */ jsx("button", {
              type: "submit",
              disabled: isSubmitting,
              className: cn("w-full py-6 bg-primary text-[#0B0A10] rounded-[32px] font-black italic text-xl tracking-tighter transition-all hover:scale-[1.02] shadow-[0_10px_40px_rgba(255,0,255,0.4)] flex items-center justify-center gap-3", isSubmitting && "opacity-50 cursor-not-allowed"),
              children: isSubmitting ? /* @__PURE__ */ jsx("span", {
                className: "w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"
              }) : /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined font-bold",
                  children: "diamond"
                }), isNew ? "CREATE STORE ITEM" : "UPDATE ITEM SETTINGS"]
              })
            })
          })]
        })
      })]
    })
  });
});
const route64 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8,
  default: edit$2,
  loader: loader$d
}, Symbol.toStringTag, { value: "Module" }));
async function loader$c({
  request
}) {
  await requireAdmin(request);
  const characterStats = await db.query.characterStat.findMany({
    with: {
      character: {
        columns: {
          name: true
        }
      }
    },
    orderBy: [desc(characterStat.totalHearts)]
  });
  const totalHearts = characterStats.reduce((acc, stat) => acc + (stat.totalHearts || 0), 0);
  const totalGiftsRes = await db.select({
    value: count()
  }).from(giftLog);
  const totalGifts = totalGiftsRes[0]?.value || 0;
  const uniqueGiversRes = await db.select({
    fromUserId: giftLog.fromUserId
  }).from(giftLog).groupBy(giftLog.fromUserId);
  const giversCount = uniqueGiversRes.length;
  const itemPopularity = await db.select({
    itemId: giftLog.itemId,
    count: count()
  }).from(giftLog).groupBy(giftLog.itemId).orderBy(desc(count())).limit(5);
  const itemIds = itemPopularity.map((p) => p.itemId).filter((id) => id !== null);
  let items = [];
  if (itemIds.length > 0) {
    items = await db.query.item.findMany({
      where: inArray(item.id, itemIds),
      columns: {
        id: true,
        name: true
      }
    });
  }
  const itemStats = itemPopularity.map((p) => ({
    name: items.find((i) => i.id === p.itemId)?.name || "Unknown Item",
    count: p.count
  }));
  return {
    characterStats,
    totalHearts,
    totalGifts,
    giversCount,
    itemStats
  };
}
const statistics = UNSAFE_withComponentProps(function GiftStatistics() {
  const {
    characterStats,
    totalHearts,
    totalGifts,
    giversCount,
    itemStats
  } = useLoaderData();
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "space-y-2",
        children: [/* @__PURE__ */ jsxs("h1", {
          className: "text-4xl font-black italic tracking-tighter text-white uppercase",
          children: ["Gift ", /* @__PURE__ */ jsx("span", {
            className: "text-primary",
            children: "Intelligence"
          })]
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/40 text-sm font-medium",
          children: "Analyze giving patterns and character popularity."
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 md:grid-cols-3 gap-6",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[32px] p-8 space-y-2 relative overflow-hidden group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[60px] group-hover:bg-primary/20 transition-colors"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] relative z-10",
            children: "Total Hearts Given"
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-baseline gap-2 relative z-10",
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-4xl font-black italic text-white tracking-tighter",
              children: totalHearts.toLocaleString()
            }), /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary font-bold",
              children: "favorite"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[32px] p-8 space-y-2 relative overflow-hidden group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[60px] group-hover:bg-white/10 transition-colors"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] relative z-10",
            children: "Total Gift Transactions"
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-baseline gap-2 relative z-10",
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-4xl font-black italic text-white tracking-tighter",
              children: totalGifts.toLocaleString()
            }), /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-white/40 font-bold",
              children: "redeem"
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[32px] p-8 space-y-2 relative overflow-hidden group",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[60px] group-hover:bg-primary/20 transition-colors"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] relative z-10",
            children: "Unique Givers"
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-baseline gap-2 relative z-10",
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-4xl font-black italic text-white tracking-tighter",
              children: giversCount.toLocaleString()
            }), /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary/60 font-bold",
              children: "group"
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 lg:grid-cols-2 gap-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
          children: [/* @__PURE__ */ jsxs("h2", {
            className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary text-sm font-bold",
              children: "trophy"
            }), "Character Heart Ranking"]
          }), /* @__PURE__ */ jsx("div", {
            className: "space-y-4",
            children: characterStats.map((stat, index2) => /* @__PURE__ */ jsxs("div", {
              className: "group flex items-center gap-4 p-4 bg-black/20 border border-white/5 rounded-2xl hover:border-primary/30 transition-all",
              children: [/* @__PURE__ */ jsx("div", {
                className: cn("w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-xs", index2 === 0 ? "bg-primary text-black" : "bg-white/5 text-white/40"),
                children: index2 + 1
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex-1",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-sm font-black text-white uppercase tracking-tight",
                  children: stat.character.name
                }), /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center gap-4 mt-1",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-1 text-[10px] text-white/40",
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined text-[12px]",
                      children: "favorite"
                    }), stat.totalHearts.toLocaleString()]
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-1 text-[10px] text-white/40",
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined text-[12px]",
                      children: "group"
                    }), stat.totalUniqueGivers, " givers"]
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "text-right",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-[10px] text-white/20 uppercase font-black",
                  children: "Last Gift"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-[10px] text-white/40 font-medium",
                  children: stat.lastGiftAt ? new Date(stat.lastGiftAt).toLocaleDateString() : "Never"
                })]
              })]
            }, stat.id))
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
          children: [/* @__PURE__ */ jsxs("h2", {
            className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary text-sm font-bold",
              children: "trending_up"
            }), "Item Popularity (Sales Vol)"]
          }), /* @__PURE__ */ jsx("div", {
            className: "space-y-4",
            children: itemStats.map((item2, index2) => /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between items-end",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-xs font-bold text-white uppercase tracking-tight",
                  children: item2.name
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-[10px] font-black text-primary uppercase",
                  children: [item2.count, " Sold"]
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "h-2 bg-black/40 rounded-full overflow-hidden border border-white/5",
                children: /* @__PURE__ */ jsx("div", {
                  className: "h-full bg-primary shadow-[0_0_10px_rgba(255,0,255,0.4)] transition-all duration-1000",
                  style: {
                    width: `${item2.count / totalGifts * 100 || 0}%`
                  }
                })
              })]
            }, index2))
          })]
        })]
      })]
    })
  });
});
const route65 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: statistics,
  loader: loader$c
}, Symbol.toStringTag, { value: "Module" }));
async function loader$b({
  request
}) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("q") || "";
  const users = await db.query.user.findMany({
    where: search ? or(like$1(user.email, `%${search}%`), like$1(user.name, `%${search}%`)) : void 0,
    orderBy: [desc(user.createdAt)],
    limit: 50
  });
  return {
    users,
    search
  };
}
const index$4 = UNSAFE_withComponentProps(function AdminUsers() {
  const {
    users,
    search
  } = useLoaderData();
  const submit = useSubmit();
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex flex-col md:flex-row justify-between items-start md:items-end gap-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs("h1", {
            className: "text-4xl font-black italic tracking-tighter text-white uppercase",
            children: ["User ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: "Management"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Monitor and manage user accounts, tiers, and CHOCO balances."
          })]
        }), /* @__PURE__ */ jsxs(Form, {
          method: "get",
          className: "w-full md:w-96 relative group",
          onChange: (e) => submit(e.currentTarget),
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors",
            children: "search"
          }), /* @__PURE__ */ jsx("input", {
            type: "text",
            name: "q",
            defaultValue: search,
            placeholder: "Search by email or name...",
            className: "w-full bg-[#1A1821] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
          })]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "bg-[#1A1821] border border-white/5 rounded-[40px] overflow-hidden",
        children: /* @__PURE__ */ jsx("div", {
          className: "overflow-x-auto",
          children: /* @__PURE__ */ jsxs("table", {
            className: "w-full text-left",
            children: [/* @__PURE__ */ jsx("thead", {
              children: /* @__PURE__ */ jsxs("tr", {
                className: "border-b border-white/5 bg-white/2",
                children: [/* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "User"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "NEAR Address"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "Role / Tier"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "CHOCO"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "Joined"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-right",
                  children: "Action"
                })]
              })
            }), /* @__PURE__ */ jsx("tbody", {
              className: "divide-y divide-white/5",
              children: users.length === 0 ? /* @__PURE__ */ jsx("tr", {
                children: /* @__PURE__ */ jsx("td", {
                  colSpan: 6,
                  className: "px-8 py-20 text-center",
                  children: /* @__PURE__ */ jsx("p", {
                    className: "text-white/20 font-bold italic uppercase tracking-widest",
                    children: "No users found"
                  })
                })
              }) : users.map((user2) => /* @__PURE__ */ jsxs("tr", {
                className: "hover:bg-white/2 transition-colors",
                children: [/* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-4",
                    children: [/* @__PURE__ */ jsx("div", {
                      className: "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-primary border border-white/10 italic",
                      children: user2.name?.[0]?.toUpperCase() || user2.email?.[0]?.toUpperCase()
                    }), /* @__PURE__ */ jsxs("div", {
                      className: "flex flex-col",
                      children: [/* @__PURE__ */ jsx("span", {
                        className: "text-white font-bold tracking-tight",
                        children: user2.name || "Unnamed User"
                      }), /* @__PURE__ */ jsx("span", {
                        className: "text-white/40 text-xs font-medium",
                        children: user2.email
                      })]
                    })]
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5",
                  children: /* @__PURE__ */ jsx("div", {
                    className: "flex flex-col gap-1 max-w-[150px]",
                    children: user2.nearAccountId ? /* @__PURE__ */ jsxs(Fragment, {
                      children: [/* @__PURE__ */ jsx("span", {
                        className: "text-white text-[11px] font-mono break-all leading-tight opacity-80",
                        children: user2.nearAccountId
                      }), /* @__PURE__ */ jsx("span", {
                        className: "text-[9px] text-green-500/60 font-black uppercase tracking-tighter italic",
                        children: "Linked Account"
                      })]
                    }) : /* @__PURE__ */ jsxs(Fragment, {
                      children: [/* @__PURE__ */ jsx("span", {
                        className: "text-white/20 text-[10px] font-bold italic uppercase tracking-widest",
                        children: "No Wallet"
                      }), /* @__PURE__ */ jsx("span", {
                        className: "text-[9px] text-white/10 font-black uppercase tracking-tighter italic",
                        children: "Auto-creation pending"
                      })]
                    })
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex flex-col gap-1",
                    children: [/* @__PURE__ */ jsx("span", {
                      className: cn("text-[10px] font-black px-2 py-0.5 rounded w-fit", user2.role === "admin" ? "bg-red-500/10 text-red-500" : "bg-white/5 text-white/40"),
                      children: user2.role?.toUpperCase()
                    }), /* @__PURE__ */ jsx("span", {
                      className: cn("text-[10px] font-black px-2 py-0.5 rounded w-fit uppercase", user2.subscriptionStatus === "active" ? "bg-primary text-black" : "bg-white/10 text-white/60"),
                      children: user2.subscriptionTier || "FREE"
                    })]
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex flex-col",
                    children: [/* @__PURE__ */ jsxs("div", {
                      className: "flex items-center gap-1",
                      children: [/* @__PURE__ */ jsx("span", {
                        className: "text-white font-black italic tracking-tighter text-lg",
                        children: user2.chocoBalance ? parseFloat(user2.chocoBalance).toLocaleString() : "0"
                      }), /* @__PURE__ */ jsx("span", {
                        className: "text-primary font-bold text-[8px] uppercase",
                        children: "CHOCO"
                      })]
                    }), /* @__PURE__ */ jsx("span", {
                      className: "text-[10px] text-white/20 font-medium",
                      children: "Token Balance"
                    })]
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5",
                  children: /* @__PURE__ */ jsx("span", {
                    className: "text-white/40 text-xs font-medium",
                    children: new Date(user2.createdAt).toLocaleDateString()
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5 text-right",
                  children: /* @__PURE__ */ jsxs(Link, {
                    to: `/admin/users/${user2.id}`,
                    className: "inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all",
                    children: ["MANAGE", /* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined text-[16px]",
                      children: "open_in_new"
                    })]
                  })
                })]
              }, user2.id))
            })]
          })
        })
      })]
    })
  });
});
const route66 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$4,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
async function loader$a({
  params,
  request
}) {
  await requireAdmin(request);
  const {
    id
  } = params;
  if (!id) throw new Response("User ID missing", {
    status: 400
  });
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, id),
    with: {
      inventory: {
        with: {
          item: true
        }
      },
      payments: {
        orderBy: (payments, {
          desc: desc2
        }) => [desc2(payments.createdAt)]
      }
    }
  });
  if (!user$1) throw new Response("User not found", {
    status: 404
  });
  const allItems = await db.query.item.findMany({
    where: eq(item.isActive, true)
  });
  const userWithMappedInventory = {
    ...user$1,
    UserInventory: user$1.inventory
  };
  return {
    user: userWithMappedInventory,
    allItems
  };
}
async function action$7({
  params,
  request
}) {
  await requireAdmin(request);
  const formData = await request.formData();
  const actionType = formData.get("_action");
  const id = params.id;
  if (!id) return Response.json({
    error: "ID missing"
  }, {
    status: 400
  });
  if (actionType === "update_user") {
    const role = formData.get("role");
    const tier = formData.get("tier");
    const status = formData.get("subscriptionStatus");
    const chocoBalance = formData.get("chocoBalance");
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, id),
      columns: {
        subscriptionTier: true,
        chocoBalance: true,
        nearAccountId: true
      }
    });
    if (!currentUser) {
      return Response.json({
        error: "User not found"
      }, {
        status: 404
      });
    }
    const tierChanged = currentUser.subscriptionTier !== tier;
    const shouldGrantChoco = tierChanged && status === "active" && tier !== "FREE";
    let chocoTxHash = null;
    let chocoAmount = "0";
    if (shouldGrantChoco) {
      const plan = SUBSCRIPTION_PLANS[tier];
      if (plan && plan.creditsPerMonth > 0) {
        chocoAmount = plan.creditsPerMonth.toString();
        const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
        if (currentUser.nearAccountId) {
          try {
            const {
              sendChocoToken
            } = await import("./token.server-Gkt5Fi9h.js");
            const sendResult = await sendChocoToken(currentUser.nearAccountId, chocoAmountRaw);
            chocoTxHash = sendResult.transaction.hash;
            logger.info({
              category: "ADMIN",
              message: `Granted ${chocoAmount} CHOCO for membership (admin)`,
              metadata: {
                userId: id,
                tier,
                txHash: chocoTxHash
              }
            });
          } catch (error) {
            logger.error({
              category: "ADMIN",
              message: "Failed to transfer CHOCO on-chain (admin membership grant)",
              stackTrace: error.stack,
              metadata: {
                userId: id,
                tier
              }
            });
          }
        }
      }
    }
    await db.transaction(async (tx) => {
      const currentChocoBalance = currentUser.chocoBalance || "0";
      const chocoToAdd = shouldGrantChoco ? chocoAmount : "0";
      const newChocoBalance = new BigNumber(currentChocoBalance).plus(chocoToAdd).toString();
      const nextMonth = status === "active" ? DateTime.now().plus({
        months: 1
      }).toJSDate() : void 0;
      const isManualOverride = chocoBalance !== null && chocoBalance !== currentChocoBalance;
      const finalChocoBalance = isManualOverride ? chocoBalance : newChocoBalance;
      await tx.update(user).set({
        role,
        subscriptionTier: tier,
        subscriptionStatus: status,
        chocoBalance: finalChocoBalance,
        currentPeriodEnd: nextMonth,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(user.id, id));
      if (shouldGrantChoco && chocoAmount !== "0") {
        await tx.insert(payment).values({
          id: crypto$1.randomUUID(),
          userId: id,
          amount: 0,
          // 관리자 지정이므로 금액 없음
          currency: "CHOCO",
          status: "COMPLETED",
          provider: "ADMIN",
          type: "ADMIN_MEMBERSHIP_GRANT",
          description: `Membership granted: ${tier}`,
          creditsGranted: parseInt(chocoAmount),
          // 호환성을 위해 유지 (deprecated)
          txHash: chocoTxHash || void 0,
          metadata: JSON.stringify({
            tier,
            chocoAmount,
            chocoTxHash,
            grantedBy: "admin"
          }),
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
        if (chocoTxHash && currentUser.nearAccountId) {
          const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);
          await tx.insert(tokenTransfer).values({
            id: crypto$1.randomUUID(),
            userId: id,
            txHash: chocoTxHash,
            amount: chocoAmountRaw,
            tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
            status: "COMPLETED",
            purpose: "ADMIN_MEMBERSHIP_GRANT",
            createdAt: /* @__PURE__ */ new Date()
          });
        }
      }
    });
    return {
      success: true,
      message: "User updated successfully"
    };
  }
  if (actionType === "grant_item") {
    const itemId = formData.get("itemId");
    const quantity = Number(formData.get("quantity"));
    if (!itemId || isNaN(quantity) || quantity <= 0) return Response.json({
      error: "Invalid data"
    }, {
      status: 400
    });
    const existing = await db.query.userInventory.findFirst({
      where: and(eq(userInventory.userId, id), eq(userInventory.itemId, itemId))
    });
    if (existing) {
      await db.update(userInventory).set({
        quantity: existing.quantity + quantity
      }).where(eq(userInventory.id, existing.id));
    } else {
      await db.insert(userInventory).values({
        id: crypto$1.randomUUID(),
        userId: id,
        itemId,
        quantity,
        updatedAt: /* @__PURE__ */ new Date()
      });
    }
    return {
      success: true,
      message: "Item granted successfully"
    };
  }
  if (actionType === "remove_item") {
    const inventoryId = formData.get("inventoryId");
    await db.delete(userInventory).where(eq(userInventory.id, inventoryId));
    return {
      success: true,
      message: "Item removed from inventory"
    };
  }
  if (actionType === "delete_user") {
    await deleteAllUserContexts(id);
    await db.delete(user).where(eq(user.id, id));
    return {
      success: true,
      deleted: true,
      message: "User deleted"
    };
  }
  return null;
}
const detail = UNSAFE_withComponentProps(function UserDetail() {
  const {
    user: user2,
    allItems
  } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const isSubmitting = navigation.state !== "idle";
  const [activeTab, setActiveTab] = useState("profile");
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Success");
      if (actionData.deleted) navigate("/admin/users");
      else revalidator.revalidate();
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData, navigate]);
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-center",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-1",
          children: [/* @__PURE__ */ jsxs("h1", {
            className: "text-3xl font-black italic tracking-tighter text-white uppercase truncate max-w-md",
            children: ["User: ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: user2.name || user2.email
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Manage permissions, CHOCO balances, and inventory."
          })]
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => navigate("/admin/users"),
          className: "px-6 py-3 bg-white/5 text-white/60 rounded-xl font-bold text-sm hover:text-white transition-all underline decoration-primary/30 underline-offset-4",
          children: "BACK TO LIST"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "flex gap-2 p-1 bg-[#1A1821] rounded-2xl w-fit border border-white/5 overflow-x-auto scrollbar-hide",
        children: ["profile", "inventory", "payments"].map((tab) => /* @__PURE__ */ jsx("button", {
          onClick: () => setActiveTab(tab),
          className: cn("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === tab ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-white/40 hover:text-white"),
          children: tab
        }, tab))
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 md:grid-cols-3 gap-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "md:col-span-1 space-y-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 text-center space-y-4",
            children: [/* @__PURE__ */ jsx("div", {
              className: "w-24 h-24 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center font-black text-primary italic text-3xl mx-auto border-dashed",
              children: user2.name?.[0]?.toUpperCase() || user2.email?.[0]?.toUpperCase()
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("h2", {
                className: "text-xl font-black italic text-white uppercase tracking-tighter truncate",
                children: user2.name || "N/A"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-white/40 text-xs font-medium truncate",
                children: user2.email
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex flex-wrap justify-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", user2.role === "admin" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/10 text-white/40"),
                children: user2.role
              }), /* @__PURE__ */ jsx("span", {
                className: cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-black"),
                children: user2.subscriptionTier || "FREE"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821]/60 border border-white/5 rounded-[32px] p-6 space-y-4",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2",
              children: "Quick Stats"
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-3",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between items-center text-xs",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-white/40",
                  children: "CHOCO"
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-primary font-black italic",
                  children: [user2.chocoBalance ? parseFloat(user2.chocoBalance).toLocaleString() : "0", " CHOCO"]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex justify-between items-center text-xs",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-white/40",
                  children: "Inventory"
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-white font-medium",
                  children: [user2.UserInventory.length, " items"]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex justify-between items-center text-xs",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-white/40",
                  children: "Status"
                }), /* @__PURE__ */ jsx("span", {
                  className: cn("font-black capitalize", user2.subscriptionStatus === "active" ? "text-primary" : "text-white/20"),
                  children: user2.subscriptionStatus || "inactive"
                })]
              })]
            })]
          }), activeTab === "profile" && /* @__PURE__ */ jsxs(Form, {
            method: "post",
            onSubmit: (e) => {
              if (!confirm("Are you sure? This action cannot be undone.")) e.preventDefault();
            },
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "_action",
              value: "delete_user"
            }), /* @__PURE__ */ jsx("button", {
              type: "submit",
              className: "w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black italic text-xs uppercase hover:bg-red-500 hover:text-white transition-all tracking-widest shadow-xl shadow-red-500/5",
              children: "DELETE ACCOUNT"
            })]
          })]
        }), /* @__PURE__ */ jsx("div", {
          className: "md:col-span-2",
          children: activeTab === "profile" ? /* @__PURE__ */ jsx("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8",
            children: /* @__PURE__ */ jsxs(Form, {
              method: "post",
              className: "space-y-8",
              children: [/* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "_action",
                value: "update_user"
              }), /* @__PURE__ */ jsxs("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsx("label", {
                    className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic",
                    children: "User Role"
                  }), /* @__PURE__ */ jsxs("select", {
                    name: "role",
                    defaultValue: user2.role || "user",
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer",
                    children: [/* @__PURE__ */ jsx("option", {
                      value: "user",
                      children: "Standard User"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "moderator",
                      children: "Moderator"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "admin",
                      children: "Administrator"
                    })]
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsx("label", {
                    className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic",
                    children: "CHOCO Balance"
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "relative",
                    children: [/* @__PURE__ */ jsx("input", {
                      name: "chocoBalance",
                      type: "text",
                      defaultValue: user2.chocoBalance || "0",
                      className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold pr-16"
                    }), /* @__PURE__ */ jsx("span", {
                      className: "absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black text-[10px] uppercase",
                      children: "CHOCO"
                    })]
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsx("label", {
                    className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic",
                    children: "Subscription Tier"
                  }), /* @__PURE__ */ jsxs("select", {
                    name: "tier",
                    defaultValue: user2.subscriptionTier || "FREE",
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer",
                    children: [/* @__PURE__ */ jsx("option", {
                      value: "FREE",
                      children: "FREE"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "BASIC",
                      children: "BASIC"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "PREMIUM",
                      children: "PREMIUM"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "ULTIMATE",
                      children: "ULTIMATE"
                    })]
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsx("label", {
                    className: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic",
                    children: "Subscription Status"
                  }), /* @__PURE__ */ jsxs("select", {
                    name: "subscriptionStatus",
                    defaultValue: user2.subscriptionStatus || "inactive",
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer",
                    children: [/* @__PURE__ */ jsx("option", {
                      value: "active",
                      children: "Active"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "inactive",
                      children: "Inactive"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "expired",
                      children: "Expired"
                    }), /* @__PURE__ */ jsx("option", {
                      value: "canceled",
                      children: "Canceled"
                    })]
                  })]
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "pt-4",
                children: /* @__PURE__ */ jsx("button", {
                  type: "submit",
                  disabled: isSubmitting,
                  className: cn("w-full py-6 bg-primary text-[#0B0A10] rounded-[32px] font-black italic text-xl tracking-tighter transition-all hover:scale-[1.02] shadow-[0_10px_40px_rgba(255,0,255,0.4)] flex items-center justify-center gap-3", isSubmitting && "opacity-50 cursor-not-allowed"),
                  children: isSubmitting ? /* @__PURE__ */ jsx("span", {
                    className: "w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"
                  }) : /* @__PURE__ */ jsxs(Fragment, {
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined font-bold",
                      children: "save"
                    }), "APPLY CHANGES"]
                  })
                })
              })]
            })
          }) : activeTab === "inventory" ? /* @__PURE__ */ jsxs("div", {
            className: "space-y-8 animate-in fade-in duration-500",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
              children: [/* @__PURE__ */ jsxs("h3", {
                className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-primary text-sm font-bold",
                  children: "card_giftcard"
                }), "Manual Item Grant"]
              }), /* @__PURE__ */ jsxs(Form, {
                method: "post",
                className: "grid grid-cols-1 md:grid-cols-3 gap-4 items-end",
                children: [/* @__PURE__ */ jsx("input", {
                  type: "hidden",
                  name: "_action",
                  value: "grant_item"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "md:col-span-1 space-y-2",
                  children: [/* @__PURE__ */ jsx("label", {
                    className: "text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2",
                    children: "Select Item"
                  }), /* @__PURE__ */ jsx("select", {
                    name: "itemId",
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold",
                    children: allItems.map((item2) => /* @__PURE__ */ jsx("option", {
                      value: item2.id,
                      children: item2.name
                    }, item2.id))
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsx("label", {
                    className: "text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2",
                    children: "Quantity"
                  }), /* @__PURE__ */ jsx("input", {
                    name: "quantity",
                    type: "number",
                    defaultValue: 1,
                    min: 1,
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold"
                  })]
                }), /* @__PURE__ */ jsx("button", {
                  type: "submit",
                  className: "py-4 bg-primary text-black rounded-2xl font-black italic uppercase tracking-tighter hover:scale-105 transition-all",
                  children: "GRANT"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "bg-[#1A1821] border border-white/5 rounded-[40px] overflow-hidden",
              children: [/* @__PURE__ */ jsxs("h3", {
                className: "p-8 pb-4 text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-primary text-sm font-bold",
                  children: "inventory"
                }), "Current Inventory"]
              }), /* @__PURE__ */ jsx("div", {
                className: "divide-y divide-white/5",
                children: user2.UserInventory.length === 0 ? /* @__PURE__ */ jsx("div", {
                  className: "p-12 text-center text-white/20 italic text-xs font-bold uppercase tracking-widest",
                  children: "Inventory is empty."
                }) : user2.UserInventory.map((inv) => /* @__PURE__ */ jsxs("div", {
                  className: "p-6 flex items-center justify-between group hover:bg-white/2 transition-colors",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-4",
                    children: [/* @__PURE__ */ jsx("div", {
                      className: "w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center",
                      children: inv.item.iconUrl ? /* @__PURE__ */ jsx("img", {
                        src: inv.item.iconUrl,
                        alt: inv.item.name,
                        className: "w-8 h-8 object-contain"
                      }) : /* @__PURE__ */ jsx("span", {
                        className: "material-symbols-outlined text-primary/40",
                        children: "token"
                      })
                    }), /* @__PURE__ */ jsxs("div", {
                      children: [/* @__PURE__ */ jsx("p", {
                        className: "text-sm font-black text-white uppercase tracking-tight",
                        children: inv.item.name
                      }), /* @__PURE__ */ jsxs("p", {
                        className: "text-[10px] text-white/40 font-black italic",
                        children: [inv.quantity, " UNITS"]
                      })]
                    })]
                  }), /* @__PURE__ */ jsxs(Form, {
                    method: "post",
                    onSubmit: (e) => !confirm("Remove this item?") && e.preventDefault(),
                    children: [/* @__PURE__ */ jsx("input", {
                      type: "hidden",
                      name: "_action",
                      value: "remove_item"
                    }), /* @__PURE__ */ jsx("input", {
                      type: "hidden",
                      name: "inventoryId",
                      value: inv.id
                    }), /* @__PURE__ */ jsx("button", {
                      className: "w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white",
                      children: /* @__PURE__ */ jsx("span", {
                        className: "material-symbols-outlined text-sm",
                        children: "delete"
                      })
                    })]
                  })]
                }, inv.id))
              })]
            })]
          }) : /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] overflow-hidden animate-in fade-in duration-500",
            children: [/* @__PURE__ */ jsxs("h3", {
              className: "p-8 pb-4 text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary text-sm font-bold",
                children: "receipt_long"
              }), "Payment History"]
            }), /* @__PURE__ */ jsx("div", {
              className: "overflow-x-auto",
              children: /* @__PURE__ */ jsxs("table", {
                className: "w-full text-left",
                children: [/* @__PURE__ */ jsx("thead", {
                  children: /* @__PURE__ */ jsxs("tr", {
                    className: "border-b border-white/5 bg-white/2",
                    children: [/* @__PURE__ */ jsx("th", {
                      className: "px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest",
                      children: "Date"
                    }), /* @__PURE__ */ jsx("th", {
                      className: "px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest",
                      children: "Provider"
                    }), /* @__PURE__ */ jsx("th", {
                      className: "px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest",
                      children: "Amount"
                    }), /* @__PURE__ */ jsx("th", {
                      className: "px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest",
                      children: "CHOCO Granted"
                    }), /* @__PURE__ */ jsx("th", {
                      className: "px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest text-right",
                      children: "Status"
                    })]
                  })
                }), /* @__PURE__ */ jsx("tbody", {
                  className: "divide-y divide-white/5",
                  children: user2.payments.length === 0 ? /* @__PURE__ */ jsx("tr", {
                    children: /* @__PURE__ */ jsx("td", {
                      colSpan: 5,
                      className: "px-8 py-20 text-center text-white/10 italic text-xs font-bold uppercase tracking-widest",
                      children: "No payment records."
                    })
                  }) : user2.payments.map((p) => /* @__PURE__ */ jsxs("tr", {
                    className: "hover:bg-white/1 transition-colors",
                    children: [/* @__PURE__ */ jsx("td", {
                      className: "px-8 py-4 text-[11px] text-white/40 font-medium whitespace-nowrap",
                      children: new Date(p.createdAt).toLocaleDateString()
                    }), /* @__PURE__ */ jsx("td", {
                      className: "px-8 py-4",
                      children: /* @__PURE__ */ jsx("span", {
                        className: "text-[10px] font-black text-white uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded",
                        children: p.provider
                      })
                    }), /* @__PURE__ */ jsx("td", {
                      className: "px-8 py-4",
                      children: /* @__PURE__ */ jsxs("span", {
                        className: "text-xs font-bold text-white",
                        children: ["$", p.amount]
                      })
                    }), /* @__PURE__ */ jsx("td", {
                      className: "px-8 py-4",
                      children: /* @__PURE__ */ jsxs("span", {
                        className: "text-xs font-black text-primary italic",
                        children: ["+", p.creditsGranted || "0", " CHOCO"]
                      })
                    }), /* @__PURE__ */ jsx("td", {
                      className: "px-8 py-4 text-right",
                      children: /* @__PURE__ */ jsx("span", {
                        className: cn("text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm", p.status === "COMPLETED" ? "bg-green-500/20 text-green-400 border border-green-500/20" : p.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"),
                        children: p.status
                      })
                    })]
                  }, p.id))
                })]
              })
            })]
          })
        })]
      })]
    })
  });
});
const route67 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7,
  default: detail,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
async function loader$9({
  request
}) {
  await requireAdmin(request);
  const url = new URL(request.url);
  const provider2 = url.searchParams.get("provider") || "all";
  const status = url.searchParams.get("status") || "all";
  const filters = [];
  if (provider2 !== "all") filters.push(eq(payment.provider, provider2));
  if (status !== "all") filters.push(eq(payment.status, status));
  const payments = await db.query.payment.findMany({
    where: filters.length > 0 ? and(...filters) : void 0,
    with: {
      user: {
        columns: {
          name: true,
          email: true
        }
      }
    },
    orderBy: [desc(payment.createdAt)],
    limit: 100
  });
  const stats = await db.select({
    status: payment.status,
    _count: count(),
    _sum: {
      amount: sum(payment.amount)
    }
  }).from(payment).groupBy(payment.status);
  return {
    payments,
    stats,
    provider: provider2,
    status
  };
}
const index$3 = UNSAFE_withComponentProps(function PaymentHistory() {
  const {
    payments,
    stats,
    provider: provider2,
    status
  } = useLoaderData();
  const submit = useSubmit();
  const totalRevenue = stats.find((s) => s.status === "COMPLETED")?._sum.amount || 0;
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex flex-col md:row justify-between items-start md:items-end gap-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs("h1", {
            className: "text-4xl font-black italic tracking-tighter text-white uppercase",
            children: ["Revenue ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: "Ledger"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Global payment reconciliation and audit logs."
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "px-8 py-4 bg-primary/10 border border-primary/20 rounded-[32px] flex items-center gap-4",
          children: [/* @__PURE__ */ jsx("p", {
            className: "text-[10px] font-black text-primary uppercase tracking-widest",
            children: "Confirmed Revenue"
          }), /* @__PURE__ */ jsxs("span", {
            className: "text-2xl font-black italic text-white tracking-tighter",
            children: ["$", totalRevenue.toLocaleString()]
          })]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "bg-[#1A1821] border border-white/5 rounded-[32px] p-2 flex flex-wrap gap-2 w-fit",
        children: /* @__PURE__ */ jsxs(Form, {
          method: "get",
          className: "flex gap-2",
          onChange: (e) => submit(e.currentTarget),
          children: [/* @__PURE__ */ jsxs("select", {
            name: "provider",
            defaultValue: provider2,
            className: "bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-xs font-black text-white focus:border-primary/50 transition-all appearance-none cursor-pointer",
            children: [/* @__PURE__ */ jsx("option", {
              value: "all",
              children: "ALL PROVIDERS"
            }), /* @__PURE__ */ jsx("option", {
              value: "TOSS",
              children: "TOSS PAY"
            }), /* @__PURE__ */ jsx("option", {
              value: "PAYPAL",
              children: "PAYPAL"
            })]
          }), /* @__PURE__ */ jsxs("select", {
            name: "status",
            defaultValue: status,
            className: "bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-xs font-black text-white focus:border-primary/50 transition-all appearance-none cursor-pointer",
            children: [/* @__PURE__ */ jsx("option", {
              value: "all",
              children: "ALL STATUS"
            }), /* @__PURE__ */ jsx("option", {
              value: "COMPLETED",
              children: "COMPLETED"
            }), /* @__PURE__ */ jsx("option", {
              value: "PENDING",
              children: "PENDING"
            }), /* @__PURE__ */ jsx("option", {
              value: "FAILED",
              children: "FAILED"
            })]
          })]
        })
      }), /* @__PURE__ */ jsx("div", {
        className: "bg-[#1A1821] border border-white/5 rounded-[40px] overflow-hidden",
        children: /* @__PURE__ */ jsx("div", {
          className: "overflow-x-auto",
          children: /* @__PURE__ */ jsxs("table", {
            className: "w-full text-left font-medium",
            children: [/* @__PURE__ */ jsx("thead", {
              children: /* @__PURE__ */ jsxs("tr", {
                className: "border-b border-white/5 bg-white/2",
                children: [/* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "Transaction / User"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "Gateway"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "Amount"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "Status"
                }), /* @__PURE__ */ jsx("th", {
                  className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]",
                  children: "Date"
                })]
              })
            }), /* @__PURE__ */ jsx("tbody", {
              className: "divide-y divide-white/5",
              children: payments.length === 0 ? /* @__PURE__ */ jsx("tr", {
                children: /* @__PURE__ */ jsx("td", {
                  colSpan: 5,
                  className: "px-8 py-20 text-center",
                  children: /* @__PURE__ */ jsx("p", {
                    className: "text-white/20 font-bold italic uppercase tracking-widest",
                    children: "No payment records found"
                  })
                })
              }) : payments.map((p) => /* @__PURE__ */ jsxs("tr", {
                className: "hover:bg-white/1 transition-colors group",
                children: [/* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex flex-col",
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "text-white text-xs font-mono opacity-40 group-hover:opacity-100 transition-opacity",
                      children: p.transactionId || p.paymentKey || p.id
                    }), /* @__PURE__ */ jsx("span", {
                      className: "text-white/60 text-[10px]",
                      children: p.user?.name || p.user?.email || "Unknown"
                    })]
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5",
                  children: /* @__PURE__ */ jsx("span", {
                    className: cn("px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase", p.provider === "TOSS" ? "bg-blue-500/10 text-blue-400" : "bg-primary/10 text-primary"),
                    children: p.provider
                  })
                }), /* @__PURE__ */ jsxs("td", {
                  className: "px-8 py-5 text-white font-black italic tracking-tighter",
                  children: [p.currency === "KRW" ? "₩" : "$", p.amount.toLocaleString()]
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */ jsx("div", {
                      className: cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px]", p.status === "COMPLETED" ? "bg-primary shadow-primary/60" : p.status === "FAILED" ? "bg-red-500 shadow-red-500/60" : "bg-white/20")
                    }), /* @__PURE__ */ jsx("span", {
                      className: cn("text-[10px] font-black uppercase tracking-widest", p.status === "COMPLETED" ? "text-primary" : "text-white/40"),
                      children: p.status
                    })]
                  })
                }), /* @__PURE__ */ jsx("td", {
                  className: "px-8 py-5 text-white/20 text-[10px] font-bold uppercase tracking-tighter",
                  children: new Date(p.createdAt).toLocaleString()
                })]
              }, p.id))
            })]
          })
        })
      })]
    })
  });
});
const route68 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$3,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
async function loader$8({
  request
}) {
  await requireAdmin(request);
  return null;
}
const index$2 = UNSAFE_withComponentProps(function AdminContentIndex() {
  const sections = [{
    title: "Home Spotlight",
    desc: "Configure Today's Pick and main screen highlights.",
    icon: "star",
    href: "/admin/content/home",
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  }, {
    title: "Fan Feed",
    desc: "Manage user-generated tweets and media posts.",
    icon: "rss_feed",
    href: "/admin/content/feed",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  }, {
    title: "Notices & Events",
    desc: "Publish system-wide notifications and banners.",
    icon: "campaign",
    href: "/admin/content/notices",
    color: "text-primary",
    bg: "bg-primary/10"
  }, {
    title: "User Missions",
    desc: "Create and reward engagement with custom tasks.",
    icon: "task_alt",
    href: "/admin/content/missions",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  }];
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "space-y-2",
        children: [/* @__PURE__ */ jsxs("h1", {
          className: "text-4xl font-black italic tracking-tighter text-white uppercase",
          children: ["Content ", /* @__PURE__ */ jsx("span", {
            className: "text-primary",
            children: "Studio"
          })]
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/40 text-sm font-medium",
          children: "Control the public-facing content and user interactions."
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 gap-8",
        children: sections.map((section) => /* @__PURE__ */ jsxs(Link, {
          to: section.href,
          className: cn("group bg-[#1A1821] border border-white/5 p-8 rounded-[40px] hover:border-primary/20 transition-all duration-500 relative overflow-hidden", section.status && "opacity-60 cursor-not-allowed group-hover:border-white/5"),
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex justify-between items-start relative z-10",
            children: [/* @__PURE__ */ jsx("div", {
              className: cn("w-16 h-16 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 duration-500", section.bg),
              children: /* @__PURE__ */ jsx("span", {
                className: cn("material-symbols-outlined text-4xl", section.color),
                children: section.icon
              })
            }), section.status && /* @__PURE__ */ jsx("span", {
              className: "px-3 py-1 bg-white/5 text-white/40 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5",
              children: section.status
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "mt-8 space-y-2 relative z-10",
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-2xl font-black italic text-white uppercase tracking-tighter group-hover:text-primary transition-colors",
              children: section.title
            }), /* @__PURE__ */ jsx("p", {
              className: "text-white/40 text-sm font-medium leading-relaxed",
              children: section.desc
            })]
          }), !section.status && /* @__PURE__ */ jsxs("div", {
            className: "mt-8 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] relative z-10",
            children: ["Manage Channel", /* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-[16px]",
              children: "arrow_forward"
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "absolute top-0 right-0 w-48 h-48 bg-white/[0.02] blur-3xl -mr-24 -mt-24 group-hover:bg-primary/5 transition-all duration-1000"
          })]
        }, section.title))
      })]
    })
  });
});
const route69 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$2,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
async function loader$7({
  request
}) {
  await requireAdmin(request);
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, "TODAYS_PICK_ID")
  });
  const characters = await db.query.character.findMany({
    with: {
      media: true
    }
  });
  return {
    currentPickId: setting?.value || null,
    characters
  };
}
async function action$6({
  request
}) {
  await requireAdmin(request);
  const formData = await request.formData();
  const characterId = formData.get("characterId");
  if (!characterId) {
    return Response.json({
      error: "No character selected"
    }, {
      status: 400
    });
  }
  await db.insert(systemSettings).values({
    key: "TODAYS_PICK_ID",
    value: characterId,
    description: "Home screen Today's Pick Character ID",
    updatedAt: /* @__PURE__ */ new Date()
  }).onConflictDoUpdate({
    target: systemSettings.key,
    set: {
      value: characterId,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  return {
    success: true
  };
}
const home = UNSAFE_withComponentProps(function HomeContentAdmin() {
  const {
    currentPickId,
    characters
  } = useLoaderData();
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "space-y-2",
        children: [/* @__PURE__ */ jsxs(Link, {
          to: "/admin/content",
          className: "text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group mb-2",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-[14px]",
            children: "arrow_back"
          }), "Back to Content Dashboard"]
        }), /* @__PURE__ */ jsxs("h1", {
          className: "text-4xl font-black italic tracking-tighter text-white uppercase",
          children: ["Home Screen ", /* @__PURE__ */ jsx("span", {
            className: "text-primary",
            children: "Configuration"
          })]
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/40 text-sm font-medium",
          children: "Manage featured content and highlights."
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 md:grid-cols-3 gap-8",
        children: [/* @__PURE__ */ jsx("div", {
          className: "md:col-span-2 space-y-6",
          children: /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6 relative overflow-hidden",
            children: [/* @__PURE__ */ jsx("div", {
              className: "absolute top-0 right-0 p-8 opacity-20 pointer-events-none",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[120px] text-white",
                children: "verified"
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative z-10",
              children: [/* @__PURE__ */ jsx("h2", {
                className: "text-xl font-black italic text-white uppercase mb-1",
                children: "Today's Pick"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-white/40 text-xs font-medium mb-6",
                children: "Select the character to feature on the main home screen."
              }), /* @__PURE__ */ jsxs(Form, {
                method: "post",
                className: "space-y-4",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar",
                  children: characters.map((char) => {
                    const isSelected = char.id === currentPickId;
                    const avatar = char.media.find((m) => m.type === "AVATAR")?.url || char.media[0]?.url;
                    return /* @__PURE__ */ jsxs("label", {
                      className: cn("relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all hover:bg-white/5", isSelected ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(255,0,255,0.2)]" : "bg-black/20 border-white/5 hover:border-white/20"),
                      children: [/* @__PURE__ */ jsx("input", {
                        type: "radio",
                        name: "characterId",
                        value: char.id,
                        defaultChecked: isSelected,
                        className: "peer sr-only"
                      }), /* @__PURE__ */ jsx("div", {
                        className: "w-10 h-10 rounded-full overflow-hidden bg-black/50 shrink-0",
                        children: avatar ? /* @__PURE__ */ jsx("img", {
                          src: avatar,
                          alt: char.name,
                          className: "w-full h-full object-cover"
                        }) : /* @__PURE__ */ jsx("div", {
                          className: "w-full h-full flex items-center justify-center text-white/20 text-xs",
                          children: "?"
                        })
                      }), /* @__PURE__ */ jsxs("div", {
                        className: "flex-1 min-w-0",
                        children: [/* @__PURE__ */ jsxs("div", {
                          className: "flex items-center gap-2",
                          children: [/* @__PURE__ */ jsx("p", {
                            className: cn("text-sm font-bold truncate", isSelected ? "text-primary" : "text-white"),
                            children: char.name
                          }), isSelected && /* @__PURE__ */ jsx("span", {
                            className: "material-symbols-outlined text-[14px] text-primary",
                            children: "check_circle"
                          })]
                        }), /* @__PURE__ */ jsx("p", {
                          className: "text-[10px] text-white/40 truncate",
                          children: char.role
                        })]
                      }), /* @__PURE__ */ jsx("div", {
                        className: cn("absolute inset-0 rounded-2xl border-2 pointer-events-none transition-opacity", isSelected ? "border-primary opacity-100" : "border-transparent opacity-0")
                      })]
                    }, char.id);
                  })
                }), /* @__PURE__ */ jsx("div", {
                  className: "pt-4 border-t border-white/5 flex justify-end",
                  children: /* @__PURE__ */ jsx("button", {
                    type: "submit",
                    className: "bg-primary text-black px-8 py-3 rounded-xl font-black italic text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20",
                    children: "Update Highlight"
                  })
                })]
              })]
            })]
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "space-y-6",
          children: /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-6 space-y-4",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-xs font-black text-white/40 uppercase tracking-widest",
              children: "Live Preview"
            }), /* @__PURE__ */ jsx("div", {
              className: "relative w-full aspect-[9/16] bg-black rounded-[32px] border-4 border-[#333] overflow-hidden shadow-2xl",
              children: currentPickId && (() => {
                const picked = characters.find((c) => c.id === currentPickId);
                if (!picked) return null;
                const cover = picked.media.find((m) => m.type === "COVER")?.url || picked.media[0]?.url;
                return /* @__PURE__ */ jsxs("div", {
                  className: "absolute inset-0",
                  children: [/* @__PURE__ */ jsx("img", {
                    src: cover,
                    alt: "Cover",
                    className: "w-full h-full object-cover"
                  }), /* @__PURE__ */ jsx("div", {
                    className: "absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "absolute bottom-8 left-4 right-4",
                    children: [/* @__PURE__ */ jsx("span", {
                      className: "mb-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[8px] font-bold text-primary backdrop-blur-sm border border-primary/30",
                      children: "✨ Today's Pick"
                    }), /* @__PURE__ */ jsx("h1", {
                      className: "text-2xl font-black text-white mb-1",
                      children: picked.name
                    }), /* @__PURE__ */ jsx("p", {
                      className: "text-[10px] text-white/60 line-clamp-2",
                      children: picked.bio
                    })]
                  })]
                });
              })()
            }), /* @__PURE__ */ jsx("p", {
              className: "text-[9px] text-white/20 text-center font-mono",
              children: "Simulated iPhone 14 Pro View"
            })]
          })
        })]
      })]
    })
  });
});
const route70 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: home,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function loader$6({
  request
}) {
  await requireAdmin(request);
  const tweetsData = await db.query.tweet.findMany({
    with: {
      user: {
        columns: {
          name: true,
          email: true,
          image: true
        }
      },
      media: true,
      likes: {
        columns: {
          id: true
        }
      },
      retweets: {
        columns: {
          id: true
        }
      }
    },
    orderBy: [desc(tweet.createdAt)],
    limit: 50
  });
  const tweets = tweetsData.map((t) => ({
    ...t,
    _count: {
      Like: t.likes.length,
      Retweet: t.retweets.length
    }
  }));
  return {
    tweets
  };
}
async function action$5({
  request
}) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "delete_tweet") {
    const id = formData.get("id");
    await db.delete(tweet).where(eq(tweet.id, id));
    return {
      success: true,
      message: "Tweet deleted successfully"
    };
  }
  return null;
}
const feed = UNSAFE_withComponentProps(function AdminFeedManagement() {
  const {
    tweets
  } = useLoaderData();
  const revalidator = useRevalidator();
  const handleDelete = (id) => {
    if (!confirm("Are you sure you want to remove this post? This cannot be undone.")) return;
    const formData = new FormData();
    formData.append("intent", "delete_tweet");
    formData.append("id", id);
    fetch(window.location.pathname, {
      method: "POST",
      body: formData
    }).then(async (res) => {
      if (res.ok) {
        toast.success("Post removed from feed");
        revalidator.revalidate();
      } else {
        toast.error("Failed to delete post");
      }
    });
  };
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex flex-col md:row justify-between items-start md:items-end gap-4",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs(Link, {
            to: "/admin/content",
            className: "text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group mb-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-[14px]",
              children: "arrow_back"
            }), "Back to Studio"]
          }), /* @__PURE__ */ jsxs("h1", {
            className: "text-4xl font-black italic tracking-tighter text-white uppercase",
            children: ["Fan ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: "Feed"
            }), " Moderation"]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Monitor and manage user-generated posts and interactions."
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-white/40",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-sm",
            children: "info"
          }), "Displaying last 50 public posts"]
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6",
        children: tweets.length === 0 ? /* @__PURE__ */ jsxs("div", {
          className: "col-span-full py-32 flex flex-col items-center justify-center space-y-4",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-white/10 text-6xl",
            children: "rss_feed"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/20 font-black italic uppercase tracking-widest",
            children: "No social activity recorded"
          })]
        }) : tweets.map((tweet2) => /* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[32px] overflow-hidden flex flex-col group hover:border-white/10 transition-all",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "p-6 pb-4 flex items-start justify-between",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-3",
              children: [/* @__PURE__ */ jsx("div", {
                className: "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary font-black italic text-sm",
                children: tweet2.user?.image ? /* @__PURE__ */ jsx("img", {
                  src: tweet2.user.image,
                  alt: "",
                  className: "w-full h-full object-cover rounded-xl"
                }) : tweet2.user?.name?.[0] || "?"
              }), /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-xs font-black text-white italic group-hover:text-primary transition-colors",
                  children: tweet2.user?.name || "Suspended User"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-[10px] text-white/20",
                  children: tweet2.user?.email
                })]
              })]
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => handleDelete(tweet2.id),
              className: "w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100",
              children: /* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-[18px]",
                children: "delete"
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "px-6 space-y-4 flex-1",
            children: [/* @__PURE__ */ jsx("p", {
              className: "text-xs text-white/60 leading-relaxed line-clamp-4",
              children: tweet2.content
            }), tweet2.media && tweet2.media.length > 0 && /* @__PURE__ */ jsx("div", {
              className: "grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-white/5",
              children: tweet2.media.map((m) => /* @__PURE__ */ jsx("div", {
                className: "aspect-square bg-black/40 relative",
                children: /* @__PURE__ */ jsx("img", {
                  src: m.url,
                  alt: "",
                  className: "absolute inset-0 w-full h-full object-cover"
                })
              }, m.id))
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "p-6 pt-4 mt-auto",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-6 border-t border-white/5 pt-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-1.5 text-[10px] font-black text-white/20 italic",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[16px] text-primary/40",
                  children: "favorite"
                }), tweet2._count.Like]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-1.5 text-[10px] font-black text-white/20 italic",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[16px] text-blue-400/40",
                  children: "repeat"
                }), tweet2._count.Retweet]
              }), /* @__PURE__ */ jsx("div", {
                className: "flex-1 text-right text-[8px] font-black text-white/10 uppercase tracking-widest italic",
                children: new Date(tweet2.createdAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              })]
            })
          })]
        }, tweet2.id))
      })]
    })
  });
});
const route71 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: feed,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
async function loader$5({
  request
}) {
  await requireAdmin(request);
  const notices = await db.query.notice.findMany({
    orderBy: [desc(notice.createdAt)]
  });
  return {
    notices
  };
}
async function action$4({
  request
}) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "toggle_status") {
    const id = formData.get("id");
    const notice$1 = await db.query.notice.findFirst({
      where: eq(notice.id, id)
    });
    if (notice$1) {
      await db.update(notice).set({
        isActive: !notice$1.isActive
      }).where(eq(notice.id, id));
    }
    return {
      success: true
    };
  }
  if (intent === "delete") {
    const id = formData.get("id");
    const notice$1 = await db.query.notice.findFirst({
      where: eq(notice.id, id)
    });
    if (notice$1?.imageUrl) {
      await deleteImage(notice$1.imageUrl);
    }
    await db.delete(notice).where(eq(notice.id, id));
    return {
      success: true
    };
  }
  return null;
}
const index$1 = UNSAFE_withComponentProps(function AdminNoticeIndex() {
  const {
    notices
  } = useLoaderData();
  const revalidator = useRevalidator();
  const handleDelete = (id) => {
    if (!confirm("Are you sure?")) return;
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", id);
    fetch(window.location.pathname, {
      method: "POST",
      body: formData
    }).then(() => {
      toast.success("Notice deleted");
      revalidator.revalidate();
    });
  };
  const handleToggle = (id) => {
    const formData = new FormData();
    formData.append("intent", "toggle_status");
    formData.append("id", id);
    fetch(window.location.pathname, {
      method: "POST",
      body: formData
    }).then(() => {
      toast.success("Status updated");
      revalidator.revalidate();
    });
  };
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-end",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs(Link, {
            to: "/admin/content",
            className: "text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group mb-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-[14px]",
              children: "arrow_back"
            }), "Back to Studio"]
          }), /* @__PURE__ */ jsxs("h1", {
            className: "text-4xl font-black italic tracking-tighter text-white uppercase",
            children: ["Notice ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: "& Event"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Publish news and system announcements."
          })]
        }), /* @__PURE__ */ jsx(Link, {
          to: "/admin/content/notices/new",
          className: "bg-primary text-black px-6 py-3 rounded-2xl font-black italic text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,255,0.3)]",
          children: "+ NEW NOTICE"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "bg-[#1A1821] border border-white/5 rounded-[40px] overflow-hidden",
        children: /* @__PURE__ */ jsxs("table", {
          className: "w-full text-left",
          children: [/* @__PURE__ */ jsx("thead", {
            children: /* @__PURE__ */ jsxs("tr", {
              className: "border-b border-white/5 bg-white/2",
              children: [/* @__PURE__ */ jsx("th", {
                className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest",
                children: "Type / Title"
              }), /* @__PURE__ */ jsx("th", {
                className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest",
                children: "Status"
              }), /* @__PURE__ */ jsx("th", {
                className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest",
                children: "Date"
              }), /* @__PURE__ */ jsx("th", {
                className: "px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right",
                children: "Actions"
              })]
            })
          }), /* @__PURE__ */ jsx("tbody", {
            className: "divide-y divide-white/5",
            children: notices.length === 0 ? /* @__PURE__ */ jsx("tr", {
              children: /* @__PURE__ */ jsx("td", {
                colSpan: 4,
                className: "px-8 py-20 text-center text-white/20 font-black italic tracking-widest uppercase",
                children: "No notices published"
              })
            }) : notices.map((n) => /* @__PURE__ */ jsxs("tr", {
              className: "hover:bg-white/1 transition-colors group",
              children: [/* @__PURE__ */ jsx("td", {
                className: "px-8 py-5",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "flex flex-col gap-1",
                  children: [/* @__PURE__ */ jsx("span", {
                    className: cn("text-[8px] font-black uppercase px-2 py-0.5 rounded w-fit", n.type === "EVENT" ? "bg-purple-500/20 text-purple-400" : n.type === "NEWS" ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white/40"),
                    children: n.type
                  }), /* @__PURE__ */ jsx("span", {
                    className: "text-sm font-bold text-white group-hover:text-primary transition-colors",
                    children: n.title
                  })]
                })
              }), /* @__PURE__ */ jsx("td", {
                className: "px-8 py-5",
                children: /* @__PURE__ */ jsx("button", {
                  onClick: () => handleToggle(n.id),
                  className: cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all", n.isActive ? "bg-primary/20 text-primary border border-primary/20" : "bg-white/5 text-white/20 border border-white/5"),
                  children: n.isActive ? "Active" : "Draft"
                })
              }), /* @__PURE__ */ jsx("td", {
                className: "px-8 py-5 text-[10px] text-white/20 font-bold",
                children: new Date(n.createdAt).toLocaleDateString()
              }), /* @__PURE__ */ jsx("td", {
                className: "px-8 py-5 text-right",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "flex justify-end gap-2",
                  children: [/* @__PURE__ */ jsx(Link, {
                    to: `/admin/content/notices/${n.id}`,
                    className: "w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all",
                    children: /* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined text-[18px]",
                      children: "edit"
                    })
                  }), /* @__PURE__ */ jsx("button", {
                    onClick: () => handleDelete(n.id),
                    className: "w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all",
                    children: /* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined text-[18px]",
                      children: "delete"
                    })
                  })]
                })
              })]
            }, n.id))
          })]
        })
      })]
    })
  });
});
const route72 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: index$1,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const noticeSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(["NOTICE", "NEWS", "EVENT"]),
  isActive: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  imageUrl: z.string().optional().nullable()
});
async function loader$4({
  request,
  params
}) {
  await requireAdmin(request);
  const {
    id
  } = params;
  if (id === "new" || !id) return {
    notice: null
  };
  const notice$1 = await db.query.notice.findFirst({
    where: eq(notice.id, id)
  });
  if (!notice$1) throw new Response("Not Found", {
    status: 404
  });
  return {
    notice: notice$1
  };
}
async function action$3({
  request,
  params
}) {
  await requireAdmin(request);
  const {
    id
  } = params;
  const formData = await request.formData();
  const validated = noticeSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
    type: formData.get("type"),
    isActive: formData.get("isActive") === "on",
    isPinned: formData.get("isPinned") === "on",
    imageUrl: formData.get("imageUrl") || null
  });
  if (id === "new" || !id) {
    await db.insert(notice).values({
      id: crypto.randomUUID(),
      ...validated,
      updatedAt: /* @__PURE__ */ new Date()
    });
  } else {
    const oldNotice = await db.query.notice.findFirst({
      where: eq(notice.id, id)
    });
    if (oldNotice?.imageUrl && oldNotice.imageUrl !== validated.imageUrl) {
      await deleteImage(oldNotice.imageUrl);
    }
    await db.update(notice).set({
      ...validated,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(notice.id, id));
  }
  return redirect("/admin/content/notices");
}
const edit$1 = UNSAFE_withComponentProps(function EditNotice() {
  const {
    notice: notice2
  } = useLoaderData();
  const isNew = !notice2;
  const [previewUrl, setPreviewUrl] = useState(notice2?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data2 = await res.json();
      setPreviewUrl(data2.url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "space-y-2",
        children: [/* @__PURE__ */ jsxs(Link, {
          to: "/admin/content/notices",
          className: "text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group mb-2",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-[14px]",
            children: "arrow_back"
          }), "Back to List"]
        }), /* @__PURE__ */ jsxs("h1", {
          className: "text-4xl font-black italic tracking-tighter text-white uppercase",
          children: [isNew ? "Create" : "Edit", " ", /* @__PURE__ */ jsx("span", {
            className: "text-primary",
            children: "Notice"
          })]
        })]
      }), /* @__PURE__ */ jsxs(Form, {
        method: "post",
        className: "space-y-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-[10px] font-black text-white/40 uppercase tracking-widest px-1",
              children: "Classification"
            }), /* @__PURE__ */ jsx("div", {
              className: "grid grid-cols-3 gap-4",
              children: ["NOTICE", "NEWS", "EVENT"].map((t) => /* @__PURE__ */ jsxs("label", {
                className: "relative",
                children: [/* @__PURE__ */ jsx("input", {
                  type: "radio",
                  name: "type",
                  value: t,
                  defaultChecked: notice2?.type === t || isNew && t === "NOTICE",
                  className: "peer sr-only"
                }), /* @__PURE__ */ jsx("div", {
                  className: "p-4 rounded-2xl bg-black/40 border border-white/5 text-center text-[10px] font-black uppercase tracking-widest text-white/20 peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-primary transition-all cursor-pointer",
                  children: t
                })]
              }, t))
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-[10px] font-black text-white/40 uppercase tracking-widest px-1",
              children: "Headline"
            }), /* @__PURE__ */ jsx("input", {
              name: "title",
              type: "text",
              defaultValue: notice2?.title,
              placeholder: "Enter announcement title...",
              className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-primary/50 transition-all",
              required: true
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-[10px] font-black text-white/40 uppercase tracking-widest px-1",
              children: "Detailed Content"
            }), /* @__PURE__ */ jsx("textarea", {
              name: "content",
              defaultValue: notice2?.content,
              rows: 10,
              placeholder: "Write the full message here...",
              className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-6 text-sm font-medium text-white/80 focus:border-primary/50 transition-all leading-relaxed",
              required: true
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-[10px] font-black text-white/40 uppercase tracking-widest px-1",
              children: "Attachment Image"
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative group",
              children: [/* @__PURE__ */ jsx("input", {
                type: "file",
                ref: fileInputRef,
                onChange: handleFileChange,
                accept: "image/*",
                className: "hidden"
              }), /* @__PURE__ */ jsx("input", {
                type: "hidden",
                name: "imageUrl",
                value: previewUrl || ""
              }), previewUrl ? /* @__PURE__ */ jsxs("div", {
                className: "relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/20 group",
                children: [/* @__PURE__ */ jsx("img", {
                  src: previewUrl,
                  alt: "Preview",
                  className: "w-full h-full object-cover"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4",
                  children: [/* @__PURE__ */ jsx("button", {
                    type: "button",
                    onClick: () => fileInputRef.current?.click(),
                    className: "p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:scale-110",
                    children: /* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined",
                      children: "edit"
                    })
                  }), /* @__PURE__ */ jsx("button", {
                    type: "button",
                    onClick: () => setPreviewUrl(null),
                    className: "p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-500 transition-all transform hover:scale-110",
                    children: /* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined",
                      children: "delete"
                    })
                  })]
                }), isUploading && /* @__PURE__ */ jsx("div", {
                  className: "absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center",
                  children: /* @__PURE__ */ jsx("div", {
                    className: "size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
                  })
                })]
              }) : /* @__PURE__ */ jsxs("button", {
                type: "button",
                onClick: () => fileInputRef.current?.click(),
                className: "w-full aspect-video rounded-2xl border-2 border-dashed border-white/5 bg-white/2 hover:bg-white/5 hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-3 group",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "p-4 rounded-2xl bg-white/5 group-hover:bg-primary/20 transition-colors",
                  children: /* @__PURE__ */ jsx("span", {
                    className: "material-symbols-outlined text-white/20 group-hover:text-primary transition-colors text-3xl",
                    children: "add_photo_alternate"
                  })
                }), /* @__PURE__ */ jsxs("div", {
                  className: "text-center",
                  children: [/* @__PURE__ */ jsx("p", {
                    className: "text-[10px] font-black text-white/40 uppercase tracking-widest",
                    children: "Click to upload image"
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-[9px] text-white/20 font-bold mt-1",
                    children: "PNG, JPG, GIF up to 10MB"
                  })]
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex gap-8 px-1",
            children: [/* @__PURE__ */ jsxs("label", {
              className: "flex items-center gap-3 cursor-pointer group",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "relative",
                children: [/* @__PURE__ */ jsx("input", {
                  type: "checkbox",
                  name: "isActive",
                  defaultChecked: notice2?.isActive ?? true,
                  className: "peer sr-only"
                }), /* @__PURE__ */ jsx("div", {
                  className: "w-10 h-6 bg-white/5 rounded-full border border-white/10 peer-checked:bg-primary/40 peer-checked:border-primary transition-all"
                }), /* @__PURE__ */ jsx("div", {
                  className: "absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white"
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors",
                children: "Publish Immediately"
              })]
            }), /* @__PURE__ */ jsxs("label", {
              className: "flex items-center gap-3 cursor-pointer group",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "relative",
                children: [/* @__PURE__ */ jsx("input", {
                  type: "checkbox",
                  name: "isPinned",
                  defaultChecked: notice2?.isPinned,
                  className: "peer sr-only"
                }), /* @__PURE__ */ jsx("div", {
                  className: "w-10 h-6 bg-white/5 rounded-full border border-white/10 peer-checked:bg-primary/40 peer-checked:border-primary transition-all"
                }), /* @__PURE__ */ jsx("div", {
                  className: "absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white"
                })]
              }), /* @__PURE__ */ jsx("span", {
                className: "text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors",
                children: "Pin to Top"
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex justify-end gap-4",
          children: [/* @__PURE__ */ jsx(Link, {
            to: "/admin/content/notices",
            className: "px-8 py-4 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors",
            children: "Cancel"
          }), /* @__PURE__ */ jsx("button", {
            type: "submit",
            className: "bg-primary text-black px-12 py-4 rounded-2xl font-black italic text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,0,255,0.4)]",
            children: isNew ? "PUBLISH NOW" : "UPDATE RECORD"
          })]
        })]
      })]
    })
  });
});
const route74 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: edit$1,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3({
  request
}) {
  await requireAdmin(request);
  const missions2 = await db.query.mission.findMany({
    orderBy: [desc(mission.createdAt)]
  });
  return {
    missions: missions2
  };
}
async function action$2({
  request
}) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "toggle_status") {
    const id = formData.get("id");
    const mission$1 = await db.query.mission.findFirst({
      where: eq(mission.id, id)
    });
    if (mission$1) {
      await db.update(mission).set({
        isActive: !mission$1.isActive
      }).where(eq(mission.id, id));
    }
    return {
      success: true
    };
  }
  if (intent === "delete") {
    const id = formData.get("id");
    await db.delete(mission).where(eq(mission.id, id));
    return {
      success: true
    };
  }
  return null;
}
const index = UNSAFE_withComponentProps(function AdminMissionIndex() {
  const {
    missions: missions2
  } = useLoaderData();
  const revalidator = useRevalidator();
  const handleDelete = (id) => {
    if (!confirm("Are you sure?")) return;
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", id);
    fetch(window.location.pathname, {
      method: "POST",
      body: formData
    }).then(() => {
      toast.success("Mission deleted");
      revalidator.revalidate();
    });
  };
  const handleToggle = (id) => {
    const formData = new FormData();
    formData.append("intent", "toggle_status");
    formData.append("id", id);
    fetch(window.location.pathname, {
      method: "POST",
      body: formData
    }).then(() => {
      toast.success("Status updated");
      revalidator.revalidate();
    });
  };
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-end",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsxs(Link, {
            to: "/admin/content",
            className: "text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group mb-2",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-[14px]",
              children: "arrow_back"
            }), "Back to Studio"]
          }), /* @__PURE__ */ jsxs("h1", {
            className: "text-4xl font-black italic tracking-tighter text-white uppercase",
            children: ["User ", /* @__PURE__ */ jsx("span", {
              className: "text-primary",
              children: "Missions"
            })]
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-sm font-medium",
            children: "Manage engagement tasks and CHOCO rewards."
          })]
        }), /* @__PURE__ */ jsx(Link, {
          to: "/admin/content/missions/new",
          className: "bg-primary text-black px-6 py-3 rounded-2xl font-black italic text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]",
          children: "+ NEW MISSION"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        children: missions2.length === 0 ? /* @__PURE__ */ jsx("div", {
          className: "col-span-full py-20 text-center bg-[#1A1821] border border-white/5 rounded-[40px]",
          children: /* @__PURE__ */ jsx("p", {
            className: "text-white/20 font-black italic tracking-widest uppercase",
            children: "No missions configured"
          })
        }) : missions2.map((m) => /* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[32px] p-8 flex flex-col group hover:border-emerald-500/20 transition-all",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex justify-between items-start mb-6",
            children: [/* @__PURE__ */ jsx("div", {
              className: cn("px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest", m.type === "DAILY" ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"),
              children: m.type
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => handleToggle(m.id),
              className: cn("w-2 h-2 rounded-full", m.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/10")
            })]
          }), /* @__PURE__ */ jsx("h3", {
            className: "text-xl font-black italic text-white uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors",
            children: m.title
          }), /* @__PURE__ */ jsx("p", {
            className: "text-white/40 text-xs font-medium leading-relaxed mb-6 line-clamp-2",
            children: m.description
          }), /* @__PURE__ */ jsxs("div", {
            className: "mt-auto flex items-center justify-between",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex items-center gap-1.5",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-emerald-400 text-sm",
                children: "database"
              }), /* @__PURE__ */ jsxs("span", {
                className: "text-sm font-black italic text-emerald-400",
                children: ["+", m.rewardCredits]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex gap-2",
              children: [/* @__PURE__ */ jsx(Link, {
                to: `/admin/content/missions/${m.id}`,
                className: "w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[18px]",
                  children: "edit"
                })
              }), /* @__PURE__ */ jsx("button", {
                onClick: () => handleDelete(m.id),
                className: "w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all",
                children: /* @__PURE__ */ jsx("span", {
                  className: "material-symbols-outlined text-[18px]",
                  children: "delete"
                })
              })]
            })]
          })]
        }, m.id))
      })]
    })
  });
});
const route75 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: index,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const missionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["DAILY", "ONCE", "REPEAT"]),
  rewardCredits: z.number().int().min(1),
  isActive: z.boolean().default(true)
});
async function loader$2({
  request,
  params
}) {
  await requireAdmin(request);
  const {
    id
  } = params;
  if (id === "new" || !id) return {
    mission: null
  };
  const mission$1 = await db.query.mission.findFirst({
    where: eq(mission.id, id)
  });
  if (!mission$1) throw new Response("Not Found", {
    status: 404
  });
  return {
    mission: mission$1
  };
}
async function action$1({
  request,
  params
}) {
  await requireAdmin(request);
  const {
    id
  } = params;
  const formData = await request.formData();
  const validated = missionSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    rewardCredits: Number(formData.get("rewardCredits")),
    isActive: formData.get("isActive") === "on"
  });
  if (id === "new" || !id) {
    await db.insert(mission).values({
      id: crypto.randomUUID(),
      ...validated,
      updatedAt: /* @__PURE__ */ new Date()
    });
  } else {
    await db.update(mission).set({
      ...validated,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(mission.id, id));
  }
  return redirect("/admin/content/missions");
}
const edit = UNSAFE_withComponentProps(function EditMission() {
  const {
    mission: mission2
  } = useLoaderData();
  const isNew = !mission2;
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "space-y-2",
        children: [/* @__PURE__ */ jsxs(Link, {
          to: "/admin/content/missions",
          className: "text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group mb-2",
          children: [/* @__PURE__ */ jsx("span", {
            className: "material-symbols-outlined text-[14px]",
            children: "arrow_back"
          }), "Back to List"]
        }), /* @__PURE__ */ jsxs("h1", {
          className: "text-4xl font-black italic tracking-tighter text-white uppercase",
          children: [isNew ? "Configure" : "Edit", " ", /* @__PURE__ */ jsx("span", {
            className: "text-primary",
            children: "Mission"
          })]
        })]
      }), /* @__PURE__ */ jsxs(Form, {
        method: "post",
        className: "space-y-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-8",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-[10px] font-black text-white/40 uppercase tracking-widest px-1",
              children: "Mission Type"
            }), /* @__PURE__ */ jsx("div", {
              className: "grid grid-cols-3 gap-4",
              children: ["DAILY", "ONCE", "REPEAT"].map((t) => /* @__PURE__ */ jsxs("label", {
                className: "relative",
                children: [/* @__PURE__ */ jsx("input", {
                  type: "radio",
                  name: "type",
                  value: t,
                  defaultChecked: mission2?.type === t || isNew && t === "DAILY",
                  className: "peer sr-only"
                }), /* @__PURE__ */ jsx("div", {
                  className: "p-4 rounded-2xl bg-black/40 border border-white/5 text-center text-[10px] font-black uppercase tracking-widest text-white/20 peer-checked:bg-emerald-500/20 peer-checked:border-emerald-500 peer-checked:text-emerald-400 transition-all cursor-pointer",
                  children: t
                })]
              }, t))
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx("label", {
                className: "text-[10px] font-black text-white/40 uppercase tracking-widest px-1",
                children: "Mission Title"
              }), /* @__PURE__ */ jsx("input", {
                name: "title",
                type: "text",
                defaultValue: mission2?.title,
                placeholder: "e.g., Daily Check-in",
                className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-primary/50 transition-all",
                required: true
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx("label", {
                className: "text-[10px] font-black text-white/40 uppercase tracking-widest px-1",
                children: "Instructions / Description"
              }), /* @__PURE__ */ jsx("textarea", {
                name: "description",
                defaultValue: mission2?.description,
                rows: 4,
                placeholder: "Explain how users can complete this mission...",
                className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white/80 focus:border-primary/50 transition-all leading-relaxed",
                required: true
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-2 gap-8",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx("label", {
                  className: "text-[10px] font-black text-white/40 uppercase tracking-widest px-1",
                  children: "Reward (CHOCO)"
                }), /* @__PURE__ */ jsxs("div", {
                  className: "relative",
                  children: [/* @__PURE__ */ jsx("input", {
                    name: "rewardCredits",
                    type: "number",
                    defaultValue: mission2?.rewardCredits ?? 10,
                    className: "w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-primary/50 transition-all pl-12",
                    required: true
                  }), /* @__PURE__ */ jsx("span", {
                    className: "material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-sm",
                    children: "database"
                  })]
                })]
              }), /* @__PURE__ */ jsx("div", {
                className: "space-y-2 flex flex-col justify-end",
                children: /* @__PURE__ */ jsxs("label", {
                  className: "flex items-center gap-3 cursor-pointer group pb-4",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "relative",
                    children: [/* @__PURE__ */ jsx("input", {
                      type: "checkbox",
                      name: "isActive",
                      defaultChecked: mission2?.isActive ?? true,
                      className: "peer sr-only"
                    }), /* @__PURE__ */ jsx("div", {
                      className: "w-10 h-6 bg-white/5 rounded-full border border-white/10 peer-checked:bg-emerald-500/40 peer-checked:border-emerald-500 transition-all"
                    }), /* @__PURE__ */ jsx("div", {
                      className: "absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white"
                    })]
                  }), /* @__PURE__ */ jsx("span", {
                    className: "text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors",
                    children: "Enabled"
                  })]
                })
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex justify-end gap-4",
          children: [/* @__PURE__ */ jsx(Link, {
            to: "/admin/content/missions",
            className: "px-8 py-4 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors",
            children: "Cancel"
          }), /* @__PURE__ */ jsx("button", {
            type: "submit",
            className: "bg-primary text-black px-12 py-4 rounded-2xl font-black italic text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)]",
            children: isNew ? "CREATE MISSION" : "SAVE CHANGES"
          })]
        })]
      })]
    })
  });
});
const route77 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: edit,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function getServiceWalletStats() {
  try {
    const near = await getNearConnection();
    const account2 = await near.account(NEAR_CONFIG.serviceAccountId);
    const nearBalance = await account2.getAccountBalance();
    const nearBalanceFormatted = new BigNumber(nearBalance.available).dividedBy(new BigNumber(10).pow(24)).toFixed(2);
    const chocoBalanceRaw = await account2.viewFunction({
      contractId: NEAR_CONFIG.chocoTokenContract,
      methodName: "ft_balance_of",
      args: { account_id: NEAR_CONFIG.serviceAccountId }
    });
    const totalSupplyRaw = await account2.viewFunction({
      contractId: NEAR_CONFIG.chocoTokenContract,
      methodName: "ft_total_supply",
      args: {}
    });
    const chocoBalanceFormatted = new BigNumber(chocoBalanceRaw).dividedBy(new BigNumber(10).pow(18)).toFormat(0);
    const totalSupplyFormatted = new BigNumber(totalSupplyRaw).dividedBy(new BigNumber(10).pow(18)).toFormat(0);
    return {
      nearBalance: nearBalanceFormatted,
      chocoBalance: chocoBalanceFormatted,
      chocoBalanceRaw,
      totalSupply: totalSupplyFormatted,
      totalSupplyRaw,
      address: NEAR_CONFIG.serviceAccountId
    };
  } catch (error) {
    console.error("Failed to fetch service wallet stats:", error);
    return {
      nearBalance: "0",
      chocoBalance: "0",
      address: NEAR_CONFIG.serviceAccountId,
      error: "Failed to connect to NEAR"
    };
  }
}
async function getEconomyStats() {
  const userBalanceRes = await db.select({
    total: sql`sum(cast(chocoBalance as decimal))`
  }).from(user);
  const totalUserBalance = new BigNumber(userBalanceRes[0]?.total || "0").toFormat(0);
  const topupRes = await db.select({
    total: sum(payment.creditsGranted)
  }).from(payment).where(sql`type = 'TOPUP' AND status = 'COMPLETED'`);
  const grantRes = await db.select({
    total: sum(payment.creditsGranted)
  }).from(payment).where(sql`type = 'ADMIN_MEMBERSHIP_GRANT' AND status = 'COMPLETED'`);
  const transferRes = await db.select({
    total: sql`sum(cast(amount as decimal))`
  }).from(tokenTransfer).where(sql`status = 'COMPLETED'`);
  const totalOnChainTransferred = new BigNumber(transferRes[0]?.total || "0").dividedBy(new BigNumber(10).pow(18)).toFormat(0);
  const walletUserBalanceRes = await db.select({
    total: sql`sum(cast(chocoBalance as decimal))`
  }).from(user).where(sql`nearAccountId IS NOT NULL`);
  const pendingUserBalanceRes = await db.select({
    total: sql`sum(cast(chocoBalance as decimal))`
  }).from(user).where(sql`nearAccountId IS NULL`);
  const walletUserBalanceRaw = walletUserBalanceRes[0]?.total || "0";
  const pendingUserBalanceRaw = pendingUserBalanceRes[0]?.total || "0";
  return {
    totalUserChoco: totalUserBalance,
    totalUserChocoRaw: userBalanceRes[0]?.total || "0",
    walletUserChocoRaw: walletUserBalanceRaw,
    pendingUserChocoRaw: pendingUserBalanceRaw,
    totalPurchasedChoco: (topupRes[0]?.total || 0).toLocaleString(),
    totalGrantedChoco: (grantRes[0]?.total || 0).toLocaleString(),
    totalOnChainTransferred
  };
}
async function loader$1({
  request
}) {
  await requireAdmin(request);
  const [messagesRes, executionRes, mediaRes, userRes, pendingPaymentsRes, logs, serviceWallet, economy] = await Promise.all([db.select({
    count: count()
  }).from(message), db.select({
    count: count()
  }).from(agentExecution), db.select({
    count: count()
  }).from(characterMedia), db.select({
    count: count()
  }).from(user), db.select({
    count: count()
  }).from(payment).where(eq(payment.status, "PENDING")), db.query.systemLog.findMany({
    orderBy: [desc(systemLog.createdAt)],
    limit: 20
  }), getServiceWalletStats(), getEconomyStats()]);
  const totalMessages = messagesRes[0]?.count || 0;
  const executionCount = executionRes[0]?.count || 0;
  const mediaCount = mediaRes[0]?.count || 0;
  const userCount = userRes[0]?.count || 0;
  const pendingPayments = pendingPaymentsRes[0]?.count || 0;
  const tokenStats = await db.select({
    totalTokens: sum(agentExecution.totalTokens)
  }).from(agentExecution);
  const systemHealth = {
    database: "Connected",
    storage: "Operational",
    api: "Healthy",
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage().rss,
    nodeVersion: process.version
  };
  return {
    usage: {
      totalMessages,
      aiMessages: executionCount,
      mediaCount,
      userCount,
      pendingPayments,
      totalTokens: Number(tokenStats[0]?.totalTokens) || 0
    },
    health: systemHealth,
    economy: {
      serviceWallet,
      stats: economy
    },
    logs
  };
}
const system = UNSAFE_withComponentProps(function AdminSystem() {
  const {
    usage,
    health,
    logs,
    economy
  } = useLoaderData();
  const formatMemory = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };
  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    return `${hrs}h ${mins}m`;
  };
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "space-y-2",
        children: [/* @__PURE__ */ jsxs("h1", {
          className: "text-4xl font-black italic tracking-tighter text-white uppercase",
          children: ["System ", /* @__PURE__ */ jsx("span", {
            className: "text-primary",
            children: "Monitor"
          })]
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/40 text-sm font-medium",
          children: "Real-time infrastructure health and API consumption."
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-4 gap-6",
        children: [{
          label: "Postgres DB",
          status: health.database,
          color: "text-primary"
        }, {
          label: "Cloudinary",
          status: health.storage,
          color: "text-blue-400"
        }, {
          label: "Gemini API",
          status: health.api,
          color: "text-purple-400"
        }, {
          label: "System Uptime",
          status: formatUptime(health.uptime),
          color: "text-white"
        }].map((item2) => /* @__PURE__ */ jsxs("div", {
          className: "bg-[#1A1821] border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center space-y-2 group hover:border-white/10 transition-all",
          children: [/* @__PURE__ */ jsx("div", {
            className: cn("w-2 h-2 rounded-full shadow-[0_0_10px] animate-pulse mb-2", item2.status === "Connected" || item2.status === "Operational" || item2.status === "Healthy" ? "bg-primary shadow-primary/60" : "bg-white/20")
          }), /* @__PURE__ */ jsx("span", {
            className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
            children: item2.label
          }), /* @__PURE__ */ jsx("span", {
            className: cn("text-lg font-black italic tracking-tighter", item2.color),
            children: item2.status
          })]
        }, item2.label))
      }), /* @__PURE__ */ jsxs("div", {
        className: "space-y-6",
        children: [/* @__PURE__ */ jsx("div", {
          className: "flex items-center justify-between",
          children: /* @__PURE__ */ jsxs("div", {
            className: "space-y-1",
            children: [/* @__PURE__ */ jsxs("h2", {
              className: "text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary",
                children: "analytics"
              }), "CHOCO Economy ", /* @__PURE__ */ jsx("span", {
                className: "text-primary/40",
                children: "Integrity Check"
              })]
            }), /* @__PURE__ */ jsx("p", {
              className: "text-white/20 text-[10px] font-bold uppercase tracking-widest",
              children: "Cross-referencing On-Chain Supply with Database Liabilities."
            })]
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[32px] p-6 space-y-4 relative overflow-hidden group",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-1 relative z-10",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-[10px] font-black text-white/30 uppercase tracking-[0.2em]",
                children: "Total Minted (On-Chain)"
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-baseline gap-1",
                children: [/* @__PURE__ */ jsx("h4", {
                  className: "text-2xl font-black italic tracking-tighter text-white whitespace-nowrap",
                  children: economy.serviceWallet.totalSupply
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] font-black text-white/40 italic uppercase",
                  children: "CHOCO"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "pt-4 border-t border-white/5 flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-[9px] font-black text-white/20 uppercase",
                children: "Source"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-[9px] font-black text-primary uppercase italic font-mono",
                children: "ft_total_supply"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-6 space-y-4 relative overflow-hidden group",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-1 relative z-10",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-[10px] font-black text-primary uppercase tracking-[0.2em]",
                children: "Net Available (Service)"
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-baseline gap-1",
                children: [/* @__PURE__ */ jsx("h4", {
                  className: "text-2xl font-black italic tracking-tighter text-primary whitespace-nowrap",
                  children: new BigNumber(economy.serviceWallet.chocoBalanceRaw).minus(economy.stats.pendingUserChocoRaw).dividedBy(new BigNumber(10).pow(18)).toFormat(0)
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] font-black text-primary/40 italic uppercase",
                  children: "CHOCO"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "pt-4 border-t border-primary/10 flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-[8px] font-black text-white/20 uppercase tracking-widest",
                children: "Excluding DB Pending"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-[9px] font-black text-primary uppercase",
                children: "Liquid"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[32px] p-6 space-y-4 group",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-1",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-[10px] font-black text-white/30 uppercase tracking-[0.2em]",
                children: "DB Pending (No-Wallet)"
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-baseline gap-1",
                children: [/* @__PURE__ */ jsx("h4", {
                  className: "text-2xl font-black italic tracking-tighter text-white whitespace-nowrap",
                  children: new BigNumber(economy.stats.pendingUserChocoRaw).toFormat(0)
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] font-black text-white/40 italic uppercase",
                  children: "CHOCO"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "pt-4 border-t border-white/5 flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-[9px] font-black text-white/20 uppercase tracking-widest",
                children: "Liability"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-[9px] font-black text-yellow-500 uppercase",
                children: "Wait Auth"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[32px] p-6 space-y-4 group",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-1",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-[10px] font-black text-white/30 uppercase tracking-[0.2em]",
                children: "Public (In-Wallet)"
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-baseline gap-1",
                children: [/* @__PURE__ */ jsx("h4", {
                  className: "text-2xl font-black italic tracking-tighter text-white whitespace-nowrap",
                  children: new BigNumber(economy.serviceWallet.totalSupplyRaw).minus(economy.serviceWallet.chocoBalanceRaw).dividedBy(new BigNumber(10).pow(18)).toFormat(0)
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[10px] font-black text-white/40 italic uppercase",
                  children: "CHOCO"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "pt-4 border-t border-white/5 flex items-center justify-between",
              children: [/* @__PURE__ */ jsx("span", {
                className: "text-[9px] font-black text-white/20 uppercase tracking-widest",
                children: "Distributed"
              }), /* @__PURE__ */ jsx("span", {
                className: "text-[9px] font-black text-blue-400 uppercase",
                children: "On-Chain"
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: cn("rounded-[32px] p-5 space-y-3 shadow-[0_0_30px_rgba(0,0,0,0.3)] border transition-all duration-500", new BigNumber(economy.serviceWallet.totalSupplyRaw).isEqualTo(1e9 * 1e18) ? "bg-primary border-primary/20" : "bg-red-500 border-red-400"),
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-1",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-[9px] font-black text-[#0B0A10] uppercase tracking-widest",
                children: "Calculated Grand Total"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-2xl font-black italic text-[#0B0A10] tracking-tighter",
                children: new BigNumber(economy.serviceWallet.totalSupplyRaw).dividedBy(new BigNumber(10).pow(18)).toFormat(0)
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "pt-3 border-t border-[#0B0A10]/10",
              children: /* @__PURE__ */ jsxs("div", {
                className: "flex justify-between items-center bg-[#0B0A10]/20 px-2 py-1.5 rounded-lg border border-[#0B0A10]/10",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-[8px] font-black text-[#0B0A10] uppercase",
                  children: "Drift / Loss"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-[9px] font-black text-[#0B0A10] uppercase",
                  children: (() => {
                    const expected = new BigNumber(1e9);
                    const actual = new BigNumber(economy.serviceWallet.totalSupplyRaw).dividedBy(new BigNumber(10).pow(18));
                    const delta = actual.minus(expected);
                    return delta.isZero() ? "None (Perfect)" : `${delta.toFormat(0)} CHOCO`;
                  })()
                })]
              })
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-2xl p-4 flex items-center justify-between",
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
              children: "Total Sales Tracked (USD)"
            }), /* @__PURE__ */ jsxs("span", {
              className: "text-sm font-black italic text-white/80",
              children: ["+", economy.stats.totalPurchasedChoco, " CHOCO"]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-2xl p-4 flex items-center justify-between",
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
              children: "Total Manual Grants"
            }), /* @__PURE__ */ jsxs("span", {
              className: "text-sm font-black italic text-primary/80",
              children: ["+", economy.stats.totalGrantedChoco, " CHOCO"]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-2xl p-4 flex items-center justify-between",
            children: [/* @__PURE__ */ jsx("span", {
              className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
              children: "Service Gas Reserve"
            }), /* @__PURE__ */ jsxs("span", {
              className: "text-sm font-black italic text-white/80",
              children: [economy.serviceWallet.nearBalance, " NEAR"]
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 lg:grid-cols-3 gap-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "lg:col-span-2 space-y-8",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-8",
            children: [/* @__PURE__ */ jsxs("h3", {
              className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary text-sm font-bold",
                children: "analytics"
              }), "API Consumption Metrics"]
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-1 md:grid-cols-2 gap-8",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "flex justify-between items-end",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "space-y-1",
                    children: [/* @__PURE__ */ jsx("p", {
                      className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
                      children: "Gemini (Accumulated Tokens)"
                    }), /* @__PURE__ */ jsx("p", {
                      className: "text-2xl font-black text-white italic tracking-tighter",
                      children: usage.totalTokens.toLocaleString()
                    })]
                  })
                }), /* @__PURE__ */ jsx("div", {
                  className: "h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5",
                  children: /* @__PURE__ */ jsx("div", {
                    className: "h-full bg-primary shadow-[0_0_10px_rgba(255,0,255,0.4)]",
                    style: {
                      width: `${Math.min(usage.totalTokens / 1e6 * 100, 100)}%`
                    }
                  })
                }), /* @__PURE__ */ jsxs("div", {
                  className: "flex justify-between text-[8px] font-black text-white/20 uppercase tracking-tighter",
                  children: [/* @__PURE__ */ jsx("span", {
                    children: "Total Tokens Used"
                  }), /* @__PURE__ */ jsx("span", {
                    children: "Limit: 1M Tokens (Est.)"
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-4",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "flex justify-between items-end",
                  children: /* @__PURE__ */ jsxs("div", {
                    className: "space-y-1",
                    children: [/* @__PURE__ */ jsx("p", {
                      className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
                      children: "Cloudinary (Media)"
                    }), /* @__PURE__ */ jsx("p", {
                      className: "text-2xl font-black text-white italic tracking-tighter",
                      children: usage.mediaCount.toLocaleString()
                    })]
                  })
                }), /* @__PURE__ */ jsx("div", {
                  className: "h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5",
                  children: /* @__PURE__ */ jsx("div", {
                    className: "h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]",
                    style: {
                      width: "12%"
                    }
                  })
                }), /* @__PURE__ */ jsxs("div", {
                  className: "flex justify-between text-[8px] font-black text-white/20 uppercase tracking-tighter",
                  children: [/* @__PURE__ */ jsx("span", {
                    children: "Assets stored"
                  }), /* @__PURE__ */ jsx("span", {
                    children: "Plan: 25GB Free"
                  })]
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
            children: [/* @__PURE__ */ jsxs("h3", {
              className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-red-500 text-sm font-bold",
                children: "event_note"
              }), "Recent System Logs"]
            }), /* @__PURE__ */ jsx("div", {
              className: "space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar",
              children: logs.length === 0 ? /* @__PURE__ */ jsx("p", {
                className: "text-center py-10 text-white/10 font-bold italic uppercase tracking-widest",
                children: "No logs recorded"
              }) : logs.map((log2, i) => /* @__PURE__ */ jsxs("div", {
                className: "group flex flex-col gap-2 p-4 bg-black/20 border border-white/5 rounded-2xl hover:border-white/10 transition-all",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex items-center gap-3",
                  children: [/* @__PURE__ */ jsx("div", {
                    className: cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-black", log2.level === "ERROR" ? "bg-red-500" : log2.level === "WARN" ? "bg-yellow-500" : log2.level === "AUDIT" ? "bg-cyan-500" : "bg-primary"),
                    children: log2.level
                  }), /* @__PURE__ */ jsx("span", {
                    className: "text-[9px] font-black text-white/40 uppercase tracking-widest italic",
                    children: log2.category
                  }), /* @__PURE__ */ jsx("span", {
                    className: "flex-1 text-right text-[8px] text-white/10 uppercase font-bold",
                    children: new Date(log2.createdAt).toLocaleString()
                  })]
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-[11px] font-medium text-white/70 leading-relaxed",
                  children: log2.message
                }), log2.stackTrace && /* @__PURE__ */ jsxs("details", {
                  className: "mt-2 group/stack",
                  children: [/* @__PURE__ */ jsx("summary", {
                    className: "text-[8px] font-black text-white/20 cursor-pointer hover:text-white transition-colors uppercase tracking-widest",
                    children: "View Stack Trace"
                  }), /* @__PURE__ */ jsx("pre", {
                    className: "mt-2 p-4 bg-black/40 rounded-xl text-[10px] text-red-400 overflow-x-auto font-mono opacity-60",
                    children: log2.stackTrace
                  })]
                })]
              }, log2.id))
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "space-y-8",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
            children: [/* @__PURE__ */ jsxs("h3", {
              className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary text-sm font-bold",
                children: "schedule"
              }), "Cron Job Health"]
            }), /* @__PURE__ */ jsx("div", {
              className: "space-y-6",
              children: [{
                name: "Daily CHOCO Refill",
                pattern: "Daily CHOCO Refill",
                icon: "database"
              }, {
                name: "Proactive Service",
                pattern: "proactive message",
                icon: "send"
              }].map((job) => {
                const lastRun = logs.find((l) => l.message.includes(job.pattern) || l.message.toLowerCase().includes(job.pattern.toLowerCase()));
                const isOk = lastRun && lastRun.level !== "ERROR";
                return /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center gap-4",
                  children: [/* @__PURE__ */ jsx("div", {
                    className: cn("w-10 h-10 rounded-xl flex items-center justify-center bg-black/40 border border-white/5", isOk ? "text-primary" : "text-white/20"),
                    children: /* @__PURE__ */ jsx("span", {
                      className: "material-symbols-outlined text-lg",
                      children: job.icon
                    })
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex-1",
                    children: [/* @__PURE__ */ jsx("p", {
                      className: "text-[10px] font-black text-white uppercase tracking-widest",
                      children: job.name
                    }), /* @__PURE__ */ jsx("p", {
                      className: "text-[10px] text-white/20",
                      children: lastRun ? `Last active: ${new Date(lastRun.createdAt).toLocaleTimeString()}` : "No recent activity log"
                    })]
                  }), /* @__PURE__ */ jsx("div", {
                    className: cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", isOk ? "bg-primary/20 text-primary" : "bg-white/5 text-white/20"),
                    children: isOk ? "Healthy" : "Standby"
                  })]
                }, job.name);
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6",
            children: [/* @__PURE__ */ jsxs("h3", {
              className: "text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2",
              children: [/* @__PURE__ */ jsx("span", {
                className: "material-symbols-outlined text-primary text-sm font-bold",
                children: "memory"
              }), "Host Resources"]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-6",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex justify-between items-end",
                  children: [/* @__PURE__ */ jsx("span", {
                    className: "text-[10px] font-black text-white/40 uppercase",
                    children: "Memory RSS"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "text-sm font-black text-white italic tracking-tighter",
                    children: formatMemory(health.memoryUsage)
                  })]
                }), /* @__PURE__ */ jsx("div", {
                  className: "h-2 bg-black/40 rounded-full border border-white/5 overflow-hidden",
                  children: /* @__PURE__ */ jsx("div", {
                    className: "h-full bg-primary",
                    style: {
                      width: "45%"
                    }
                  })
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-1",
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-[10px] font-black text-white/20 uppercase",
                  children: "Running Process"
                }), /* @__PURE__ */ jsxs("p", {
                  className: "text-xs font-medium text-white/60",
                  children: ["Node.js ", health.nodeVersion]
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-primary/5 border border-primary/20 rounded-[40px] p-8 text-center space-y-4",
            children: [/* @__PURE__ */ jsx("span", {
              className: "material-symbols-outlined text-primary text-4xl group-hover:rotate-12 transition-transform duration-500",
              children: "verified_user"
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-1",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-xs font-black text-white uppercase tracking-tighter",
                children: "Security Audit Clear"
              }), /* @__PURE__ */ jsx("p", {
                className: "text-[10px] text-white/40 font-medium",
                children: "All administrative endpoints are protected by MFA/Session validation."
              })]
            })]
          })]
        })]
      })]
    })
  });
});
const route78 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: system,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function getRelayerBalance() {
  const networkId = NEAR_CONFIG.networkId;
  const nodeUrl = NEAR_CONFIG.nodeUrl;
  const serviceAccountId = NEAR_CONFIG.serviceAccountId;
  const near = await connect({
    networkId,
    nodeUrl,
    keyStore: new keyStores.InMemoryKeyStore()
  });
  const account2 = await near.account(serviceAccountId);
  const balance = await account2.getAccountBalance();
  return {
    total: utils$1.format.formatNearAmount(balance.total),
    available: utils$1.format.formatNearAmount(balance.available)
  };
}
async function loader({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2 || !session2.user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, session2.user.id),
    columns: {
      role: true
    }
  });
  if (user$1?.role !== "ADMIN") {
    return Response.json({
      error: "Forbidden"
    }, {
      status: 403
    });
  }
  try {
    const relayerBalance = await getRelayerBalance();
    const nearPriceUSD = await getNearPriceUSD();
    const recentExchanges = await db.query.exchangeLog.findMany({
      orderBy: [desc(exchangeLog.createdAt)],
      limit: 10,
      columns: {
        id: true,
        userId: true,
        fromChain: true,
        fromAmount: true,
        toToken: true,
        toAmount: true,
        rate: true,
        status: true,
        createdAt: true
      }
    });
    const syncStats = await db.select({
      totalUsers: sql`COUNT(*)`,
      usersWithNearAccount: sql`COUNT(${user.nearAccountId})`,
      totalChocoBalance: sql`SUM(CAST(${user.chocoBalance} AS REAL))`
    }).from(user);
    const recentRelayerLogs = await db.query.relayerLog.findMany({
      orderBy: [desc(relayerLog.createdAt)],
      limit: 10,
      columns: {
        id: true,
        userId: true,
        txHash: true,
        status: true,
        error: true,
        createdAt: true
      }
    });
    return Response.json({
      relayerBalance,
      nearPriceUSD,
      recentExchanges,
      syncStats: syncStats[0] || {
        totalUsers: 0,
        usersWithNearAccount: 0,
        totalChocoBalance: "0"
      },
      recentRelayerLogs,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger.error({
      category: "API",
      message: "Monitoring API error",
      stackTrace: error.stack
    });
    return Response.json({
      error: error instanceof Error ? error.message : "Internal server error"
    }, {
      status: 500
    });
  }
}
const route79 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader
}, Symbol.toStringTag, { value: "Module" }));
async function action({
  request
}) {
  const session2 = await auth.api.getSession({
    headers: request.headers
  });
  if (!session2 || !session2.user) {
    return Response.json({
      error: "Unauthorized"
    }, {
      status: 401
    });
  }
  const user$1 = await db.query.user.findFirst({
    where: eq(user.id, session2.user.id),
    columns: {
      role: true
    }
  });
  if (user$1?.role !== "ADMIN") {
    return Response.json({
      error: "Forbidden"
    }, {
      status: 403
    });
  }
  try {
    console.log("[Admin] Manually triggering NEAR deposit monitoring...");
    await runDepositMonitoring();
    return Response.json({
      success: true,
      message: "NEAR deposit monitoring completed"
    });
  } catch (error) {
    console.error("Manual Deposit Monitor Error:", error);
    return Response.json({
      error: error.message
    }, {
      status: 500
    });
  }
}
const route80 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
const $ = UNSAFE_withComponentProps(function AdminNotFound() {
  return /* @__PURE__ */ jsx(AdminLayout, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
      children: [/* @__PURE__ */ jsx("div", {
        className: "w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-4",
        children: /* @__PURE__ */ jsx("span", {
          className: "material-symbols-outlined text-primary text-[48px]",
          children: "search_off"
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "space-y-2",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-4xl font-black italic tracking-tighter text-white uppercase",
          children: "404 - Not Found"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-white/40 font-medium",
          children: "The page you are looking for in the administration area does not exist."
        })]
      }), /* @__PURE__ */ jsx(Link, {
        to: "/admin/dashboard",
        className: "px-6 py-3 bg-primary text-[#0B0A10] rounded-xl font-bold text-sm shadow-[0_4px_20px_rgba(255,0,255,0.3)] hover:scale-105 transition-transform",
        children: "Return to Dashboard"
      })]
    })
  });
});
const route81 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BHnnLmDe.js", "imports": ["/assets/jsx-runtime-u17CrQMm.js", "/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/index-Dc7LDrXT.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-gASdEel8.js", "imports": ["/assets/jsx-runtime-u17CrQMm.js", "/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/index-Dc7LDrXT.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-XQpFve_7.js", "/assets/index.min-BJIztz5B.js", "/assets/chain-labels-DS9REp7K.js", "/assets/wallet-BD6zqWLa.js"], "css": ["/assets/root-DoP4QNFy.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/index": { "id": "routes/index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-DoKyACb9.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": "home", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-r6wqNDE7.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/BottomNavigation-vdZES2hj.js", "/assets/luxon-BDx6lZXm.js", "/assets/utils-BQHNewu7.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-CZej79Zd.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/auth-client-DZcL3Ks9.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/signup": { "id": "routes/signup", "parentId": "root", "path": "signup", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/signup-CgpgaRFl.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-BQHNewu7.js", "/assets/auth-client-DZcL3Ks9.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/wallet-setup": { "id": "routes/wallet-setup", "parentId": "root", "path": "wallet-setup", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/wallet-setup-C5Bk8Kph.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/LoadingSpinner-Ibipr_pd.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/chat/$id": { "id": "routes/chat/$id", "parentId": "root", "path": "chat/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-hwfg0yhv.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-BQHNewu7.js", "/assets/dialog-Dd6_L6Vt.js", "/assets/index-Dc7LDrXT.js", "/assets/ItemStoreModal-DVa-JFG-.js", "/assets/LoadingSpinner-Ibipr_pd.js", "/assets/index-XQpFve_7.js", "/assets/NetworkError-CKNiMwbG.js", "/assets/alert-dialog-DHfOMHGJ.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index.min-BJIztz5B.js", "/assets/react-paypal-js-PCT-g0U3.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/chat/index": { "id": "routes/chat/index", "parentId": "root", "path": "chats", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-DRfPatvz.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-BQHNewu7.js", "/assets/BottomNavigation-vdZES2hj.js", "/assets/NetworkError-CKNiMwbG.js", "/assets/dialog-Dd6_L6Vt.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index.min-BJIztz5B.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/fandom": { "id": "routes/fandom", "parentId": "root", "path": "fandom", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/fandom-Bda0PFs9.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/BottomNavigation-vdZES2hj.js", "/assets/utils-BQHNewu7.js", "/assets/luxon-BDx6lZXm.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/missions": { "id": "routes/missions", "parentId": "root", "path": "missions", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/missions-DP4ul9Mu.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/BottomNavigation-vdZES2hj.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/notices/index": { "id": "routes/notices/index", "parentId": "root", "path": "notices", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-Bs3wf-el.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/BottomNavigation-vdZES2hj.js", "/assets/utils-BQHNewu7.js", "/assets/luxon-BDx6lZXm.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/notices/$id": { "id": "routes/notices/$id", "parentId": "root", "path": "notices/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-BfObFmew.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/BottomNavigation-vdZES2hj.js", "/assets/utils-BQHNewu7.js", "/assets/luxon-BDx6lZXm.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/profile/edit": { "id": "routes/profile/edit", "parentId": "root", "path": "profile/edit", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit--k3xE2cj.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/ComingSoon-BNB2XrAK.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/profile/subscription": { "id": "routes/profile/subscription", "parentId": "root", "path": "profile/subscription", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/subscription-CrOjX4CH.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/luxon-BDx6lZXm.js", "/assets/index-XQpFve_7.js", "/assets/utils-BQHNewu7.js", "/assets/alert-dialog-DHfOMHGJ.js", "/assets/TokenTopUpModal-DTqrfSPU.js", "/assets/dialog-Dd6_L6Vt.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/chain-labels-DS9REp7K.js", "/assets/wallet-BD6zqWLa.js", "/assets/copy-BnkQp-a_.js", "/assets/index-Dc7LDrXT.js", "/assets/react-paypal-js-PCT-g0U3.js", "/assets/subscription-plans-B7yAUbGr.js", "/assets/index.min-BJIztz5B.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/profile/saved": { "id": "routes/profile/saved", "parentId": "root", "path": "profile/saved", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/saved-DHhR_C3k.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/ComingSoon-BNB2XrAK.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/profile/index": { "id": "routes/profile/index", "parentId": "root", "path": "profile", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-Cq3sIJQ6.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/BottomNavigation-vdZES2hj.js", "/assets/auth-client-DZcL3Ks9.js", "/assets/index-XQpFve_7.js", "/assets/TokenTopUpModal-DTqrfSPU.js", "/assets/ItemStoreModal-DVa-JFG-.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js", "/assets/index-Dc7LDrXT.js", "/assets/react-paypal-js-PCT-g0U3.js", "/assets/dialog-Dd6_L6Vt.js", "/assets/index.min-BJIztz5B.js", "/assets/subscription-plans-B7yAUbGr.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings": { "id": "routes/settings", "parentId": "root", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings-DTm7Vsvh.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/auth-client-DZcL3Ks9.js", "/assets/utils-BQHNewu7.js", "/assets/dialog-Dd6_L6Vt.js", "/assets/index-XQpFve_7.js", "/assets/BottomNavigation-vdZES2hj.js", "/assets/index-Dc7LDrXT.js", "/assets/wallet-BD6zqWLa.js", "/assets/copy-BnkQp-a_.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index.min-BJIztz5B.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/test-wallet": { "id": "routes/test-wallet", "parentId": "root", "path": "test-wallet", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/test-wallet-kQ_BcGHG.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/character/$id": { "id": "routes/character/$id", "parentId": "root", "path": "character/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id-DTcre_oz.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/utils-BQHNewu7.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/auth/$": { "id": "routes/api/auth/$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/chat/index": { "id": "routes/api/chat/index", "parentId": "root", "path": "api/chat", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-DnGNibOU.js", "imports": ["/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/chat/create": { "id": "routes/api/chat/create", "parentId": "root", "path": "api/chat/create", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/create-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/chat/delete": { "id": "routes/api/chat/delete", "parentId": "root", "path": "api/chat/delete", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/delete-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/messages/index": { "id": "routes/api/messages/index", "parentId": "root", "path": "api/messages", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/messages/$id.like": { "id": "routes/api/messages/$id.like", "parentId": "root", "path": "api/messages/:id/like", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_id.like-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/upload": { "id": "routes/api/upload", "parentId": "root", "path": "api/upload", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/upload-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/test-cron": { "id": "routes/api/test-cron", "parentId": "root", "path": "api/test-cron", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/test-cron-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/test-wallet": { "id": "routes/api/test-wallet", "parentId": "root", "path": "api/test-wallet", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/test-wallet-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/wallet/export-private-key": { "id": "routes/api/wallet/export-private-key", "parentId": "root", "path": "api/wallet/export-private-key", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/export-private-key-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/wallet/check-deposit": { "id": "routes/api/wallet/check-deposit", "parentId": "root", "path": "api/wallet/check-deposit", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/check-deposit-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/push-subscription": { "id": "routes/api/push-subscription", "parentId": "root", "path": "api/push-subscription", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/push-subscription-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/stats/usage": { "id": "routes/api/stats/usage", "parentId": "root", "path": "api/stats/usage", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/usage-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/items/gift": { "id": "routes/api/items/gift", "parentId": "root", "path": "api/items/gift", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/gift-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.payment.create-order": { "id": "routes/api.payment.create-order", "parentId": "root", "path": "api/payment/create-order", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.payment.create-order-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.payment.capture-order": { "id": "routes/api.payment.capture-order", "parentId": "root", "path": "api/payment/capture-order", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.payment.capture-order-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/pricing": { "id": "routes/pricing", "parentId": "root", "path": "pricing", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/pricing-nwbIDAPV.js", "imports": ["/assets/react-paypal-js-PCT-g0U3.js", "/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/subscription-plans-B7yAUbGr.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/dialog-Dd6_L6Vt.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js", "/assets/index.min-BJIztz5B.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.payment.activate-subscription": { "id": "routes/api.payment.activate-subscription", "parentId": "root", "path": "api/payment/activate-subscription", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.payment.activate-subscription-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.webhooks.paypal": { "id": "routes/api.webhooks.paypal", "parentId": "root", "path": "api/webhooks/paypal", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.webhooks.paypal-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.payment.cancel-subscription": { "id": "routes/api.payment.cancel-subscription", "parentId": "root", "path": "api/payment/cancel-subscription", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.payment.cancel-subscription-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.payment.toss.confirm": { "id": "routes/api.payment.toss.confirm", "parentId": "root", "path": "api/payment/toss-confirm", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api.payment.toss.confirm-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/payment.toss.success": { "id": "routes/payment.toss.success", "parentId": "root", "path": "payment/toss/success", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/payment.toss.success-Bk3utz-S.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/payment.toss.fail": { "id": "routes/payment.toss.fail", "parentId": "root", "path": "payment/toss/fail", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/payment.toss.fail-CcqVr61N.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/items/purchase": { "id": "routes/api/items/purchase", "parentId": "root", "path": "api/items/purchase", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/purchase-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/payment/coinbase/create-charge": { "id": "routes/api/payment/coinbase/create-charge", "parentId": "root", "path": "api/payment/coinbase/create-charge", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/create-charge-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/webhooks/coinbase": { "id": "routes/api/webhooks/coinbase", "parentId": "root", "path": "api/webhooks/coinbase", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/coinbase-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/payment/solana/create-request": { "id": "routes/api/payment/solana/create-request", "parentId": "root", "path": "api/payment/solana/create-request", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/create-request-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/payment/solana/verify": { "id": "routes/api/payment/solana/verify", "parentId": "root", "path": "api/payment/solana/verify", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/verify-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/payment/near/create-request": { "id": "routes/api/payment/near/create-request", "parentId": "root", "path": "api/payment/near/create-request", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/create-request-DP2rzg_V.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/payment/near/verify": { "id": "routes/api/payment/near/verify", "parentId": "root", "path": "api/payment/near/verify", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/verify-DP2rzg_V.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/index": { "id": "routes/api/context/index", "parentId": "root", "path": "api/context", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-DP2rzg_V.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/all": { "id": "routes/api/context/all", "parentId": "root", "path": "api/context/all", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/all-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/$characterId": { "id": "routes/api/context/$characterId", "parentId": "root", "path": "api/context/:characterId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_characterId-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/$characterId.memory": { "id": "routes/api/context/$characterId.memory", "parentId": "root", "path": "api/context/:characterId/memory", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_characterId.memory-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/$characterId.identity": { "id": "routes/api/context/$characterId.identity", "parentId": "root", "path": "api/context/:characterId/identity", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_characterId.identity-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/$characterId.soul": { "id": "routes/api/context/$characterId.soul", "parentId": "root", "path": "api/context/:characterId/soul", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_characterId.soul-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/$characterId.tools": { "id": "routes/api/context/$characterId.tools", "parentId": "root", "path": "api/context/:characterId/tools", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_characterId.tools-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/$characterId.heartbeat": { "id": "routes/api/context/$characterId.heartbeat", "parentId": "root", "path": "api/context/:characterId/heartbeat", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_characterId.heartbeat-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/context/$characterId.export": { "id": "routes/api/context/$characterId.export", "parentId": "root", "path": "api/context/:characterId/export", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_characterId.export-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/dashboard": { "id": "routes/admin/dashboard", "parentId": "root", "path": "admin/dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/dashboard-kptTALPY.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/characters/index": { "id": "routes/admin/characters/index", "parentId": "root", "path": "admin/characters", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-PpBMX8YD.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "admin-character-new": { "id": "admin-character-new", "parentId": "root", "path": "admin/characters/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit-a5m3gmUy.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "admin-character-edit": { "id": "admin-character-edit", "parentId": "root", "path": "admin/characters/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit-a5m3gmUy.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/items/index": { "id": "routes/admin/items/index", "parentId": "root", "path": "admin/items", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-BgtHNRYO.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "admin-item-new": { "id": "admin-item-new", "parentId": "root", "path": "admin/items/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit-DjMw3V42.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "admin-item-edit": { "id": "admin-item-edit", "parentId": "root", "path": "admin/items/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit-DjMw3V42.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/items/statistics": { "id": "routes/admin/items/statistics", "parentId": "root", "path": "admin/items/statistics", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/statistics-DV2BCbNw.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/users/index": { "id": "routes/admin/users/index", "parentId": "root", "path": "admin/users", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-Cx4XSNFP.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/users/detail": { "id": "routes/admin/users/detail", "parentId": "root", "path": "admin/users/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/detail-tmgupSG-.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/payments/index": { "id": "routes/admin/payments/index", "parentId": "root", "path": "admin/payments", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-Dk86CNzC.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/content/index": { "id": "routes/admin/content/index", "parentId": "root", "path": "admin/content", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-DZntjjh-.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/content/home": { "id": "routes/admin/content/home", "parentId": "root", "path": "admin/content/home", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-DSg9jndF.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/content/feed": { "id": "routes/admin/content/feed", "parentId": "root", "path": "admin/content/feed", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/feed-CG2Nf2OJ.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/notices/index": { "id": "routes/admin/notices/index", "parentId": "root", "path": "admin/content/notices", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-DsgIP-ly.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "admin-notice-new": { "id": "admin-notice-new", "parentId": "root", "path": "admin/content/notices/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit-BxpdKFRy.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "admin-notice-edit": { "id": "admin-notice-edit", "parentId": "root", "path": "admin/content/notices/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit-BxpdKFRy.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/missions/index": { "id": "routes/admin/missions/index", "parentId": "root", "path": "admin/content/missions", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-DdQEIV7Y.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/index-XQpFve_7.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/index-Dc7LDrXT.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "admin-mission-new": { "id": "admin-mission-new", "parentId": "root", "path": "admin/content/missions/new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit-sZJVGFCq.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "admin-mission-edit": { "id": "admin-mission-edit", "parentId": "root", "path": "admin/content/missions/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/edit-sZJVGFCq.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/system": { "id": "routes/admin/system", "parentId": "root", "path": "admin/system", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/system-x-CuiQSY.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/utils-BQHNewu7.js", "/assets/_commonjsHelpers-DaWZu8wl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/admin/monitoring/near": { "id": "routes/api/admin/monitoring/near", "parentId": "root", "path": "api/admin/monitoring/near", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/near-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api/admin/monitoring/test-deposit": { "id": "routes/api/admin/monitoring/test-deposit", "parentId": "root", "path": "api/admin/monitoring/test-deposit", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/test-deposit-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/$": { "id": "routes/admin/$", "parentId": "root", "path": "admin/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_-BcfMTsqJ.js", "imports": ["/assets/chunk-WWGJGFF6-C0NtPc5H.js", "/assets/jsx-runtime-u17CrQMm.js", "/assets/AdminLayout-Buts2ej8.js", "/assets/_commonjsHelpers-DaWZu8wl.js", "/assets/utils-BQHNewu7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-a1c6385d.js", "version": "a1c6385d", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/index": {
    id: "routes/index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: "home",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/signup": {
    id: "routes/signup",
    parentId: "root",
    path: "signup",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/wallet-setup": {
    id: "routes/wallet-setup",
    parentId: "root",
    path: "wallet-setup",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/chat/$id": {
    id: "routes/chat/$id",
    parentId: "root",
    path: "chat/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/chat/index": {
    id: "routes/chat/index",
    parentId: "root",
    path: "chats",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/fandom": {
    id: "routes/fandom",
    parentId: "root",
    path: "fandom",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/missions": {
    id: "routes/missions",
    parentId: "root",
    path: "missions",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/notices/index": {
    id: "routes/notices/index",
    parentId: "root",
    path: "notices",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/notices/$id": {
    id: "routes/notices/$id",
    parentId: "root",
    path: "notices/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/profile/edit": {
    id: "routes/profile/edit",
    parentId: "root",
    path: "profile/edit",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/profile/subscription": {
    id: "routes/profile/subscription",
    parentId: "root",
    path: "profile/subscription",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/profile/saved": {
    id: "routes/profile/saved",
    parentId: "root",
    path: "profile/saved",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/profile/index": {
    id: "routes/profile/index",
    parentId: "root",
    path: "profile",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/settings": {
    id: "routes/settings",
    parentId: "root",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/test-wallet": {
    id: "routes/test-wallet",
    parentId: "root",
    path: "test-wallet",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/character/$id": {
    id: "routes/character/$id",
    parentId: "root",
    path: "character/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route18
  },
  "routes/api/auth/$": {
    id: "routes/api/auth/$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/api/chat/index": {
    id: "routes/api/chat/index",
    parentId: "root",
    path: "api/chat",
    index: void 0,
    caseSensitive: void 0,
    module: route20
  },
  "routes/api/chat/create": {
    id: "routes/api/chat/create",
    parentId: "root",
    path: "api/chat/create",
    index: void 0,
    caseSensitive: void 0,
    module: route21
  },
  "routes/api/chat/delete": {
    id: "routes/api/chat/delete",
    parentId: "root",
    path: "api/chat/delete",
    index: void 0,
    caseSensitive: void 0,
    module: route22
  },
  "routes/api/messages/index": {
    id: "routes/api/messages/index",
    parentId: "root",
    path: "api/messages",
    index: void 0,
    caseSensitive: void 0,
    module: route23
  },
  "routes/api/messages/$id.like": {
    id: "routes/api/messages/$id.like",
    parentId: "root",
    path: "api/messages/:id/like",
    index: void 0,
    caseSensitive: void 0,
    module: route24
  },
  "routes/api/upload": {
    id: "routes/api/upload",
    parentId: "root",
    path: "api/upload",
    index: void 0,
    caseSensitive: void 0,
    module: route25
  },
  "routes/api/test-cron": {
    id: "routes/api/test-cron",
    parentId: "root",
    path: "api/test-cron",
    index: void 0,
    caseSensitive: void 0,
    module: route26
  },
  "routes/api/test-wallet": {
    id: "routes/api/test-wallet",
    parentId: "root",
    path: "api/test-wallet",
    index: void 0,
    caseSensitive: void 0,
    module: route27
  },
  "routes/api/wallet/export-private-key": {
    id: "routes/api/wallet/export-private-key",
    parentId: "root",
    path: "api/wallet/export-private-key",
    index: void 0,
    caseSensitive: void 0,
    module: route28
  },
  "routes/api/wallet/check-deposit": {
    id: "routes/api/wallet/check-deposit",
    parentId: "root",
    path: "api/wallet/check-deposit",
    index: void 0,
    caseSensitive: void 0,
    module: route29
  },
  "routes/api/push-subscription": {
    id: "routes/api/push-subscription",
    parentId: "root",
    path: "api/push-subscription",
    index: void 0,
    caseSensitive: void 0,
    module: route30
  },
  "routes/api/stats/usage": {
    id: "routes/api/stats/usage",
    parentId: "root",
    path: "api/stats/usage",
    index: void 0,
    caseSensitive: void 0,
    module: route31
  },
  "routes/api/items/gift": {
    id: "routes/api/items/gift",
    parentId: "root",
    path: "api/items/gift",
    index: void 0,
    caseSensitive: void 0,
    module: route32
  },
  "routes/api.payment.create-order": {
    id: "routes/api.payment.create-order",
    parentId: "root",
    path: "api/payment/create-order",
    index: void 0,
    caseSensitive: void 0,
    module: route33
  },
  "routes/api.payment.capture-order": {
    id: "routes/api.payment.capture-order",
    parentId: "root",
    path: "api/payment/capture-order",
    index: void 0,
    caseSensitive: void 0,
    module: route34
  },
  "routes/pricing": {
    id: "routes/pricing",
    parentId: "root",
    path: "pricing",
    index: void 0,
    caseSensitive: void 0,
    module: route35
  },
  "routes/api.payment.activate-subscription": {
    id: "routes/api.payment.activate-subscription",
    parentId: "root",
    path: "api/payment/activate-subscription",
    index: void 0,
    caseSensitive: void 0,
    module: route36
  },
  "routes/api.webhooks.paypal": {
    id: "routes/api.webhooks.paypal",
    parentId: "root",
    path: "api/webhooks/paypal",
    index: void 0,
    caseSensitive: void 0,
    module: route37
  },
  "routes/api.payment.cancel-subscription": {
    id: "routes/api.payment.cancel-subscription",
    parentId: "root",
    path: "api/payment/cancel-subscription",
    index: void 0,
    caseSensitive: void 0,
    module: route38
  },
  "routes/api.payment.toss.confirm": {
    id: "routes/api.payment.toss.confirm",
    parentId: "root",
    path: "api/payment/toss-confirm",
    index: void 0,
    caseSensitive: void 0,
    module: route39
  },
  "routes/payment.toss.success": {
    id: "routes/payment.toss.success",
    parentId: "root",
    path: "payment/toss/success",
    index: void 0,
    caseSensitive: void 0,
    module: route40
  },
  "routes/payment.toss.fail": {
    id: "routes/payment.toss.fail",
    parentId: "root",
    path: "payment/toss/fail",
    index: void 0,
    caseSensitive: void 0,
    module: route41
  },
  "routes/api/items/purchase": {
    id: "routes/api/items/purchase",
    parentId: "root",
    path: "api/items/purchase",
    index: void 0,
    caseSensitive: void 0,
    module: route42
  },
  "routes/api/payment/coinbase/create-charge": {
    id: "routes/api/payment/coinbase/create-charge",
    parentId: "root",
    path: "api/payment/coinbase/create-charge",
    index: void 0,
    caseSensitive: void 0,
    module: route43
  },
  "routes/api/webhooks/coinbase": {
    id: "routes/api/webhooks/coinbase",
    parentId: "root",
    path: "api/webhooks/coinbase",
    index: void 0,
    caseSensitive: void 0,
    module: route44
  },
  "routes/api/payment/solana/create-request": {
    id: "routes/api/payment/solana/create-request",
    parentId: "root",
    path: "api/payment/solana/create-request",
    index: void 0,
    caseSensitive: void 0,
    module: route45
  },
  "routes/api/payment/solana/verify": {
    id: "routes/api/payment/solana/verify",
    parentId: "root",
    path: "api/payment/solana/verify",
    index: void 0,
    caseSensitive: void 0,
    module: route46
  },
  "routes/api/payment/near/create-request": {
    id: "routes/api/payment/near/create-request",
    parentId: "root",
    path: "api/payment/near/create-request",
    index: void 0,
    caseSensitive: void 0,
    module: route47
  },
  "routes/api/payment/near/verify": {
    id: "routes/api/payment/near/verify",
    parentId: "root",
    path: "api/payment/near/verify",
    index: void 0,
    caseSensitive: void 0,
    module: route48
  },
  "routes/api/context/index": {
    id: "routes/api/context/index",
    parentId: "root",
    path: "api/context",
    index: void 0,
    caseSensitive: void 0,
    module: route49
  },
  "routes/api/context/all": {
    id: "routes/api/context/all",
    parentId: "root",
    path: "api/context/all",
    index: void 0,
    caseSensitive: void 0,
    module: route50
  },
  "routes/api/context/$characterId": {
    id: "routes/api/context/$characterId",
    parentId: "root",
    path: "api/context/:characterId",
    index: void 0,
    caseSensitive: void 0,
    module: route51
  },
  "routes/api/context/$characterId.memory": {
    id: "routes/api/context/$characterId.memory",
    parentId: "root",
    path: "api/context/:characterId/memory",
    index: void 0,
    caseSensitive: void 0,
    module: route52
  },
  "routes/api/context/$characterId.identity": {
    id: "routes/api/context/$characterId.identity",
    parentId: "root",
    path: "api/context/:characterId/identity",
    index: void 0,
    caseSensitive: void 0,
    module: route53
  },
  "routes/api/context/$characterId.soul": {
    id: "routes/api/context/$characterId.soul",
    parentId: "root",
    path: "api/context/:characterId/soul",
    index: void 0,
    caseSensitive: void 0,
    module: route54
  },
  "routes/api/context/$characterId.tools": {
    id: "routes/api/context/$characterId.tools",
    parentId: "root",
    path: "api/context/:characterId/tools",
    index: void 0,
    caseSensitive: void 0,
    module: route55
  },
  "routes/api/context/$characterId.heartbeat": {
    id: "routes/api/context/$characterId.heartbeat",
    parentId: "root",
    path: "api/context/:characterId/heartbeat",
    index: void 0,
    caseSensitive: void 0,
    module: route56
  },
  "routes/api/context/$characterId.export": {
    id: "routes/api/context/$characterId.export",
    parentId: "root",
    path: "api/context/:characterId/export",
    index: void 0,
    caseSensitive: void 0,
    module: route57
  },
  "routes/admin/dashboard": {
    id: "routes/admin/dashboard",
    parentId: "root",
    path: "admin/dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route58
  },
  "routes/admin/characters/index": {
    id: "routes/admin/characters/index",
    parentId: "root",
    path: "admin/characters",
    index: void 0,
    caseSensitive: void 0,
    module: route59
  },
  "admin-character-new": {
    id: "admin-character-new",
    parentId: "root",
    path: "admin/characters/new",
    index: void 0,
    caseSensitive: void 0,
    module: route61
  },
  "admin-character-edit": {
    id: "admin-character-edit",
    parentId: "root",
    path: "admin/characters/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route61
  },
  "routes/admin/items/index": {
    id: "routes/admin/items/index",
    parentId: "root",
    path: "admin/items",
    index: void 0,
    caseSensitive: void 0,
    module: route62
  },
  "admin-item-new": {
    id: "admin-item-new",
    parentId: "root",
    path: "admin/items/new",
    index: void 0,
    caseSensitive: void 0,
    module: route64
  },
  "admin-item-edit": {
    id: "admin-item-edit",
    parentId: "root",
    path: "admin/items/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route64
  },
  "routes/admin/items/statistics": {
    id: "routes/admin/items/statistics",
    parentId: "root",
    path: "admin/items/statistics",
    index: void 0,
    caseSensitive: void 0,
    module: route65
  },
  "routes/admin/users/index": {
    id: "routes/admin/users/index",
    parentId: "root",
    path: "admin/users",
    index: void 0,
    caseSensitive: void 0,
    module: route66
  },
  "routes/admin/users/detail": {
    id: "routes/admin/users/detail",
    parentId: "root",
    path: "admin/users/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route67
  },
  "routes/admin/payments/index": {
    id: "routes/admin/payments/index",
    parentId: "root",
    path: "admin/payments",
    index: void 0,
    caseSensitive: void 0,
    module: route68
  },
  "routes/admin/content/index": {
    id: "routes/admin/content/index",
    parentId: "root",
    path: "admin/content",
    index: void 0,
    caseSensitive: void 0,
    module: route69
  },
  "routes/admin/content/home": {
    id: "routes/admin/content/home",
    parentId: "root",
    path: "admin/content/home",
    index: void 0,
    caseSensitive: void 0,
    module: route70
  },
  "routes/admin/content/feed": {
    id: "routes/admin/content/feed",
    parentId: "root",
    path: "admin/content/feed",
    index: void 0,
    caseSensitive: void 0,
    module: route71
  },
  "routes/admin/notices/index": {
    id: "routes/admin/notices/index",
    parentId: "root",
    path: "admin/content/notices",
    index: void 0,
    caseSensitive: void 0,
    module: route72
  },
  "admin-notice-new": {
    id: "admin-notice-new",
    parentId: "root",
    path: "admin/content/notices/new",
    index: void 0,
    caseSensitive: void 0,
    module: route74
  },
  "admin-notice-edit": {
    id: "admin-notice-edit",
    parentId: "root",
    path: "admin/content/notices/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route74
  },
  "routes/admin/missions/index": {
    id: "routes/admin/missions/index",
    parentId: "root",
    path: "admin/content/missions",
    index: void 0,
    caseSensitive: void 0,
    module: route75
  },
  "admin-mission-new": {
    id: "admin-mission-new",
    parentId: "root",
    path: "admin/content/missions/new",
    index: void 0,
    caseSensitive: void 0,
    module: route77
  },
  "admin-mission-edit": {
    id: "admin-mission-edit",
    parentId: "root",
    path: "admin/content/missions/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route77
  },
  "routes/admin/system": {
    id: "routes/admin/system",
    parentId: "root",
    path: "admin/system",
    index: void 0,
    caseSensitive: void 0,
    module: route78
  },
  "routes/api/admin/monitoring/near": {
    id: "routes/api/admin/monitoring/near",
    parentId: "root",
    path: "api/admin/monitoring/near",
    index: void 0,
    caseSensitive: void 0,
    module: route79
  },
  "routes/api/admin/monitoring/test-deposit": {
    id: "routes/api/admin/monitoring/test-deposit",
    parentId: "root",
    path: "api/admin/monitoring/test-deposit",
    index: void 0,
    caseSensitive: void 0,
    module: route80
  },
  "routes/admin/$": {
    id: "routes/admin/$",
    parentId: "root",
    path: "admin/*",
    index: void 0,
    caseSensitive: void 0,
    module: route81
  }
};
export {
  NEAR_CONFIG as N,
  assetsBuildDirectory as a,
  basename as b,
  entry as c,
  db as d,
  ensureNearWalletOnChain as e,
  future as f,
  getNearConnection as g,
  publicPath as h,
  isSpaMode as i,
  routes as j,
  ssr as k,
  storageDeposit_server as l,
  prerender as p,
  routeDiscovery as r,
  serverManifest as s,
  user as u
};
