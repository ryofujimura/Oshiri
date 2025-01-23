import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: any[];
  background_removal?: boolean;
}

export async function uploadImage(
  file: Express.Multer.File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    // Verify Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary configuration');
    }

    // Default transformations if none provided
    const defaultTransformations = [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
      { width: 1200, height: 800, crop: 'limit' }
    ];

    // Create upload options
    const uploadOptions = {
      folder: options.folder || 'content-images',
      transformation: options.transformation || defaultTransformations,
      resource_type: 'auto',
      background_removal: options.background_removal ? 'cloudinary_ai' : undefined,
    };

    // Upload the file
    const result = await cloudinary.uploader.upload(file.path, uploadOptions);

    // Clean up temporary file
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.warn('Failed to clean up temporary file:', error);
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error: any) {
    // Clean up temporary file on error
    try {
      fs.unlinkSync(file.path);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    console.error('Error uploading to Cloudinary:', error);

    // Provide more detailed error information
    if (error.http_code === 401) {
      throw new Error('Cloudinary authentication failed. Please check your credentials.');
    } else if (error.http_code === 413) {
      throw new Error('Image file is too large. Please upload a smaller image.');
    } else if (error.http_code === 415) {
      throw new Error('Unsupported image format. Please use a different image format.');
    }

    throw new Error('Failed to upload image: ' + (error.message || 'Unknown error'));
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    if (!publicId) {
      throw new Error('Public ID is required for deletion');
    }

    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image: ' + (error.message || 'Unknown error'));
  }
}

export function generateImageUrl(publicId: string, transform?: any): string {
  if (!publicId) {
    throw new Error('Public ID is required for URL generation');
  }

  return cloudinary.url(publicId, {
    secure: true,
    transformation: transform,
  });
}