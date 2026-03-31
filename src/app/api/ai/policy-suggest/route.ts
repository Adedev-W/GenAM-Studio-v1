import { getBusinessOpenAIClient } from '@/lib/openai/workspace-client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const InputSchema = z.object({
  description: z.string().min(10),
});

const AVAILABLE_METRICS = [
  "CPU_USAGE", "MEMORY_USAGE", "NETWORK_IO_IN", "NETWORK_IO_OUT",
  "TASK_THROUGHPUT", "SUCCESS_RATE", "TASK_QUEUE_LENGTH", "AGENT_STATUS"
];

const AVAILABLE_ACTIONS = [
  "SCALE_AGENT_UP", "SCALE_AGENT_DOWN", "PAUSE_AGENT", "RESUME_AGENT",
  "RESTART_AGENT", "SEND_ALERT_TO_SLACK", "SEND_ALERT_TO_EMAIL"
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = InputSchema.parse(body);

    const { client: openai } = await getBusinessOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate policy rules for autonomous agent management.
Available metrics: ${AVAILABLE_METRICS.join(", ")}
Available actions: ${AVAILABLE_ACTIONS.join(", ")}
Respond with JSON: {"suggestedPolicies": [{"condition": "...", "action": "...", "priority": 100, "description": "..."}]}`
        },
        { role: "user", content: validated.description }
      ],
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return NextResponse.json(parsed);
  } catch (error: any) {
    const status = error.message?.includes('not configured') ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
