import { db } from '@/db';
import { videos } from '@/db/schema';
import { genAI, GEMINI_PREFERED_MODEL } from '@/lib/gemini';
import { and, eq } from 'drizzle-orm';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

interface WorkerInput {
  videoId: string;
  userId: string;
  prompt: string;
}

/**
 * Background worker endpoint for generating video descriptions asynchronously
 * Called by QStash (from description/route.ts) after quick validation
 * Protected by QStash signature verification (verifySignatureAppRouter)
 */
export const POST = verifySignatureAppRouter(async (request: Request) => {
  try {
    const { videoId, userId, prompt } = (await request.json()) as WorkerInput;

    if (!videoId || !userId || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[description-worker] Starting generation for video:', videoId);

    // Generate description via Gemini streaming
    const model = genAI.getGenerativeModel({ model: GEMINI_PREFERED_MODEL });
    const stream = await model.generateContentStream(prompt);

    let fullText = '';
    for await (const chunk of stream.stream) {
      fullText += chunk.text();
    }

    if (!fullText) {
      throw new Error('Failed to generate description');
    }

    console.log('[description-worker] Generated text length:', fullText.length);

    // Update database
    // const [updatedVideo] = await db
    await db
      .update(videos)
      .set({ description: fullText })
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
      .returning();

    console.log('[description-worker] Database updated for video:', videoId);

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        descriptionLength: fullText.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[description-worker] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
