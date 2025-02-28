import { db } from '@/db';
import { videos } from '@/db/schema';
import { serve } from '@upstash/workflow/nextjs';
import { and, eq } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { UploadFileResult } from 'uploadthing/types';
//import { UTApi } from 'uploadthing/server';

interface InputType {
  aiEngine?: string;
  userId: string;
  videoId: string;
  prompt: string;
}

export const { POST } = serve(async (context) => {
  console.log(
    'POST /api/videos/workflows/thumbnail, NEXT_PUBLIC_IMAGE_AI',
    process.env.NEXT_PUBLIC_IMAGE_AI
  );
  const {
    videoId,
    userId,
    aiEngine = process.env.NEXT_PUBLIC_IMAGE_AI || 'POLLINATIONS',
    prompt,
  } = context.requestPayload as InputType;
  let thumbnailKey = '';
  let thumbnailUrl = '';
  const video = await context.run('get-video', async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    return existingVideo;
  });
  if (!video) throw new Error('Not found');
  let res;
  if (aiEngine === 'IMAGINE') {
    res = await context.call('generate-thumbnail-imagine', {
      url: 'https://api.vyro.ai/v2/image/generations',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.env.IMAGINE_APIKEY}`,
        'Content-Type': 'application/x-www-form-urlencoded', // Important for sending form data
        responseType: 'stream',
      },
      body: new URLSearchParams({
        prompt: prompt,
        style: 'realistic',
        aspect_ratio: '16:9',
      }),
    });
    console.log({ res });
  } else if (aiEngine === 'POLLINATIONS') {
    const width = 320;
    const height = 180;
    const model = 'flux';
    const baseUrl = process.env.POLLINATIONS_IMAGE_URL;
    const url = `${baseUrl}/prompt/${encodeURIComponent(
      prompt
    )}?width=${width}&height=${height}&model=${model}`;
    // console.log('POLLINATIONS-Image-Full-Url', url);

    const { status } = await context.call<Buffer>(
      'generate-thumbnail-pollinations',
      {
        url,
        method: 'GET',
      }
    );
    //const {body } = res.body;
    let uploadedFile: UploadFileResult;
    //console.log({ status, bodyLength: body.length });
    if (status === 200) {
      // we use a trick and pass the URL we used to generate also as the URL to upload - but now the image is already generated, so we can simply use it for the upload
      const utapi = new UTApi();

      uploadedFile = await context.run('upload-thumbnail', async () => {
        return await utapi.uploadFilesFromUrl(url);
      });
      thumbnailKey = uploadedFile?.data?.key || '';
      thumbnailUrl = uploadedFile?.data?.url || '';

      if (video.thumbnailKey) await utapi.deleteFiles(video.thumbnailKey); // remove old thumbnail if present
    }
  }

  //   const utapi=new UTApi();
  //   await context.run('upload thumbnail to uploadthing', async() => {
  //     const uploadedFile = await utapi.uploadFiles(generatedThumbnailBlob as Buffer);
  // });

  if (thumbnailKey && thumbnailUrl) {
    await context.run('update-video', async () => {
      const updatedVideo = await db
        .update(videos)
        .set({
          thumbnailKey,
          thumbnailUrl,
        })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
        .returning();
      return updatedVideo;
    });
  }
});
