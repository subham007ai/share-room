/**
 * E2E Encryption via Web Crypto API (AES-GCM 256-bit)
 *
 * Key lives only in the URL fragment (#key=...) and in memory.
 * The fragment is never sent to the server — not even Supabase sees it.
 *
 * Flow:
 *   Host creates room → generateKey() → key embedded in share URL fragment
 *   Guest joins via link → key extracted from fragment → stored in memory
 *   All messages are encrypted before being sent to Supabase
 *   All messages are decrypted after being received from Supabase
 *
 * The stored ciphertext in the DB is base64-encoded: "<iv_b64>:<ciphertext_b64>"
 */

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;

/** Generate a fresh AES-GCM key and export it as a base64 URL-safe string */
export async function generateKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
        { name: ALGO, length: KEY_LENGTH },
        true,
        ['encrypt', 'decrypt']
    );
    const exported = await crypto.subtle.exportKey('raw', key);
    return bufToBase64url(exported);
}

/** Import a base64url-encoded key string into a CryptoKey */
export async function importKey(keyB64: string): Promise<CryptoKey> {
    const raw = base64urlToBuf(keyB64);
    return crypto.subtle.importKey('raw', raw, { name: ALGO }, false, ['encrypt', 'decrypt']);
}

/** Encrypt a plaintext string → "<iv_b64>:<ciphertext_b64>" */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);
    return `${bufToBase64url(iv)}:${bufToBase64url(ciphertext)}`;
}

/** Decrypt a "<iv_b64>:<ciphertext_b64>" string → plaintext */
export async function decrypt(cipherB64: string, key: CryptoKey): Promise<string> {
    const colonIdx = cipherB64.indexOf(':');
    if (colonIdx === -1) throw new Error('Invalid ciphertext format');
    const iv = base64urlToBuf(cipherB64.slice(0, colonIdx));
    const ciphertext = base64urlToBuf(cipherB64.slice(colonIdx + 1));
    const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv: new Uint8Array(iv) }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}

/** Check if a string looks like encrypted content (iv:ciphertext) */
export function isEncrypted(content: string): boolean {
    return /^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+=*$/.test(content) && content.includes(':') && content.length > 30;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function bufToBase64url(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let str = '';
    bytes.forEach(b => (str += String.fromCharCode(b)));
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlToBuf(b64: string): ArrayBuffer {
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/').padEnd(
        b64.length + ((4 - (b64.length % 4)) % 4), '='
    );
    const str = atob(padded);
    const buf = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
    return buf.buffer;
}
