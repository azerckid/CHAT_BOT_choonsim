/**
 * PII (개인식별정보) 필터
 *
 * memory 저장 전 민감 정보 마스킹 또는 제외 (명세 7.2)
 * Phase 8에서 LLM 2차 검토 등 확장 예정
 */

const MASK = "***";

/** 카드번호 (4-4-4-4 또는 4-6-5 등) */
const CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

/** 주민등록번호 (6-7 또는 6-1,7) */
const SSN_PATTERN = /\b\d{6}[\s-]?[1-4]\d{6}\b/g;

/** 전화번호 (010-1234-5678, 02-123-4567 등) */
const PHONE_PATTERN = /\b(010|011|016|017|018|019|02|031|032|033|041|042|043|044|051|052|053|054|055|061|062|063|064)[\s-]?\d{3,4}[\s-]?\d{4}\b/g;

/** 계좌번호 (숫자 10~14자리, 공백/하이픈 포함) - 보수적으로 숫자만 긴 연속 */
const ACCOUNT_PATTERN = /\b\d{10,14}\b/g;

/** 비밀번호 패턴은 문맥 의존적이므로 단순 키워드만 (실제 비밀번호 값은 저장하지 않음) */
const PASSWORD_KEYWORD = /(?:비밀번호|password|passwd)\s*[:=]\s*\S+/gi;

/**
 * 텍스트 내 PII를 마스킹한 문자열 반환
 * 탐지된 부분은 ***-****-**** 형태 또는 *** 로 치환
 */
export function maskPii(text: string): string {
    if (!text || typeof text !== "string") return text;

    let out = text
        .replace(CARD_PATTERN, () => `${MASK}-${MASK}-${MASK}-${MASK}`)
        .replace(SSN_PATTERN, () => `${MASK}-${MASK}`)
        .replace(PHONE_PATTERN, () => `${MASK}-${MASK}-${MASK}`)
        .replace(ACCOUNT_PATTERN, (m) => (m.length > 8 ? MASK + m.slice(-4) : MASK))
        .replace(PASSWORD_KEYWORD, (m) => m.replace(/\S+$/, MASK));

    return out;
}

/**
 * PII가 포함된 것으로 판단되면 true
 * memory 저장 전 저장 제외 여부 판단용
 */
export function containsPii(text: string): boolean {
    if (!text || typeof text !== "string") return false;
    return (
        text.match(CARD_PATTERN) !== null ||
        text.match(SSN_PATTERN) !== null ||
        text.match(PHONE_PATTERN) !== null ||
        text.match(PASSWORD_KEYWORD) !== null
    );
}

/**
 * memory 저장용: PII 포함 시 마스킹된 문장 반환, 극단적일 경우 null (저장 제외)
 */
export function sanitizeForMemory(text: string): string | null {
    if (!text?.trim()) return null;
    const trimmed = text.trim();
    if (containsPii(trimmed)) {
        const masked = maskPii(trimmed);
        return masked.length > 0 ? masked : null;
    }
    return trimmed;
}
