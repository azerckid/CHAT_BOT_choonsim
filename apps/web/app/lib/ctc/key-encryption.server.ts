/**
 * EVM 개인키 암호화 및 복호화 유틸리티
 * (이전 구현에서 이동, ENCRYPTION_KEY 환경변수 사용)
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("ENCRYPTION_KEY environment variable is required in production");
        }
        return Buffer.alloc(32, "dev-secret-key-32-chars-long-!!!");
    }
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
 * @param encryptedText 'iv:authTag:encryptedContent' 형식
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== "string") {
        throw new Error("Encrypted text is required and must be a string");
    }

    const parts = encryptedText.split(":");

    if (parts.length !== 3) {
        throw new Error(
            `Invalid encrypted text format. Expected 'iv:authTag:encryptedContent', got ${parts.length} parts.`
        );
    }

    const [ivHex, authTagHex, encryptedContent] = parts;

    if (!ivHex || !authTagHex || !encryptedContent) {
        throw new Error("Invalid encrypted text format: missing required components.");
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
            throw new Error("Decryption failed: encryption key may have changed or data is corrupted.");
        }
        throw new Error(`Decryption failed: ${error.message || error}`);
    }
}
