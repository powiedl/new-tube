import { GoogleGenerativeAI } from '@google/generative-ai';

import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { videoId, userId, prompt, internalKey } = await request.json();

    // simple shared-secret auth to prevent public hitting the edge route
    const expectedKey = process.env.EDGE_API_KEY;

    //console.log('[Edge Auth] Incoming:', incomingKey, 'Expected:', expectedKey);

    if (internalKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing internal key' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!videoId || !userId || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY!);
    const GEMINI_PREFERED_MODEL =
      process.env.GEMINI_PREFERED_MODEL || 'gemini-2.5-flash-lite';
    //const GEMINI_BACKUP_MODEL = process.env.GEMINI_BACKUP_MODEL || 'gemini-2.5-flash';

    const model = genAI.getGenerativeModel({ model: GEMINI_PREFERED_MODEL });

    // Streaming-Response für bessere UX und um Timeouts zu vermeiden
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ description: text });
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
