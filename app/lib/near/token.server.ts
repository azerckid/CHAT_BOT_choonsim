import { getNearConnection, NEAR_CONFIG } from "./client.server";
import { BigNumber } from "bignumber.js";

/**
 * 특정 계정의 CHOCO 토큰 잔액을 조회합니다.
 * @param accountId NEAR 계정 ID
 * @returns CHOCO 잔액 (인간이 읽을 수 있는 단위, decimals 18 적용)
 */
export async function getChocoBalance(accountId: string): Promise<string> {
    const near = await getNearConnection();
    const account = await near.account(NEAR_CONFIG.chocoTokenContract);

    try {
        const balanceRaw: string = await account.viewFunction({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "ft_balance_of",
            args: { account_id: accountId },
        });

        // 18 decimals 변환
        const balance = new BigNumber(balanceRaw).dividedBy(new BigNumber(10).pow(18));
        return balance.toString();
    } catch (error) {
        console.error(`Failed to fetch CHOCO balance for ${accountId}:`, error);
        return "0";
    }
}

/**
 * CHOCO 토큰의 메타데이터를 조회합니다.
 */
export async function getChocoMetadata() {
    const near = await getNearConnection();
    const account = await near.account(NEAR_CONFIG.chocoTokenContract);

    try {
        return await account.viewFunction({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "ft_metadata",
            args: {},
        });
    } catch (error) {
        console.error("Failed to fetch CHOCO metadata:", error);
        return null;
    }
}

/**
 * 트랜잭션 해시로부터 CHOCO 토큰 전송 정보를 검증하고 파싱합니다.
 * @param txHash NEAR 트랜잭션 해시
 * @param recipientAccountId 수신 계정 ID (검증용)
 * @returns 전송 정보 (from, to, amount)
 */
export async function verifyTokenTransfer(
    txHash: string,
    recipientAccountId: string
): Promise<{
    from: string;
    to: string;
    amount: string; // Raw amount (18 decimals)
    isValid: boolean;
}> {
    const near = await getNearConnection();
    const tokenContract = NEAR_CONFIG.chocoTokenContract;

    try {
        // 트랜잭션 상태 조회
        const txStatus = await near.connection.provider.txStatus(
            txHash,
            recipientAccountId,
            "final"
        );

        // 트랜잭션 성공 여부 확인
        const isSuccess = (txStatus.status as any).SuccessValue !== undefined;
        if (!isSuccess) {
            throw new Error("Transaction failed on-chain");
        }

        // receipts_outcome에서 ft_transfer 이벤트 파싱
        const receipts = txStatus.receipts_outcome || [];
        let transferInfo: { from: string; to: string; amount: string } | null = null;

        for (const receipt of receipts) {
            const outcome = receipt.outcome;
            const logs = outcome.logs || [];

            // 로그에서 ft_transfer 이벤트 찾기
            for (const log of logs) {
                try {
                    // NEAR의 FT 이벤트는 JSON 형식으로 로그에 기록됨
                    // 형식: "EVENT_JSON:{\"standard\":\"nep141\",\"event\":\"ft_transfer\",\"data\":[...]}"
                    if (log.includes("EVENT_JSON")) {
                        const jsonMatch = log.match(/EVENT_JSON:(.+)/);
                        if (jsonMatch) {
                            const eventData = JSON.parse(jsonMatch[1]);

                            if (
                                eventData.standard === "nep141" &&
                                eventData.event === "ft_transfer" &&
                                Array.isArray(eventData.data)
                            ) {
                                // CHOCO 토큰 컨트랙트로의 전송인지 확인
                                for (const transfer of eventData.data) {
                                    if (
                                        transfer.old_owner_id &&
                                        transfer.new_owner_id === recipientAccountId &&
                                        transfer.amount
                                    ) {
                                        transferInfo = {
                                            from: transfer.old_owner_id,
                                            to: transfer.new_owner_id,
                                            amount: transfer.amount,
                                        };
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (parseError) {
                    // 로그 파싱 실패 시 무시하고 계속 진행
                    continue;
                }
            }

            // receipt의 receiver_id가 CHOCO 토큰 컨트랙트인지 확인
            if (receipt.receiver_id === tokenContract) {
                // function_call 액션에서 ft_transfer 또는 ft_transfer_call 확인
                const actions = receipt.receipt?.Action?.actions || [];
                for (const action of actions) {
                    if (action.FunctionCall) {
                        const methodName = action.FunctionCall.method_name;
                        if (
                            (methodName === "ft_transfer" || methodName === "ft_transfer_call") &&
                            action.FunctionCall.args
                        ) {
                            try {
                                const args = JSON.parse(
                                    Buffer.from(action.FunctionCall.args, "base64").toString()
                                );
                                if (args.receiver_id === recipientAccountId && args.amount) {
                                    // sender_id는 트랜잭션의 signer_id 또는 predecessor_id에서 가져옴
                                    const senderId =
                                        receipt.receipt?.predecessor_id ||
                                        txStatus.transaction.signer_id;

                                    transferInfo = {
                                        from: senderId,
                                        to: args.receiver_id,
                                        amount: args.amount,
                                    };
                                    break;
                                }
                            } catch (argsError) {
                                continue;
                            }
                        }
                    }
                }
            }
        }

        if (!transferInfo) {
            throw new Error("No valid CHOCO token transfer found in transaction");
        }

        return {
            ...transferInfo,
            isValid: true,
        };
    } catch (error) {
        console.error(`Failed to verify token transfer for txHash ${txHash}:`, error);
        return {
            from: "",
            to: "",
            amount: "0",
            isValid: false,
        };
    }
}

/**
 * 서비스 계정에서 특정 계정으로 CHOCO 토큰을 전송합니다.
 * @param toAccountId 수신 계정 ID
 * @param amountRaw 전송량 (Raw units, 18 decimals)
 */
export async function sendChocoToken(toAccountId: string, amountRaw: string) {
    const { KeyPair } = await import("near-api-js");
    const { ensureStorageDeposit } = await import("./storage-deposit.server");

    // 1. 수신 계정의 Storage Deposit 확인 및 처리
    await ensureStorageDeposit(toAccountId);

    const near = await getNearConnection();
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;

    if (!servicePrivateKey) {
        throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing in environment variables");
    }

    // 서비스 계정의 키 설정
    const keyPair = KeyPair.fromString(servicePrivateKey as any);
    await near.connection.signer.keyStore.setKey(NEAR_CONFIG.networkId, serviceAccountId, keyPair);

    const account = await near.account(serviceAccountId);

    console.log(`[Token] Sending ${amountRaw} CHOCO to ${toAccountId}...`);

    const result = await account.functionCall({
        contractId: NEAR_CONFIG.chocoTokenContract,
        methodName: "ft_transfer",
        args: {
            receiver_id: toAccountId,
            amount: amountRaw,
            memo: "CHOCO Swap from NEAR Deposit"
        },
        gas: BigInt("30000000000000"),
        attachedDeposit: BigInt(1) // 1 yoctoNEAR required by nep-141 for security
    });

    return result;
}
