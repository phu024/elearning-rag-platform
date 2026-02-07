import { Client } from 'minio';

const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';

if (!process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
  console.warn('WARNING: MinIO credentials not set in environment. Using insecure defaults.');
}

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'elearning-files';

export const initializeBucket = async (): Promise<void> => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✓ MinIO bucket "${BUCKET_NAME}" created successfully`);
    } else {
      console.log(`✓ MinIO bucket "${BUCKET_NAME}" already exists`);
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
    throw error;
  }
};

export const uploadFile = async (
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<{ url: string; key: string }> => {
  try {
    const key = `${Date.now()}-${filename}`;
    await minioClient.putObject(BUCKET_NAME, key, buffer, buffer.length, {
      'Content-Type': contentType,
    });

    const url = await getFileUrl(key);
    return { url, key };
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw new Error('Failed to upload file');
  }
};

export const getFileUrl = async (key: string): Promise<string> => {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, key, 24 * 60 * 60);
    return url;
  } catch (error) {
    console.error('Error getting file URL from MinIO:', error);
    throw new Error('Failed to get file URL');
  }
};

export const deleteFile = async (key: string): Promise<void> => {
  try {
    await minioClient.removeObject(BUCKET_NAME, key);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw new Error('Failed to delete file');
  }
};

export { minioClient, BUCKET_NAME };
