'use server';

import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { actionClient } from '@/server/safe-action';
import z from 'zod';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const formData = z.object({
  image: z.instanceof(FormData),
});

type UploadResult =
  | { success: UploadApiResponse; error?: never }
  | { error: string; success?: never };

export const uploadImage = actionClient
  .schema(formData)
  .action(async ({ parsedInput: { image } }): Promise<UploadResult> => {
    console.log('Received image for upload:', image);

    const formImage = image.get('image');

    if (!formImage) return { error: 'No image provided' };
    if (!(formImage instanceof File)) return { error: 'Invalid image file' };

    const file = formImage as File;

    try {
      // Convert the file to a buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new Promise<UploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            upload_preset: 'ml_default',
            use_filename: true,
            unique_filename: false,
            filename_override: file.name,
          },
          (error, result) => {
            if (error || !result) {
              console.error('Upload failed:', error);
              reject({ error: 'Upload failed' });
            } else {
              console.log('Upload successful:', result);
              resolve({ success: result });
            }
          }
        );

        // Send the buffer to the upload stream
        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error('Error processing file:', error);
      return { error: 'Error processing file' };
    }
    // deploy
  });
