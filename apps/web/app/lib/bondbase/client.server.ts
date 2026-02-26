const BONDBASE_API_URL = process.env.BONDBASE_API_URL;
const CHOONSIM_API_KEY = process.env.CHOONSIM_API_KEY;

/**
 * BondBase에 캐릭터별 REVENUE 이벤트를 전송합니다.
 * HTTP 오류(4xx/5xx) 시 throw → 호출부(Cron)에서 catch하여 isSynced 업데이트를 건너뜁니다.
 *
 * @param bondId     BondBase 온체인 bondId (Character.bondBaseId)
 * @param amountUsdc USDC 금액 문자열 (소수점 포함 가능, e.g. "0.25")
 * @param description 설명 (e.g. "chunsim CHOCO consumption 2026-02-26")
 */
export async function sendRevenue(
    bondId: number,
    amountUsdc: string,
    description: string,
): Promise<void> {
    if (!BONDBASE_API_URL || !CHOONSIM_API_KEY) {
        console.warn("[BondBase] 환경변수 미설정. 전송 건너뜀.");
        return;
    }

    const response = await fetch(BONDBASE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${CHOONSIM_API_KEY}`,
        },
        body: JSON.stringify({
            bondId,
            type: "REVENUE",
            // TODO: BondBase 팀에 data.source 허용 값 확인 필요
            data: { amount: amountUsdc, source: "SUBSCRIPTION", description },
        }),
    });

    if (!response.ok) {
        throw new Error(`BondBase REVENUE API error: ${response.status} ${response.statusText}`);
    }
}

/**
 * BondBase에 캐릭터별 METRICS 이벤트를 전송합니다.
 * HTTP 오류(4xx/5xx) 시 throw → 호출부(Cron)에서 catch하여 로그만 기록합니다.
 *
 * @param bondId      BondBase 온체인 bondId
 * @param followers   팔로워 수 (전체 가입 유저 수로 대용)
 * @param subscribers 구독자 수 (subscriptionStatus="ACTIVE" 유저 수)
 */
export async function sendMetrics(
    bondId: number,
    followers: number,
    subscribers: number,
): Promise<void> {
    if (!BONDBASE_API_URL || !CHOONSIM_API_KEY) {
        console.warn("[BondBase] 환경변수 미설정. 전송 건너뜀.");
        return;
    }

    const response = await fetch(BONDBASE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${CHOONSIM_API_KEY}`,
        },
        body: JSON.stringify({
            bondId,
            type: "METRICS",
            data: { followers, subscribers },
        }),
    });

    if (!response.ok) {
        throw new Error(`BondBase METRICS API error: ${response.status} ${response.statusText}`);
    }
}
