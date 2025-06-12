import { S3Client } from '@aws-sdk/client-s3';

const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

function client() {
  if (!accessKeyId || !secretAccessKey) {
    console.error('Storage credentials not found');
    console.log('accessKeyId', accessKeyId);
    console.log('secretAccessKey', secretAccessKey);
    return null;
  }

  const host = process.env.NODE_ENV === 'development' ? 'http://' : 'https://';

  return new S3Client({
    endpoint: `${host}${process.env.S3_ENDPOINT}`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    region: process.env.S3_REGION || 'us-east-1',
  });
}

const globalForStorage = global as unknown as { storage: S3Client };

const storage = globalForStorage.storage || (process.env.NEXT_PHASE === 'phase-production-build' ? null : client());

if (process.env.NODE_ENV !== 'production') globalForStorage.storage = storage;

export default storage;
