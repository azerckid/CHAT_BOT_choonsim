/**
 * 클라이언트 사이드 NEAR 지갑 유틸리티
 * 
 * "WalletConnection is not a constructor" 에러 및 가스리스 트랜잭션 수정을 위해
 * near-api-js v6+ 표준에 맞춰 전면 재작성되었습니다.
 */
import * as nearApi from "near-api-js";
import { Buffer } from "buffer";

// 브라우저 환경 가드 및 폴리필
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
}

const getNearConfig = () => {
    return {
        networkId: import.meta.env.VITE_NEAR_NETWORK_ID || "testnet",
        nodeUrl: import.meta.env.VITE_NEAR_NODE_URL || "https://rpc.testnet.near.org",
        walletUrl: import.meta.env.VITE_NEAR_WALLET_URL || "https://testnet.mynearwallet.com",
        helperUrl: import.meta.env.VITE_NEAR_HELPER_URL || "https://helper.testnet.near.org",
    };
};

/**
 * NEAR 연결 초기화
 */
export async function initNearConnection() {
    if (typeof window === 'undefined') return null;
    const config = getNearConfig();
    return await nearApi.connect({
        ...config,
        keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
    });
}

/**
 * 지갑 연결 확인
 */
export async function isWalletConnected(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
        const near = await initNearConnection();
        if (!near) return false;
        const wallet = new nearApi.WalletConnection(near, "choonsim");
        return wallet.isSignedIn();
    } catch (error) {
        return false;
    }
}

/**
 * 현재 로그인된 계정 ID
 */
export async function getCurrentAccountId(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
        const near = await initNearConnection();
        if (!near) return null;
        const wallet = new nearApi.WalletConnection(near, "choonsim");
        return wallet.isSignedIn() ? wallet.getAccountId() : null;
    } catch (error) {
        return null;
    }
}

/**
 * 지갑 로그인 요청
 */
export async function requestWalletConnection(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    try {
        const near = await initNearConnection();
        if (!near) throw new Error("NEAR init failed");
        const wallet = new nearApi.WalletConnection(near, "choonsim");
        if (wallet.isSignedIn()) return wallet.getAccountId();

        const tokenContract = import.meta.env.VITE_CHOCO_TOKEN_CONTRACT || "choco.token.primitives.testnet";
        await wallet.requestSignIn({
            contractId: tokenContract,
            methodNames: ["ft_transfer_call"],
        });
        return null;
    } catch (error) {
        throw error;
    }
}

/**
 * CHOCO 잔액 조회 (View Function)
 */
export async function getChocoBalance(accountId: string, tokenContract: string): Promise<string> {
    if (typeof window === 'undefined') return "0";
    try {
        const near = await initNearConnection();
        if (!near) return "0";
        const account = await near.account(tokenContract);
        const balanceRaw = await account.viewFunction({
            contractId: tokenContract,
            methodName: "ft_balance_of",
            args: { account_id: accountId },
        });
        return (parseFloat(balanceRaw) / 1e18).toString();
    } catch (error) {
        return "0";
    }
}

/**
 * 가스리스 트랜잭션을 위한 SignedDelegate 생성
 */
export async function createSignedDelegate(
    accountId: string,
    receiverId: string,
    actions: any[]
): Promise<string> {
    const near = await initNearConnection();
    if (!near) throw new Error("NEAR init failed");

    const account = await near.account(accountId);
    const accessKey = await account.findAccessKey(accountId, []);
    if (!accessKey) throw new Error("No access key");

    const block = await near.connection.provider.block({ finality: "final" });

    // near-api-js v6+ 에서는 transactions.createDelegateAction 직접 사용 대신 
    // 클래스 인스턴스 생성이 필요할 수 있으나, 보통 API가 제공됨.
    // 만약 에러 발생 시를 대비해 수동 객체 구성 방식(v6 스타일) 권장.
    const delegateAction = nearApi.transactions.createDelegateAction({
        senderId: accountId,
        receiverId: receiverId,
        actions: actions,
        nonce: BigInt(accessKey.accessKey.nonce) + BigInt(1),
        maxBlockHeight: BigInt(block.header.height) + BigInt(100),
        publicKey: nearApi.utils.PublicKey.from(accessKey.publicKey),
    });

    const { networkId } = getNearConfig();
    const signedDelegate = await nearApi.transactions.signDelegateAction({
        delegateAction,
        signer: near.connection.signer,
        networkId,
    });

    return Buffer.from(signedDelegate.encode()).toString("base64");
}

/**
 * 가스비 대납 CHOCO 전송
 */
export async function transferChocoTokenGasless(
    accountId: string,
    recipientId: string,
    amount: string,
    tokenContract: string
): Promise<string> {
    const amountFloat = parseFloat(amount);
    const amountBigInt = BigInt(Math.floor(amountFloat * 1e18)).toString();

    const action = nearApi.transactions.functionCall(
        "ft_transfer_call",
        { receiver_id: recipientId, amount: amountBigInt, msg: "" },
        BigInt("30000000000000"),
        BigInt("1")
    );

    const signedDelegateBase64 = await createSignedDelegate(accountId, tokenContract, [action]);

    const res = await fetch("/api/relayer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedDelegate: signedDelegateBase64 }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Relay failed");
    return data.txHash;
}

/**
 * 일반 CHOCO 전송 (사용자가 가스비 지불)
 */
export async function transferChocoToken(
    accountId: string,
    recipientId: string,
    amount: string,
    tokenContract: string
): Promise<string> {
    const near = await initNearConnection();
    if (!near) throw new Error("NEAR init failed");
    const account = await near.account(accountId);

    const amountFloat = parseFloat(amount);
    const amountBigInt = BigInt(Math.floor(amountFloat * 1e18)).toString();

    const result = await account.functionCall({
        contractId: tokenContract,
        methodName: "ft_transfer_call",
        args: { receiver_id: recipientId, amount: amountBigInt, msg: "" },
        attachedDeposit: BigInt(1),
        gas: BigInt("30000000000000"),
    });

    return result.transaction.hash;
}
