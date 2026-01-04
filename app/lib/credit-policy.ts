
/**
 * AI 모델별 크레딧 차감 정책 및 계산 로직
 * PRICING_AND_MARGIN_ANALYSIS.md 기준
 */

import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "./subscription-plans";

// 1 Credit = $0.0001 (approx. 0.1 KRW)

export const MODEL_CREDIT_COSTS: Record<string, number> = {
    // Low Cost Models (1 KRW/msg)
    "gemini-2.0-flash-exp": 10,
    "gemini-1.5-flash": 10,

    // Medium Cost Models (5 KRW/msg)
    "gemini-1.5-pro": 50,

    // High Cost Models (50 KRW/msg)
    "gpt-4o": 500,
    "claude-3-5-sonnet": 500,

    // Image Generation (60 KRW/img)
    "dall-e-3": 600,
    "stable-diffusion": 600, // 예시
};

export const FEATURE_CREDIT_COSTS = {
    SEARCH_WEB: 20, // 웹 검색 추가 비용
    MEMORY_ACCESS: 5, // 장기 기억 조회 비용
} as const;

/**
 * 사용자 등급에 따라 해당 모델을 사용할 수 있는지 확인합니다.
 * @param tier 사용자 등급 (FREE, BASIC, PREMIUM, ULTIMATE)
 * @param modelId 사용할 AI 모델 ID
 * @returns 사용 가능 여부
 */
export function canUseModel(tier: string, modelId: string): boolean {
    // ULTIMATE & PREMIUM can use ALL models
    if (tier === "ULTIMATE" || tier === "PREMIUM") return true;

    // BASIC & FREE can only use Flash models
    const allowedModels = ["gemini-2.0-flash-exp", "gemini-1.5-flash"];
    return allowedModels.includes(modelId);
}

/**
 * AI 응답 생성에 필요한 예상 크레딧 비용을 계산합니다.
 * @param modelId 모델 ID
 * @param inputTokens 입력 토큰 수 (예상)
 * @param outputTokens 출력 토큰 수 (예상) - 단순 과금 모델에서는 무시될 수 있음
 * @returns 차감할 크레딧
 */
export function calculateCreditCost(modelId: string, features: string[] = []): number {
    let cost = MODEL_CREDIT_COSTS[modelId] || 50; // 기본값: 50 (Pro급)

    // 기능별 추가 비용
    if (features.includes("search")) {
        cost += FEATURE_CREDIT_COSTS.SEARCH_WEB;
    }

    // TODO: 토큰 단위 정밀 과금 필요 시 여기에 로직 추가
    // 예: cost += (inputTokens * 0.01) + (outputTokens * 0.03)

    return cost;
}

/**
 * 다음 정기 결제 시 리필될 크레딧 양을 반환합니다.
 */
export function getMonthlyCredits(tier: string): number {
    const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
    return plan ? plan.creditsPerMonth : 0;
}
