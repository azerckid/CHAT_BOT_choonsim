
import type { FinalExecutionOutcome } from "near-api-js/lib/providers";
import * as nearTransactions from "@near-js/transactions";
import { KeyType } from "@near-js/crypto";
import { getNearConnection, NEAR_CONFIG } from "./client.server";

/**
 * 트랜잭션 내역을 파싱하여 실제 토큰 전송 여부를 확인합니다.
 */
export async function verifyTokenTransfer(
    txHash: string,
    recipientAccountId: string
): Promise<{
    from: string;
    to: string;
    amount: string;
    isValid: boolean;
}> {
    const near = await getNearConnection();
    const tokenContract = NEAR_CONFIG.chocoTokenContract;

    try {
        const accountCandidates = ["rogulus.testnet", recipientAccountId, tokenContract];
        let txStatus: any = null;
        let lastError: any = null;

        // 인덱싱 대기를 위해 최대 10번 시도 (총 10초)
        for (let i = 0; i < 10; i++) {
            for (const accountId of accountCandidates) {
                try {
                    txStatus = await near.connection.provider.txStatus(txHash, accountId, "final" as any);
                    if (txStatus) break;
                } catch (err: any) {
                    lastError = err;
                }
            }
            if (txStatus) break;
            console.log(`[Verify] Waiting for indexer... (${i + 1}/10)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!txStatus) throw new Error(`Transaction ${txHash} not found: ${lastError?.message}`);

        const status = (txStatus.status as any);
        const isSuccess = status.SuccessValue !== undefined || status.SuccessReceiptId !== undefined;

        if (!isSuccess) throw new Error("Transaction failed on-chain");

        const receipts = txStatus.receipts_outcome || [];
        let transferInfo: { from: string; to: string; amount: string } | null = null;

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

/**
 * [Gasless] 사용자의 서명만으로 CHOCO를 전송하되, 가스비는 서비스 계정이 지불합니다.
 */
export async function sendGaslessChocoToken(
    userAccountId: string,
    userPrivateKey: string,
    toAccountId: string,
    amountRaw: string,
    memo: string = "Gasless Transfer"
) {
    const { KeyPair } = await import("near-api-js");
    const near = await getNearConnection();
    const networkId = NEAR_CONFIG.networkId;
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;

    const userKeyPair = KeyPair.fromString(userPrivateKey as any);
    await near.connection.signer.keyStore.setKey(networkId, userAccountId, userKeyPair);

    const userAccount = await near.account(userAccountId);
    const serviceAccount = await near.account(serviceAccountId);

    const block = await near.connection.provider.block({ finality: "final" });
    const currentBlockHeight = block.header.height;

    const publicKey = userKeyPair.getPublicKey();
    const accessKeyRes = await near.connection.provider.query({
        request_type: "view_access_key",
        finality: "final",
        account_id: userAccountId,
        public_key: publicKey.toString(),
    }) as any;

    const currentNonce = BigInt(accessKeyRes.nonce);

    // 1. 내부 액션 생성 (ft_transfer)
    const innerAction = (nearTransactions as any).actionCreators.functionCall(
        "ft_transfer",
        { receiver_id: toAccountId, amount: amountRaw, memo },
        BigInt("30000000000000"),
        BigInt(1)
    );

    // 2. DelegateAction 객체 생성 (사용자 위임 정보)
    const delegateAction = new (nearTransactions as any).DelegateAction({
        actions: [innerAction],
        maxBlockHeight: BigInt(currentBlockHeight) + BigInt(100),
        nonce: currentNonce + BigInt(1),
        publicKey: publicKey,
        receiverId: NEAR_CONFIG.chocoTokenContract,
        senderId: userAccountId,
    });

    // 3. 사용자의 서명 생성
    const { signature } = await near.connection.signer.signMessage(
        (nearTransactions as any).encodeDelegateAction(delegateAction),
        userAccountId,
        networkId
    );

    // 4. SignedDelegate 객체 구성
    const signedDelegate = new (nearTransactions as any).SignedDelegate({
        delegateAction,
        signature: new (nearTransactions as any).Signature({
            keyType: KeyType.ED25519,
            data: signature,
        }),
    });

    // 5. 서비스 계정(Relayer)이 네트워크에 제출
    // NEAR v6 actionCreators에서는 'signedDelegate'가 이 타입을 처리하는 공식 명칭입니다.
    const result = await serviceAccount.signAndSendTransaction({
        receiverId: userAccountId,
        actions: [(nearTransactions as any).actionCreators.signedDelegate(signedDelegate)],
    });

    return result as any;
}

/**
 * 서비스 계정에서 특정 계정으로 CHOCO 토큰을 전송합니다.
 */
export async function sendChocoToken(toAccountId: string, amountRaw: string) {
    const { ensureStorageDeposit } = await import("./storage-deposit.server");
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

/**
 * 사용자 계정에서 서비스 계정으로 CHOCO 토큰을 전송합니다 (가스리스).
 * 사용자의 개인키를 사용하여 서명하고, 가스비는 서비스 계정이 지불합니다.
 */
export async function returnChocoToService(
    userAccountId: string,
    userPrivateKey: string,
    amountRaw: string,
    memo: string = "Choco Usage"
) {
    return await sendGaslessChocoToken(
        userAccountId,
        userPrivateKey,
        NEAR_CONFIG.serviceAccountId,
        amountRaw
    );
}
