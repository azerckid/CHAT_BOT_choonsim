/**
 * User Context - 프롬프트 주입용 압축
 *
 * 토큰 예산 내에서 계층별 내용을 문자열로 반환 (명세 12.1)
 */

import { getMemoryItems, getFullContextData } from "./db";
import { MEMORY_PROMPT_MAX_TOKENS, MEMORY_PROMPT_MAX_ITEMS } from "./constants";
import { formatHeartbeatForPrompt } from "./heartbeat";

/** 한글/영문 대략 1토큰 ≈ 2글자로 간이 계산 */
const CHARS_PER_TOKEN = 2;

/**
 * memory 계층을 프롬프트에 넣을 문자열로 압축
 * 최근/중요 순 5~10개, 약 500 토큰 이내
 */
export async function compressMemoryForPrompt(
    userId: string,
    characterId: string,
    maxTokens: number = MEMORY_PROMPT_MAX_TOKENS
): Promise<string> {
    const items = await getMemoryItems(userId, characterId, {
        limit: MEMORY_PROMPT_MAX_ITEMS,
        includeArchived: false,
    });
    if (items.length === 0) return "";

    const maxChars = maxTokens * CHARS_PER_TOKEN;
    const lines: string[] = [];
    let totalChars = 0;
    const prefix = "이전에 알아둔 것: ";

    for (const item of items) {
        const line = `- ${item.content}`;
        if (totalChars + line.length + 2 > maxChars) break;
        lines.push(line);
        totalChars += line.length + 2;
    }

    if (lines.length === 0) return "";
    return prefix + lines.join("\n");
}

/**
 * Heartbeat 계층을 프롬프트용 문자열로 변환
 */
export async function compressHeartbeatForPrompt(
    userId: string,
    characterId: string
): Promise<string> {
    const context = await getFullContextData(userId, characterId);
    return formatHeartbeatForPrompt(context?.heartbeat || null);
}
