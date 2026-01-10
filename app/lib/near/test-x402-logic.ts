import { createX402Invoice, verifyX402Payment } from "./x402.server";
import { checkSilentPaymentAllowance, updateAllowance } from "./silent-payment.server";
import { db } from "../db.server";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * X402 핵심 로직 검증 스크립트
 * 이 스크립트는 DB 연동을 포함하여 인보이스 생성, 한도 체크, 결제 검증 흐름을 테스트합니다.
 */
async function runTest() {
    console.log("🚀 Starting X402 Logic Verification...");

    // 테스트용 임시 유저 생성 (이미 있으면 사용)
    const testUserId = "test-user-x402-" + nanoid(5);
    await db.insert(schema.user).values({
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        credits: 5, // 부족한 상태로 시작
        chocoBalance: "0",
        updatedAt: new Date(),
    });
    console.log(`✅ Test User Created: ${testUserId}`);

    try {
        // 1. 인보이스 생성 테스트
        console.log("\n1. Testing Invoice Creation...");
        const amountUSD = 0.5;
        const { token, invoice } = await createX402Invoice(testUserId, amountUSD);

        if (token && invoice.amount === "5000") { // $0.5 / 0.0001 = 5000 CHOCO
            console.log("✅ Invoice created successfully with correct amount.");
        } else {
            throw new Error("Invoice creation failed or amount mismatch.");
        }

        // 2. Silent Payment Allowance 테스트
        console.log("\n2. Testing Silent Payment Allowance...");
        const initialCheck = await checkSilentPaymentAllowance(testUserId, 0.1);
        console.log("Initial Check (No allowance):", initialCheck.canAutoPay ? "FAILED" : "SUCCESS (Expected)");

        await updateAllowance(testUserId, 1.0, 1); // $1.0 한도 설정
        const afterUpdateCheck = await checkSilentPaymentAllowance(testUserId, 0.1);
        console.log("After Update Check ($0.1 request):", afterUpdateCheck.canAutoPay ? "SUCCESS (Expected)" : "FAILED");

        // 3. 결제 검증 시뮬레이션
        // (주의: verifyX402Payment는 실제 온체인 조회를 시도하므로, 
        //  로직 검증을 위해 verifyTokenTransfer를 모킹하거나 실제 Tx Hash가 필요함.
        //  여기서는 DB 상태 변화 위주로 수동 확인 권장)
        console.log("\n3. Testing Payment Verification (Manual/Mock required for chain data)...");
        console.log("Hint: verifyX402Payment will call verifyTokenTransfer(txHash).");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        // 청소 (선택사항)
        // await db.delete(schema.user).where(eq(schema.user.id, testUserId));
        console.log("\n🧹 Verification Script Finished.");
    }
}

// ESM 환경에서 파일 직접 실행 여부 확인
import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runTest().catch(console.error);
}
