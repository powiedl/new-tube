import { db } from '@/db';
import { videos } from '@/db/schema';
import { genAI, GEMINI_PREFERED_MODEL } from '@/lib/gemini';
import { and, eq } from 'drizzle-orm';

export const runtime = 'edge';

const DESCRIPTION_PROMPT = `Your task is to summarize the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.
The transcript is:`;

export async function POST(request: Request) {
  try {
    const { videoId, userId, transcript } = await request.json();

    if (!videoId || !userId || !transcript) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_PREFERED_MODEL });
    const prompt = `${DESCRIPTION_PROMPT}"${transcript}"`;

    // Streaming-Response für bessere UX und um Timeouts zu vermeiden
    const stream = await model.generateContentStream(prompt);

    // Sammle den vollständigen Text (Streaming wird vom Client konsumiert)
    let fullText = '';
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text();
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }

          // Nach vollständiger Generierung in DB speichern
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
