import paypal from "@paypal/checkout-server-sdk";

// 환경 변수 확인
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const mode = process.env.PAYPAL_MODE || "sandbox";

if (!clientId || !clientSecret) {
    throw new Error("MISSING_PAYPAL_CREDENTIALS");
}

// PayPal 환경 설정
const environment =
    mode === "live"
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

// PayPal 클라이언트 생성
export const paypalClient = new paypal.core.PayPalHttpClient(environment);

// export types for convenience
export { paypal };
