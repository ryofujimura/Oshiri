import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadImage(
  file: Express.Multer.File,
  options: {
    folder?: string;
    transformation?: any[];
    background_removal?: boolean;
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    // Create a temporary file path
    const result = await cloudinary.uploader.upload(file.path, {
      folder: options.folder || 'content-images',
      transformation: options.transformation || [
        { width: 1200, height: 800, crop: 'limit' }, // Limit max dimensions
        { quality: 'auto:good' }, // Automatic quality optimization
      ],
      background_removal: options.background_removal ? 'cloudinary_ai' : undefined,
    });

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
}

export function generateImageUrl(publicId: string, transform?: any): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transform,
  });
}
