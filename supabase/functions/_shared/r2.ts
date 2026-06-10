// Cloudflare R2 / S3-compatible storage operations for Supabase Edge Functions
// Uses raw S3 REST API with AWS Signature V4 signing (Deno runtime)

const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT') || '';
const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') || '';
const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') || '';

/** AWS Signature V4 signing utility */
async function signV4(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: Uint8Array | null,
  accessKey: string,
  secretKey: string,
  region: string,
  service: string,
): Promise<Record<string, string>> {
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dateOnly = dateStamp.slice(0, 8);

  const signedHeaders: Record<string, string> = { ...headers };
  signedHeaders['host'] = url.host;
  signedHeaders['x-amz-date'] = dateStamp;
  signedHeaders['x-amz-content-sha256'] = body
    ? await sha256Hex(body)
    : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  // Sort and format signed headers
  const headerKeys = Object.keys(signedHeaders).map((k) => k.toLowerCase()).sort();
  const signedHeadersStr = headerKeys.join(';');
  const canonicalHeaders = headerKeys
    .map((k) => `${k}:${signedHeaders[k]?.trim()}`)
    .join('\n');

  const canonicalUri = url.pathname;
  const canonicalQuerystring = url.searchParams.toString();

  const payloadHash = body
    ? await sha256Hex(body)
    : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders + '\n',
    signedHeadersStr,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateStamp,
    credentialScope,
    await sha256Hex(new TextEncoder().encode(canonicalRequest)),
  ].join('\n');

  const signingKey = await getSignatureKey(secretKey, dateOnly, region, service);
  const signature = await hmacHex(signingKey, new TextEncoder().encode(stringToSign));

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

  return {
    ...signedHeaders,
    'Authorization': authHeader,
  };
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(key: Uint8Array, data: Uint8Array): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), data);
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const kDate = await hmacSign(encoder.encode('AWS4' + key), encoder.encode(dateStamp));
  const kRegion = await hmacSign(kDate, encoder.encode(region));
  const kService = await hmacSign(kRegion, encoder.encode(service));
  const kSigning = await hmacSign(kService, encoder.encode('aws4_request'));
  return kSigning;
}

async function hmacSign(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(sig);
}

/** Upload a file to R2 bucket */
export async function uploadToR2(
  bucket: string,
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  const url = new URL(`/${bucket}/${key}`, R2_ENDPOINT);

  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Length': body.length.toString(),
  };

  const signedHeaders = await signV4(
    'PUT',
    url,
    baseHeaders,
    body,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    'auto',
    's3',
  );

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: signedHeaders,
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed: ${res.status} ${text}`);
  }
}

/** Delete a file from R2 bucket */
export async function deleteFromR2(bucket: string, key: string): Promise<void> {
  const url = new URL(`/${bucket}/${key}`, R2_ENDPOINT);

  const baseHeaders: Record<string, string> = {};

  const signedHeaders = await signV4(
    'DELETE',
    url,
    baseHeaders,
    null,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    'auto',
    's3',
  );

  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: signedHeaders,
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`R2 delete failed: ${res.status} ${text}`);
  }
}

/** Check if an R2 bucket exists and is accessible */
export async function checkR2Bucket(bucket: string): Promise<boolean> {
  const url = new URL(`/${bucket}?location`, R2_ENDPOINT);

  const baseHeaders: Record<string, string> = {};

  const signedHeaders = await signV4(
    'GET',
    url,
    baseHeaders,
    null,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    'auto',
    's3',
  );

  try {
    const res = await fetch(url.toString(), { method: 'GET', headers: signedHeaders });
    return res.ok;
  } catch {
    return false;
  }
}

/** Get the public URL for an R2 object */
export function getR2PublicUrl(bucket: string, key: string): string {
  return `${R2_ENDPOINT}/${bucket}/${key}`;
}

/** R2 bucket names from environment */
export function getR2Buckets() {
  return {
    VIDEOS: Deno.env.get('R2_BUCKET_VIDEOS') || 'dakkho-videos',
    THUMBNAILS: Deno.env.get('R2_BUCKET_THUMBNAILS') || 'dakkho-thumbnails',
    AVATARS: Deno.env.get('R2_BUCKET_AVATARS') || 'dakkho-avatars',
    RESOURCES: Deno.env.get('R2_BUCKET_RESOURCES') || 'dakkho-resources',
  };
}
