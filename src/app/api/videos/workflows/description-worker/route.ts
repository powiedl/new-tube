import { db } from '@/db';
import { videos } from '@/db/schema';
import { genAI, GEMINI_PREFERED_MODEL } from '@/lib/gemini';
import { and, eq } from 'drizzle-orm';

interface WorkerInput {
  videoId: string;
  userId: string;
  prompt: string;
}

/**
 * Background worker endpoint for generating video descriptions asynchronously
 * Called by QStash (from description/route.ts) after quick validation
 * DEBUG: Temporarily without signature verification to diagnose issues
 */
export async function POST(request: Request) {
  console.log('[description-worker] Request received');
  console.log(
    '[description-worker] Headers:',
    Object.fromEntries(request.headers),
  );

  try {
    const body = await request.text();
    console.log('[description-worker] Raw body:', body);

    const parsed = JSON.parse(body) as WorkerInput;
    const { videoId, userId, prompt } = parsed;
    console.log('[description-worker] Parsed:', {
      videoId,
      userId,
      promptLength: prompt?.length,
    });

    if (!videoId || !userId || !prompt) {
      console.log('[description-worker] Missing params:', {
        videoId: !!videoId,
        userId: !!userId,
        prompt: !!prompt,
      });
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
  } catch (parseError) {
    console.error('[description-worker] Parse/Processing error:', parseError);
    return new Response(
      JSON.stringify({
        error: parseError instanceof Error ? parseError.message : 'Parse error',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
