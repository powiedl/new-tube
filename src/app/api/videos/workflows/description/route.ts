import { db } from '@/db';
import { videos } from '@/db/schema';
import { serve } from '@upstash/workflow/nextjs';
import { and, eq } from 'drizzle-orm';
import { Client } from '@upstash/qstash';

interface InputType {
  userId: string;
  videoId: string;
}

const DESCRIPTION_PROMPT = `Your task is to summarize the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.
The transcript is:`;

export const { POST } = serve(async (context) => {
  const { videoId, userId } = context.requestPayload as InputType;
  const video = await context.run('get-video', async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    return existingVideo;
  });
  if (!video) throw new Error('Not found');
  if (!video.muxTrackId) throw new Error('Transcript not availabe');

  const transcript = await context.run('get-transcript', async () => {
    const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
    const response = await fetch(trackUrl);
    const transcript = response.text();
    if (!transcript) throw new Error('Bad request');
    return transcript;
  });

  const fullPrompt = `${DESCRIPTION_PROMPT}"${transcript}"`;

  // trigger background worker asynchronously (fire-and-forget)
  // avoid blocking the workflow response
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const qstash = new Client({ token: process.env.QSTASH_TOKEN });

  qstash
    .publish({
      url: `${baseUrl}/api/videos/workflows/description-worker`,
      body: JSON.stringify({ videoId, userId, prompt: fullPrompt }),
      retries: 2,
    })
    .catch((err) => console.error('qstash.publish failed:', err));

  // return immediately without waiting for generation
  return { success: true, message: 'Description generation started' };
});
