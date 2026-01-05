export const ITEMS = {
    HEART: {
        id: "heart",
        name: "하트",
        type: "GIFT",
        priceCredits: 100, // 100 크레딧 = 1 하트
        iconUrl: "favorite", // Material Symbols icon name
        description: "아이돌에게 사랑을 전하는 가장 기본적인 방법입니다.",
    },
} as const;

export type ItemId = keyof typeof ITEMS;
