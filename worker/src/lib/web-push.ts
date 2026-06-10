/**
 * VAPID-based Web Push Library for Cloudflare Workers
 *
 * Implements:
 *   - RFC 8291: Message Encryption for Web Push
 *   - RFC 8292: Voluntary Application Server Identification (VAPID)
 *
 * Pure Web Crypto API — zero Node.js dependencies.
 */

// ================================================================
// Base64url Encoding / Decoding
// ================================================================

function base64urlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): ArrayBuffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (base64.length % 4)) % 4;
  if (pad > 0) base64 += '='.repeat(pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ================================================================
// Crypto Primitives (HMAC, HKDF)
// ================================================================

async function hmacSHA256(key: ArrayBuffer, data: ArrayBuffer): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, data);
}

/** HKDF-Extract per RFC 5869: PRK = HMAC-Hash(salt, IKM) */
async function hkdfExtract(salt: ArrayBuffer, ikm: ArrayBuffer): Promise<ArrayBuffer> {
  return hmacSHA256(salt, ikm);
}

/** HKDF-Expand per RFC 5869 */
async function hkdfExpand(prk: ArrayBuffer, info: ArrayBuffer, length: number): Promise<ArrayBuffer> {
  const hashLen = 32; // SHA-256
  const n = Math.ceil(length / hashLen);
  const infoBytes = new Uint8Array(info);

  let okm = new Uint8Array(0);
  let t = new Uint8Array(0);

  for (let i = 1; i <= n; i++) {
    // T(i) = HMAC-Hash(PRK, T(i-1) || info || i)
    const data = new Uint8Array(t.length + infoBytes.length + 1);
    data.set(t, 0);
    data.set(infoBytes, t.length);
    data[t.length + infoBytes.length] = i;

    t = new Uint8Array(await hmacSHA256(prk, data.buffer));

    const newOkm = new Uint8Array(okm.length + t.length);
    newOkm.set(okm, 0);
    newOkm.set(t, okm.length);
    okm = newOkm;
  }

  return okm.slice(0, length).buffer;
}

// ================================================================
// ASN.1 / DER Helpers (for ECDSA signature conversion)
// ================================================================

/**
 * Convert a DER-encoded ECDSA signature to the raw r||s format
 * required by JWT (JWS) for ES256.
 *
 * DER:  0x30 <len> 0x02 <rLen> <r> 0x02 <sLen> <s>
 * Raw:  <r: 32 bytes> <s: 32 bytes>
 */
function derToRawSignature(derSig: ArrayBuffer): ArrayBuffer {
  const der = new Uint8Array(derSig);
  let idx = 2; // skip SEQUENCE tag (0x30) + 1-byte length

  // --- r INTEGER ---
  if (der[idx] !== 0x02) throw new Error('Invalid DER signature: missing r INTEGER tag');
  idx++;
  const rLen = der[idx++];
  const rDer = der.slice(idx, idx + rLen);
  idx += rLen;

  // --- s INTEGER ---
  if (der[idx] !== 0x02) throw new Error('Invalid DER signature: missing s INTEGER tag');
  idx++;
  const sLen = der[idx++];
  const sDer = der.slice(idx, idx + sLen);

  const r = derIntegerTo32Bytes(rDer);
  const s = derIntegerTo32Bytes(sDer);

  const raw = new Uint8Array(64);
  raw.set(r, 0);
  raw.set(s, 32);
  return raw.buffer;
}

/**
 * DER encodes integers with minimal bytes and a leading 0x00 when
 * the high bit is set (to indicate positive sign).  This function
 * strips any DER sign-padding and left-pads the value to exactly
 * 32 bytes (the P-256 field size).
 */
function derIntegerTo32Bytes(derInt: Uint8Array): Uint8Array {
  let value: Uint8Array;

  if (derInt.length > 1 && derInt[0] === 0x00) {
    // Strip the DER sign-padding byte
    value = derInt.slice(1);
  } else {
    value = derInt;
  }

  if (value.length > 32) {
    throw new Error(`DER integer too long (${value.length} bytes); expected ≤ 32`);
  }

  const result = new Uint8Array(32);
  result.set(value, 32 - value.length);
  return result;
}

// ================================================================
// Buffer Utilities
// ================================================================

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

function uint16BE(value: number): Uint8Array {
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff]);
}

function uint32BE(value: number): Uint8Array {
  return new Uint8Array([
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ]);
}

// ================================================================
// VAPID JWT Generation (RFC 8292)
// ================================================================

/**
 * Build and sign a VAPID JWT token.
 *
 * Header:  {"typ":"JWT","alg":"ES256"}
 * Payload: {"aud":"<origin>","exp":<now+43200>,"sub":"<subject>"}
 *
 * The private key must be a base64url-encoded PKCS8 DER EC P-256 key.
 */
async function generateVapidJwt(
  privateKey: string,
  audience: string,
  subject: string,
): Promise<string> {
  // JWT Header
  const header = base64urlEncode(
    new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })),
  );

  // JWT Payload — exp = now + 12 hours (43200 seconds)
  const payload = base64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 43200,
        sub: subject,
      }),
    ),
  );

  const signingInput = `${header}.${payload}`;

  // Import the PKCS8 private key for signing
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    base64urlDecode(privateKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  // Sign — crypto.subtle returns a DER-encoded signature
  const derSignature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  // Convert DER → raw r||s (64 bytes) for JWT
  const rawSignature = derToRawSignature(derSignature);

  return `${signingInput}.${base64urlEncode(rawSignature)}`;
}

// ================================================================
// RFC 8291 — Push Message Encryption
// ================================================================

/**
 * Encrypt a push message payload per RFC 8291 using aes128gcm.
 *
 * Steps:
 *  1. Generate ephemeral ECDH P-256 key pair
 *  2. IKM  = ECDH(ephemeral_priv, recipient_pub)
 *  3. PRK  = HKDF-Extract(salt=auth_key, IKM)
 *  4. CEK  = HKDF-Expand(PRK, key_info,  16)
 *  5. Nonce= HKDF-Expand(PRK, nonce_info, 12)
 *  6. Encrypt plaintext (= payload || 0x02) with AES-128-GCM
 *  7. Return: salt(16) || rs(4, 4096) || ephemeral_pub(65) || ciphertext
 *
 * @param payload  JSON string to encrypt
 * @param p256dh   Base64url-encoded uncompressed recipient public key (65 bytes)
 * @param auth     Base64url-encoded auth secret (16 bytes)
 */
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string,
): Promise<Uint8Array> {
  const recipientPub = new Uint8Array(base64urlDecode(p256dh));
  const authKey = new Uint8Array(base64urlDecode(auth));

  // 1. Generate ephemeral ECDH P-256 key pair
  const ephemeral = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // extractable — we need to export the public key
    ['deriveBits'],
  )) as CryptoKeyPair;

  // Import the recipient's public key
  const recipientCryptoKey = await crypto.subtle.importKey(
    'raw',
    recipientPub,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

  // 2. Derive shared secret via ECDH
  // Note: Cloudflare Workers types use "$public" instead of "public"
  // because "public" is a reserved word in JavaScript.
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', $public: recipientCryptoKey },
    ephemeral.privateKey,
    256, // 32 bytes
  );

  // Export ephemeral public key as raw uncompressed (65 bytes)
  const ephemeralPub = new Uint8Array(
    (await crypto.subtle.exportKey('raw', ephemeral.publicKey)) as ArrayBuffer,
  );

  // Generate 16-byte random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 3. PRK = HKDF-Extract(salt=auth_key, IKM=shared_secret)
  const prk = await hkdfExtract(authKey.buffer as ArrayBuffer, sharedSecret);

  // Build context per RFC 8291 §3.1:
  //   context = "P-256" || 0x00
  //            || length(recipientPub) [2 bytes BE]
  //            || recipientPub
  //            || length(ephemeralPub)  [2 bytes BE]
  //            || ephemeralPub
  const context = concat(
    new TextEncoder().encode('P-256'),
    new Uint8Array([0x00]),
    uint16BE(recipientPub.length),
    recipientPub,
    uint16BE(ephemeralPub.length),
    ephemeralPub,
  );

  // 4. key_info = "Content-Encoding: aes128gcm" || 0x00 || context
  const keyInfo = concat(
    new TextEncoder().encode('Content-Encoding: aes128gcm'),
    new Uint8Array([0x00]),
    context,
  );
  const cek = await hkdfExpand(prk, keyInfo.buffer as ArrayBuffer, 16);

  // 5. nonce_info = "Content-Encoding: nonce" || 0x00 || context
  const nonceInfo = concat(
    new TextEncoder().encode('Content-Encoding: nonce'),
    new Uint8Array([0x00]),
    context,
  );
  const nonce = await hkdfExpand(prk, nonceInfo.buffer as ArrayBuffer, 12);

  // 6. Plaintext = payload || 0x02  (padding delimiter per RFC 8291 §4)
  const payloadBytes = new TextEncoder().encode(payload);
  const plaintext = new Uint8Array(payloadBytes.length + 1);
  plaintext.set(payloadBytes, 0);
  plaintext[payloadBytes.length] = 0x02;

  // AES-128-GCM encryption
  const aesKey = await crypto.subtle.importKey(
    'raw',
    cek,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    aesKey,
    plaintext,
  );

  // 7. Construct the encrypted content:
  //    salt (16) || rs (4, big-endian 4096) || ephemeralPub (65) || ciphertext+tag
  return concat(
    salt,
    uint32BE(4096),
    ephemeralPub,
    new Uint8Array(ciphertext),
  );
}

// ================================================================
// Public API
// ================================================================

/**
 * Generate a new VAPID key pair (run once during setup, not at runtime).
 *
 * Returns:
 *   publicKey  — base64url-encoded uncompressed raw EC P-256 public key (65 bytes)
 *   privateKey — base64url-encoded PKCS8 DER EC P-256 private key
 */
export async function generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = (await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true, // extractable
    ['sign'],
  )) as CryptoKeyPair;

  const publicKey = base64urlEncode(
    (await crypto.subtle.exportKey('raw', keyPair.publicKey)) as ArrayBuffer,
  );
  const privateKey = base64urlEncode(
    (await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)) as ArrayBuffer,
  );

  return { publicKey, privateKey };
}

/**
 * Derive the uncompressed public key from a PKCS8 DER private key.
 *
 * This parses the PKCS8 structure synchronously (no crypto.subtle needed).
 * The ECPrivateKey inside PKCS8 includes the public key under the
 * context-specific [1] EXPLICIT tag (0xA1), which contains a BIT STRING
 * with the uncompressed point (0x04 || x || y).
 *
 * @param privateKey  Base64url-encoded PKCS8 DER private key
 * @returns           Base64url-encoded uncompressed public key (65 bytes)
 */
export function getUncompressedPublicKey(privateKey: string): string {
  const der = new Uint8Array(base64urlDecode(privateKey));

  // Walk the DER looking for the [1] EXPLICIT tag (0xA1) that wraps the
  // public-key BIT STRING.  For a standard Web Crypto PKCS8 export of an
  // EC P-256 key the layout ends with:
  //
  //   A1 <len>        — [1] EXPLICIT
  //     03 42         — BIT STRING, length 66
  //       00          — 0 unused bits
  //       04          — uncompressed point marker
  //       <x: 32B>    — x-coordinate
  //       <y: 32B>    — y-coordinate
  //
  // Total suffix: 1 + 1 + 1 + 1 + 1 + 1 + 64 = 70 bytes
  // The 0xA1 tag sits at der.length - 70 (with single-byte lengths).

  for (let i = der.length - 1; i >= 0; i--) {
    if (der[i] !== 0xA1) continue;

    let idx = i + 2; // skip 0xA1 tag + 1-byte length

    // BIT STRING tag (0x03)
    if (der[idx] !== 0x03) continue;
    idx += 2; // skip tag + 1-byte length

    // Unused-bits byte must be 0x00
    if (der[idx] !== 0x00) continue;
    idx += 1;

    // Uncompressed point marker
    if (der[idx] !== 0x04) continue;

    // Extract the full 65-byte uncompressed point (0x04 || x || y)
    if (idx + 65 > der.length) continue;

    return base64urlEncode(der.slice(idx, idx + 65));
  }

  throw new Error('Could not extract public key from PKCS8 DER — [1] EXPLICIT tag not found');
}

/**
 * Send a Web Push message to a Push Subscription endpoint.
 *
 * @param env          Environment with VAPID credentials
 * @param subscription Browser PushSubscription-like object
 * @param payload      JSON-serializable object to send
 * @param options      Optional TTL and urgency headers
 */
export async function sendWebPush(
  env: {
    VAPID_PRIVATE_KEY: string;
    VAPID_PUBLIC_KEY: string;
    VAPID_SUBJECT: string;
  },
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  payload: Record<string, unknown>,
  options?: {
    ttl?: number;
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
  },
): Promise<{ success: boolean; status: number; error?: string }> {
  try {
    // Audience = origin of the push endpoint (e.g. "https://fcm.googleapis.com")
    const audience = new URL(subscription.endpoint).origin;

    // Generate VAPID JWT
    const jwt = await generateVapidJwt(env.VAPID_PRIVATE_KEY, audience, env.VAPID_SUBJECT);

    // Encrypt payload per RFC 8291
    const encrypted = await encryptPayload(
      JSON.stringify(payload),
      subscription.keys.p256dh,
      subscription.keys.auth,
    );

    // POST to the push subscription endpoint
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: String(options?.ttl ?? 2419200),
        Urgency: options?.urgency ?? 'normal',
      },
      body: encrypted.buffer as ArrayBuffer,
    });

    return {
      success: response.ok,
      status: response.status,
      ...(response.ok ? {} : { error: `Push service returned ${response.status}` }),
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
