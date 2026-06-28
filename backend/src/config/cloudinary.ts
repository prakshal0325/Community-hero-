import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const uploadToCloudinary = async (
  filePath: string,
  folder: string = 'community-hero'
): Promise<{ url: string; publicId: string }> => {
  if (!env.CLOUDINARY_CLOUD_NAME) {
    // Local fallback: return the file path as-is
    return { url: `/uploads/${filePath.split(/[/\\]/).pop()}`, publicId: '' };
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });

  return { url: result.secure_url, publicId: result.public_id };
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (!env.CLOUDINARY_CLOUD_NAME || !publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
