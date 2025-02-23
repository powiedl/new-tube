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

const TITLE_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.
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

  const generatedTitle = await context.run('generate-title', async () => {
    //const genAI = new GoogleGenerativeAI(context.env.GEMINI_APIKEY!);
    const model = genAI.getGenerativeModel({ model: GEMINI_PREFERED_MODEL });

    const prompt = `${TITLE_PROMPT}"${transcript}"`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
  //console.log('Generated title:', generatedTitle);

  if (!generatedTitle) throw new Error('Unable to generate a title');

  await context.run('update-video', async () => {
    const updatedVideo = await db
      .update(videos)
      .set({ title: generatedTitle })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
      .returning();
    return updatedVideo;
  });
});
