'use server';

import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { actionClient } from '@/server/safe-action';
import z from 'zod';

cloudinary.config({
  cloud_name: 'dwja3p504',
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const genFillSchema = z.object({
  activeVideo: z.string(),
  aspect: z.string(),
  height: z.string(),
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

export const genCrop = actionClient
  .schema(genFillSchema)
  .action(async ({ parsedInput: { activeVideo, aspect, height } }) => {
    try {
      const parts = activeVideo.split('/upload/');
      const fillUrl = `${parts[0]}/upload/ar_${aspect},c_fill,g_auto,h_${height}/${parts[1]}`;

      // Poll the URL to check if the video is processed
      let isProcessed = false;
      const maxAttempts = 20;
      const delay = 1000; // 1 second
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        isProcessed = await checkImageProcessing(fillUrl);
        if (isProcessed) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (!isProcessed) {
        throw new Error('Video processing timed out');
      }

      console.log('Video processed successfully:', fillUrl);
      return { success: fillUrl };
    } catch (error) {
      console.error('Error during genCrop action:', error);
      throw new Error('genCrop action failed');
    }
  });
