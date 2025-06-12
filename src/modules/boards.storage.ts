import { randomId } from '@/lib/random';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import storageClient from '../lib/storage';

const folders = process.env.S3_BUCKET_NAME?.split('/');
const bucketName = folders?.[0];
const folderName = folders?.[1];

export const uploadImage = async (image: File | null | undefined | string): Promise<string> => {
  if (!storageClient) {
    console.error('Storage client not found');
    return '';
  }

  if (image === null || image === undefined || typeof image === 'string') {
    console.error('Image not found');
    return '';
  }

  const imageBuffer = await image?.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer);
  const imageExtension = image?.name?.split('.').pop();
  const imagePath = `${folderName}/${randomId()}.${imageExtension}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: imagePath,
      Body: base64Image,
      ContentType: image.type,
    });

    await storageClient.send(command);

    return imagePath;
  } catch (err) {
    console.error(err);
    return '';
  }
};

export const getImage = async (imagePath: string) => {
  if (!storageClient) {
    console.error('Storage client not found');
    return '';
  }

  if (imagePath === null || imagePath === undefined || imagePath.length === 0) {
    console.error('Image path not found');
    return '';
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: imagePath,
  });

  const imageUrl = await getSignedUrl(storageClient, command, { expiresIn: 60 * 60 * 24 });
  return imageUrl;
};

export const deleteImage = async (fullPath: string) => {
  if (!storageClient) {
    console.error('Storage client not found');
    return '';
  }

  if (fullPath === null || fullPath === undefined || fullPath.length === 0) {
    console.error('Image path not found');
    return '';
  }

  const path = fullPath.split('?')[0].split('/').at(-1);

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: `${folderName}/${path}`,
  });

  const res = await storageClient.send(command);

  return res;
};
