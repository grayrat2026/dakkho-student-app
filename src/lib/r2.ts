import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(bucket: string, key: string, body: Buffer | ReadableStream, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body as any,
    ContentType: contentType,
  });
  return r2.send(command);
}

export async function deleteFromR2(bucket: string, key: string) {
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  return r2.send(command);
}

export async function generatePresignedUrl(bucket: string, key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}

export async function checkR2Bucket(bucket: string) {
  try {
    await r2.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}

export function getR2PublicUrl(bucket: string, key: string) {
  return `${process.env.R2_ENDPOINT}/${bucket}/${key}`;
}

export { r2 };
