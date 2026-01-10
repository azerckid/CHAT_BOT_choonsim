/**
 * 클라이언트 사이드 NEAR 지갑 유틸리티
 * 브라우저에서 NEAR 지갑과 상호작용하기 위한 함수들
 * 
 * 주의: 이 파일은 클라이언트 전용입니다. SSR에서 실행되지 않도록 주의하세요.
 */

// CommonJS 모듈 호환성을 위해 default import 사용
// SSR 환경에서는 실행되지 않도록 동적 import 사용
let nearApiJs: any = null;

async function getNearApiJs() {
    if (typeof window === 'undefined') {
        throw new Error("wallet-client.ts is client-side only");
    }

    if (!nearApiJs) {
        nearApiJs = await import("near-api-js");
    }

    return nearApiJs;
}

// NEAR 네트워크 설정 (클라이언트용)
// 클라이언트에서는 환경 변수를 직접 사용할 수 없으므로, 빌드 시점에 주입되거나 기본값 사용
const getNearConfig = () => {
    // Vite 환경 변수는 import.meta.env를 사용
    const networkId = import.meta.env.VITE_NEAR_NETWORK_ID || "testnet";
    const nodeUrl = import.meta.env.VITE_NEAR_NODE_URL || "https://rpc.testnet.near.org";
    const walletUrl = import.meta.env.VITE_NEAR_WALLET_URL || "https://testnet.mynearwallet.com";
    const helperUrl = import.meta.env.VITE_NEAR_HELPER_URL || "https://helper.testnet.near.org";

    return {
        networkId,
        nodeUrl,
        walletUrl,
        helperUrl,
    };
};

/**
 * NEAR 연결 초기화
 */
export async function initNearConnection() {
    if (typeof window === 'undefined') {
        throw new Error("initNearConnection is client-side only");
    }

    const nearApi = await getNearApiJs();
    const { connect, keyStores } = nearApi;
    const config = getNearConfig();

    const near = await connect({
        ...config,
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
    });
    return near;
}

/**
 * CHOCO 토큰 전송 (ft_transfer_call)
 * @param accountId 사용자 NEAR 계정 ID
 * @param recipientId 수신자 계정 ID
 * @param amount 전송할 CHOCO 토큰 수량 (human-readable, 예: "100")
 * @param tokenContract CHOCO 토큰 컨트랙트 주소
 * @returns 트랜잭션 해시
 */
export async function transferChocoToken(
    accountId: string,
    recipientId: string,
    amount: string,
    tokenContract: string
): Promise<string> {
    if (typeof window === 'undefined') {
        throw new Error("transferChocoToken is client-side only");
    }

    const near = await initNearConnection();
    const account = await near.account(accountId);

    // CHOCO는 18 decimals이므로 직접 변환
    // 예: "100" -> "100000000000000000000" (100 * 10^18)
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
        throw new Error("Invalid amount");
    }

    // 18 decimals로 변환 (문자열로 변환하여 정밀도 유지)
    const amountBigInt = BigInt(Math.floor(amountFloat * 1e18)).toString();

    try {
        // ft_transfer_call 트랜잭션 생성 및 실행
        const result = await account.functionCall({
            contractId: tokenContract,
            methodName: "ft_transfer_call",
            args: {
                receiver_id: recipientId,
                amount: amountBigInt,
                msg: "", // 빈 메시지 (필요 시 추가 가능)
            },
            gas: BigInt("30000000000000"), // 30 TGas
            attachedDeposit: BigInt("1"), // 1 yoctoNEAR (ft_transfer_call은 deposit 필요)
        });

        return result.transaction.hash;
    } catch (error) {
        console.error("Failed to transfer CHOCO token:", error);
        throw error;
    }
}

/**
 * 사용자의 CHOCO 토큰 잔액 조회
 */
export async function getChocoBalance(
    accountId: string,
    tokenContract: string
): Promise<string> {
    if (typeof window === 'undefined') {
        throw new Error("getChocoBalance is client-side only");
    }

    const near = await initNearConnection();
    const account = await near.account(tokenContract);

    try {
        const balanceRaw: string = await account.viewFunction({
            contractId: tokenContract,
            methodName: "ft_balance_of",
            args: { account_id: accountId },
        });

        // 18 decimals 변환
        const balance = parseFloat(balanceRaw) / 1e18;
        return balance.toString();
    } catch (error) {
        console.error(`Failed to fetch CHOCO balance for ${accountId}:`, error);
        return "0";
    }
}

/**
 * 지갑 연결 확인
 */
export async function isWalletConnected(): Promise<boolean> {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        const nearApi = await getNearApiJs();
        const { WalletConnection } = nearApi;
        const near = await initNearConnection();
        const wallet = new WalletConnection(near, "choonsim");
        return wallet.isSignedIn();
    } catch (error) {
        return false;
    }
}

/**
 * 현재 연결된 계정 ID 가져오기
 */
export async function getCurrentAccountId(): Promise<string | null> {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const nearApi = await getNearApiJs();
        const { WalletConnection } = nearApi;
        const near = await initNearConnection();
        const wallet = new WalletConnection(near, "choonsim");

        if (wallet.isSignedIn()) {
            return wallet.getAccountId();
        }

        return null;
    } catch (error) {
        console.error("Failed to get account ID:", error);
        return null;
    }
}

/**
 * 지갑 연결 요청
 */
export async function requestWalletConnection(): Promise<string | null> {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const nearApi = await getNearApiJs();
        const { WalletConnection } = nearApi;
        const near = await initNearConnection();
        const wallet = new WalletConnection(near, "choonsim");

        if (wallet.isSignedIn()) {
            return wallet.getAccountId();
        }

        const tokenContract = import.meta.env.VITE_CHOCO_TOKEN_CONTRACT || "choco.token.primitives.testnet";
        await wallet.requestSignIn({
            contractId: tokenContract,
            methodNames: ["ft_transfer_call"],
        });

        return wallet.getAccountId();
    } catch (error) {
        console.error("Failed to connect wallet:", error);
        return null;
    }
}
/**
 * Meta Transaction(SignedDelegate) 생성 및 서명
 * @param accountId 사용자 NEAR 계정 ID
 * @param receiverId 수신자(컨트랙트) 계정 ID
 * @param actions 실행할 액션 목록
 * @returns base64 직렬화된 SignedDelegate
 */
export async function createSignedDelegate(
    accountId: string,
    receiverId: string,
    actions: any[]
): Promise<string> {
    if (typeof window === 'undefined') {
        throw new Error("createSignedDelegate is client-side only");
    }

    const nearApi = await getNearApiJs();
    const { transactions, utils } = nearApi;
    const near = await initNearConnection();
    const account = await near.account(accountId);

    // 블록 정보 및 Nonce 가져오기
    const accessKey = await account.findAccessKey(accountId, []);
    if (!accessKey) {
        throw new Error(`No access key found for ${accountId}`);
    }

    const block = await near.connection.provider.block({ finality: 'final' });
    const blockHash = utils.serialize.base_decode(block.header.hash);

    // DelegateAction 생성
    const delegateAction = transactions.createDelegateAction({
        senderId: accountId,
        receiverId: receiverId,
        actions: actions,
        nonce: BigInt(accessKey.accessKey.nonce) + BigInt(1),
        maxBlockHeight: BigInt(block.header.height) + BigInt(100), // 약 100블록 동안 유효
        publicKey: utils.PublicKey.from(accessKey.publicKey),
    });

    // 서명 수행
    const { signer } = near.connection;
    const { networkId } = getNearConfig();
    const signedDelegate = await transactions.signDelegateAction({
        delegateAction,
        signer,
        networkId,
    });

    // 직렬화하여 반환
    return Buffer.from(signedDelegate.encode()).toString("base64");
}

/**
 * CHOCO 토큰 전송 (Relayer 사용 - 가스비 0원)
 */
export async function transferChocoTokenGasless(
    accountId: string,
    recipientId: string,
    amount: string,
    tokenContract: string
): Promise<string> {
    const nearApi = await getNearApiJs();
    const { transactions } = nearApi;

    // 18 decimals 변환
    const amountFloat = parseFloat(amount);
    const amountBigInt = BigInt(Math.floor(amountFloat * 1e18)).toString();

    // ft_transfer_call 액션 정의
    const action = transactions.functionCall(
        "ft_transfer_call",
        {
            receiver_id: recipientId,
            amount: amountBigInt,
            msg: "",
        },
        BigInt("30000000000000"), // 30 TGas
        BigInt("1") // 1 yoctoNEAR
    );

    // SignedDelegate 생성
    const signedDelegate = await createSignedDelegate(accountId, tokenContract, [action]);

    // Relayer API 호출
    const response = await fetch("/api/relayer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedDelegate }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || "Failed to relay transaction");
    }

    return result.txHash;
}
