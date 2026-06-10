/**
 * R2 native binding helper for Cloudflare Workers
 * Uses native R2Bucket bindings — NO AWS S3 SDK!
 */

import type { Env } from '../env';

// ─── Upload file to R2 ───

export async function uploadFile(
  bucket: R2Bucket,
  key: string,
  body: ReadableStream | ArrayBuffer | ArrayBufferView,
  contentType: string
): Promise<R2Object> {
  const result = await bucket.put(key, body, {
    httpMetadata: {
      contentType,
    },
  });
  return result;
}

// ─── Delete file from R2 ───

export async function deleteFile(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key);
}

// ─── Get file from R2 ───

export async function getFile(
  bucket: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

// ─── Get file metadata (HEAD) ───

export async function getFileInfo(
  bucket: R2Bucket,
  key: string
): Promise<R2Object | null> {
  return bucket.head(key);
}

// ─── List files in R2 bucket ───

export async function listFiles(
  bucket: R2Bucket,
  prefix?: string,
  limit?: number
): Promise<R2Objects> {
  return bucket.list({
    prefix,
    limit: limit || 100,
  });
}

// ─── Check if bucket is accessible ───

export async function checkBucket(
  bucket: R2Bucket
): Promise<boolean> {
  try {
    // Try listing with limit 1 — if bucket binding works, it's accessible
    const result = await bucket.list({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}

// ─── Get the right R2Bucket binding for a file type ───

export function getBucketForType(type: string, env: Env): R2Bucket {
  switch (type) {
    case 'videos':
    case 'video':
      return env.R2_VIDEOS;
    case 'thumbnails':
    case 'thumbnail':
    case 'images':
    case 'image':
      return env.R2_THUMBNAILS;
    case 'avatars':
    case 'avatar':
      return env.R2_AVATARS;
    case 'resources':
    case 'resource':
    case 'documents':
    case 'document':
      return env.R2_RESOURCES;
    case 'support-attachments':
    case 'support':
      return env.R2_SUPPORT_ATTACHMENTS;
    default:
      return env.R2_RESOURCES;
  }
}

// ─── Generate public URL for an R2 object ───
// Note: Workers R2 doesn't support presigned URLs natively.
// Use R2 public bucket dev URLs (pub-*.r2.dev) for public access.

// R2 public dev URLs — enabled via `wrangler r2 bucket dev-url enable <bucket>`
const R2_PUBLIC_URLS: Record<string, string> = {
  videos: 'https://pub-e746ac3cc9cc4c6ebbd8dd4365dbab79.r2.dev',
  video: 'https://pub-e746ac3cc9cc4c6ebbd8dd4365dbab79.r2.dev',
  thumbnails: 'https://pub-60fdec4931744de9a37d73191723e1f8.r2.dev',
  thumbnail: 'https://pub-60fdec4931744de9a37d73191723e1f8.r2.dev',
  images: 'https://pub-60fdec4931744de9a37d73191723e1f8.r2.dev',
  image: 'https://pub-60fdec4931744de9a37d73191723e1f8.r2.dev',
  avatars: 'https://pub-06c9b4a41d0b402d847fb9139262cb70.r2.dev',
  avatar: 'https://pub-06c9b4a41d0b402d847fb9139262cb70.r2.dev',
  resources: 'https://pub-25692986d3ff446abba05633a1d20a9a.r2.dev',
  resource: 'https://pub-25692986d3ff446abba05633a1d20a9a.r2.dev',
  documents: 'https://pub-25692986d3ff446abba05633a1d20a9a.r2.dev',
  document: 'https://pub-25692986d3ff446abba05633a1d20a9a.r2.dev',
};

export function getPublicUrl(env: Env, bucketType: string, key: string): string {
  // 1. If R2_PUBLIC_URL is set in env, use it (for custom domain override)
  const envAny = env as unknown as Record<string, unknown>;
  const publicUrl = envAny.R2_PUBLIC_URL as string | undefined;
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  // 2. Use the correct R2 public dev URL for this bucket type
  const bucketUrl = R2_PUBLIC_URLS[bucketType];
  if (bucketUrl) {
    return `${bucketUrl}/${key}`;
  }
  // 3. Fallback — should not normally be reached
  return `https://pub-25692986d3ff446abba05633a1d20a9a.r2.dev/${key}`;
}
