'use server';

import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { actionClient } from '@/server/safe-action';
import z from 'zod';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const recolorSchema = z.object({
  activeImage: z.string(),
  format: z.string(),
});

async function checkImageProcessing(url: string) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking image processing:', error);
    return false;
  }
}

export const bgRemoval = actionClient
  .schema(recolorSchema)
  .action(async ({ parsedInput: { activeImage, format } }) => {
    try {
      const form = activeImage.split(format);
      const pngConvert = form[0] + 'png';
      const parts = pngConvert.split('/upload/');
      const removeUrl = `${parts[0]}/upload/e_background_removal/${parts[1]}`;

      // Poll the URL to check if the image is processed
      let isProcessed = false;
      const maxAttempts = 20;
      const delay = 1000; // 1 second
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        isProcessed = await checkImageProcessing(removeUrl);
        console.log(removeUrl);
        if (isProcessed) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (!isProcessed) {
        throw new Error('Image processing timed out');
      }

      console.log('Image processed successfully:', removeUrl);
      return { success: removeUrl };
    } catch (error) {
      console.error('Error during background removal:', error);
      throw new Error('Background removal failed');
    }
  });
