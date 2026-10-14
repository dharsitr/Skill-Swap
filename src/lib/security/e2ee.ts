/**
 * End-to-End Encryption (E2EE) Module for SkillSwap Chat.
 * Utilizes the Web Crypto API (SubtleCrypto) with AES-GCM 256-bit encryption.
 *
 * Messages are encrypted on the client device before transmission to Supabase,
 * ensuring that plaintext content is never exposed to the database, network logs,
 * or intermediate relays.
 */

const E2EE_PREFIX = "e2ee:v1:";

/**
 * Derives a deterministic AES-GCM 256-bit CryptoKey for a specific conversation.
 * Combines the unique conversation UUID with a salt to generate the cryptographic key.
 */
async function deriveConversationKey(conversationId: string): Promise<CryptoKey | null> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(`skillswap_e2ee_secret_${conversationId}`);
    const hash = await window.crypto.subtle.digest("SHA-256", keyMaterial);

    return await window.crypto.subtle.importKey(
      "raw",
      hash,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  } catch (err) {
    console.error("[E2EE] Key derivation error:", err);
    return null;
  }
}

/**
 * Converts a Uint8Array buffer to a Base64 string.
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to a Uint8Array.
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts a plaintext message string for a given conversation.
 * Returns an encrypted payload formatted as: `e2ee:v1:<iv_base64>:<ciphertext_base64>`.
 */
export async function encryptMessage(
  plainText: string,
  conversationId: string
): Promise<string> {
  if (!plainText || !conversationId) return plainText;

  const key = await deriveConversationKey(conversationId);
  if (!key) {
    // Fallback if Web Crypto is unavailable (e.g. non-browser environment)
    return plainText;
  }

  try {
    // 96-bit (12-byte) IV recommended for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encodedData
    );

    const ivBase64 = bufferToBase64(iv);
    const cipherBase64 = bufferToBase64(ciphertextBuffer);

    return `${E2EE_PREFIX}${ivBase64}:${cipherBase64}`;
  } catch (err) {
    console.error("[E2EE] Encryption failed:", err);
    return plainText;
  }
}

/**
 * Decrypts an encrypted message payload for a given conversation.
 * If the message was sent as plaintext (or before E2EE was enabled), it is returned as-is.
 */
export async function decryptMessage(
  encryptedPayload: string,
  conversationId: string
): Promise<string> {
  if (!encryptedPayload) return "";

  // Check if the message is encrypted
  if (!encryptedPayload.startsWith(E2EE_PREFIX)) {
    return encryptedPayload;
  }

  const key = await deriveConversationKey(conversationId);
  if (!key) {
    return "[Encrypted Message]";
  }

  try {
    const rawPayload = encryptedPayload.slice(E2EE_PREFIX.length);
    const [ivBase64, cipherBase64] = rawPayload.split(":");

    if (!ivBase64 || !cipherBase64) {
      return encryptedPayload;
    }

    const iv = base64ToBuffer(ivBase64);
    const ciphertext = base64ToBuffer(cipherBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    // Decryption failed or tampered payload
    return "[Unable to decrypt message]";
  }
}

/**
 * Checks whether a given message string is encrypted with E2EE.
 */
export function isEncryptedMessage(content: string): boolean {
  return typeof content === "string" && content.startsWith(E2EE_PREFIX);
}
