import { genAI, GEMINI_PREFERED_MODEL } from '@/lib/gemini';
import { db } from '@/db';
import { videos } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { videoId, userId, prompt } = await request.json();

    // simple shared-secret auth to prevent public hitting the edge route
    const incomingKey = request.headers.get('x-internal-key');
    if (incomingKey !== process.env.EDGE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!videoId || !userId || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_PREFERED_MODEL });

    // Streaming-Response für bessere UX und um Timeouts zu vermeiden
    const stream = await model.generateContentStream(prompt);

    // Sammle den vollständigen Text (Streaming wird vom Client konsumiert)
    let fullText = '';
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text();
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }

          // after generation update database directly
          if (fullText) {
            await db
              .update(videos)
              .set({ description: fullText })
              .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error generating description:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate description',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
