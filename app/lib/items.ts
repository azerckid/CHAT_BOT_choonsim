export const ITEMS = {
    HEART: {
        id: "heart",
        name: "하트",
        type: "GIFT",
        iconUrl: "favorite", // Material Symbols icon name
        description: "아이돌에게 사랑을 전하는 가장 기본적인 방법입니다.",
    },
} as const;

export interface ItemPackage {
    id: string;
    itemId: string;
    name: string;
    quantity: number;
    priceKRW: number;
    priceUSD: number;
    description?: string;
    image?: string;
    isPopular?: boolean;
}

export const HEART_PACKAGES: ItemPackage[] = [
    {
        id: "heart_pack_1",
        itemId: "heart",
        name: "하트 작은 상자",
        quantity: 10,
        priceKRW: 1500,
        priceUSD: 1.2,
        description: "가볍게 마음을 전하기 좋아요.",
        image: "https://cdn-icons-png.flaticon.com/512/1077/1077035.png", // Heart icon
    },
    {
        id: "heart_pack_2",
        itemId: "heart",
        name: "하트 큰 상자",
        quantity: 50,
        priceKRW: 7000,
        priceUSD: 5.5,
        description: "듬뿍 담긴 하트로 응원해주세요!",
        image: "https://cdn-icons-png.flaticon.com/512/3128/3128313.png", // Multiple hearts
        isPopular: true,
    },
    {
        id: "heart_pack_3",
        itemId: "heart",
        name: "하트 보물상자",
        quantity: 100,
        priceKRW: 13000,
        priceUSD: 10.0,
        description: "당신은 최고의 팬입니다!",
        image: "https://cdn-icons-png.flaticon.com/512/2859/2859706.png", // Glowing heart
    },
];

export type ItemId = keyof typeof ITEMS;
