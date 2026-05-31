/**
 * AfriBayit — Cloudflare R2 Storage Client
 * AWS S3-compatible client for file storage on Cloudflare R2
 * Supports uploads, signed URLs, and file deletion
 */

import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET || 'afribayit';

/**
 * Upload a file to R2 storage
 * @param key - Object key (path/filename)
 * @param body - File content as Buffer
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${process.env.R2_PUBLIC_URL || ''}/${key}`;
}

/**
 * Generate a signed URL for direct client-side upload to R2
 * @param key - Object key (path/filename)
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration in seconds (default: 15 minutes)
 * @returns Signed URL for PUT request
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<string> {
  return getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}

/**
 * Generate a signed URL for downloading a file from R2
 * @param key - Object key (path/filename)
 * @param expiresIn - URL expiration in seconds (default: 15 minutes)
 * @returns Signed URL for GET request
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 900
): Promise<string> {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn }
  );
}

/**
 * Delete a file from R2 storage
 * @param key - Object key (path/filename)
 */
export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Generate a unique storage key for a file
 * @param prefix - Path prefix (e.g., 'properties', 'avatars', 'documents')
 * @param filename - Original filename
 * @returns Unique key in format: prefix/uuid-originalname
 */
export function generateStorageKey(prefix: string, filename: string): string {
  const uuid = crypto.randomUUID();
  const ext = filename.includes('.') ? filename.split('.').pop() : '';
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);
  return `${prefix}/${uuid}-${sanitized}${ext ? `.${ext}` : ''}`;
}

/**
 * Validate file type against allowed MIME types
 */
export function isValidFileType(
  contentType: string,
  allowedTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]
): boolean {
  return allowedTypes.includes(contentType);
}

/**
 * Validate file size against maximum
 * @param size - File size in bytes
 * @param maxSizeMB - Maximum size in MB (default: 10MB)
 */
export function isValidFileSize(size: number, maxSizeMB = 10): boolean {
  return size <= maxSizeMB * 1024 * 1024;
}
