import { getWorkspaceOpenAIClient } from '@/lib/openai/workspace-client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages, model = 'gpt-4o', temperature = 0.7, max_tokens = 4096, system_prompt } = await request.json();

    const { client: openai } = await getWorkspaceOpenAIClient();

    const systemMessages = system_prompt
      ? [{ role: 'system' as const, content: system_prompt }]
      : [];

    const response = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens,
      messages: [...systemMessages, ...messages],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error: any) {
    const status = error.message?.includes('not configured') ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
