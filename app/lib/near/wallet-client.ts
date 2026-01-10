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
        
        // requestSignIn은 리다이렉트를 발생시킬 수 있으므로, 여기서는 null 반환
        // 실제로는 리다이렉트 후 콜백에서 계정 ID를 가져와야 함
        return null;
    } catch (error) {
        console.error("Failed to connect wallet:", error);
        return null;
    }
}
