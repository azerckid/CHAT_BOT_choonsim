import crypto from "crypto";

/**
 * NEAR 개인키 암호화 및 복호화를 위한 유틸리티
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM

/**
 * 암호화 키를 환경 변수에서 가져옵니다. 
 * 키가 없으면 보안을 위해 에러를 발생시킵니다.
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("ENCRYPTION_KEY environment variable is required in production");
        }
        // 개발 환경에서는 임시 키 제공 (실제 배포 전 반드시 설정 필요)
        return Buffer.alloc(32, "dev-secret-key-32-chars-long-!!!");
    }
    // 키는 32바이트(256비트)여야 함
    return crypto.scryptSync(key, "salt", 32);
}

/**
 * 텍스트를 암호화합니다.
 * @returns 'iv:authTag:encryptedContent' 형식의 문자열
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * 암호화된 텍스트를 복호화합니다.
 * @param encryptedText 암호화된 텍스트 (형식: 'iv:authTag:encryptedContent')
 * @throws {Error} 암호화 형식이 올바르지 않거나 복호화에 실패한 경우
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== "string") {
        throw new Error("Encrypted text is required and must be a string");
    }

    // 암호화 형식 검증: 'iv:authTag:encryptedContent' 형식이어야 함
    const parts = encryptedText.split(":");
    
    if (parts.length !== 3) {
        throw new Error(
            `Invalid encrypted text format. Expected format: 'iv:authTag:encryptedContent', ` +
            `but got ${parts.length} parts. This may indicate the private key was not encrypted properly.`
        );
    }

    const [ivHex, authTagHex, encryptedContent] = parts;

    if (!ivHex || !authTagHex || !encryptedContent) {
        throw new Error(
            "Invalid encrypted text format: missing required components. " +
            "Expected format: 'iv:authTag:encryptedContent'"
        );
    }

    try {
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedContent, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error: any) {
        if (error.message?.includes("bad decrypt") || error.message?.includes("Unsupported state")) {
            throw new Error(
                "Decryption failed: The encryption key may have changed or the data is corrupted. " +
                "Please contact support if this issue persists."
            );
        }
        throw new Error(`Decryption failed: ${error.message || error}`);
    }
}
