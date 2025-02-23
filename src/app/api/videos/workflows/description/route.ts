import { db } from '@/db';
import { videos } from '@/db/schema';
import { serve } from '@upstash/workflow/nextjs';
import { and, eq } from 'drizzle-orm';
import {
  genAI,
  //  GEMINI_BACKUP_MODEL,
  GEMINI_PREFERED_MODEL,
} from '@/lib/gemini';

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
    if (!transcript) throw new Error('Bad request'); // here it makes sense to throw the error inside, because maybe the trackUrl-Endpoint is temporary unavailable
    return transcript;
  });

  const generatedDescription = await context.run(
    'generate-description',
    async () => {
      //const genAI = new GoogleGenerativeAI(context.env.GEMINI_APIKEY!);
      const model = genAI.getGenerativeModel({ model: GEMINI_PREFERED_MODEL });

      const prompt = `${DESCRIPTION_PROMPT}"${transcript}"`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  );

  if (!generatedDescription)
    throw new Error('Unable to generate a description');

  await context.run('update-video', async () => {
    const updatedVideo = await db
      .update(videos)
      .set({ description: generatedDescription })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
      .returning();
    return updatedVideo;
  });
});
