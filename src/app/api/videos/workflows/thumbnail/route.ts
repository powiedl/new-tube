import { db } from '@/db';
import { videos } from '@/db/schema';
import { serve } from '@upstash/workflow/nextjs';
import { and, eq } from 'drizzle-orm';
//import { UTApi } from 'uploadthing/server';

interface InputType {
  userId: string;
  videoId: string;
  prompt: string;
}

export const { POST } = serve(async (context) => {
  const { videoId, userId, prompt } = context.requestPayload as InputType;
  const video = await context.run('get-video', async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    return existingVideo;
  });
  if (!video) throw new Error('Not found');

  const res = await context.call('generate-thumbnail', {
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

  //   const utapi=new UTApi();
  //   await context.run('upload thumbnail to uploadthing', async() => {
  //     const uploadedFile = await utapi.uploadFiles(generatedThumbnailBlob as Buffer);
  // });

  // await context.run('update-video', async () => {
  //   const updatedVideo = await db
  //     .update(videos)
  //     .set({ title: generatedTitle })
  //     .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
  //     .returning();
  //   return updatedVideo;
  // });
});
