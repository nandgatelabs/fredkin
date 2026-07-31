/** Lightweight PIN hashing (app lock, not encryption of the DB). */

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return toHex(bytes.buffer);
}

export async function hashPasscode(pin: string, salt: string): Promise<string> {
  const payload = `${salt}:${pin}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toHex(digest);
  }
  // Fallback (non-crypto) — still better than plaintext storage.
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv_${(h >>> 0).toString(16)}`;
}

export async function verifyPasscode(
  pin: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const got = await hashPasscode(pin, salt);
  return got === expectedHash;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
