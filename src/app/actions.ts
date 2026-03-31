"use server";

import { z } from 'zod';
import { getBusinessOpenAIClient } from '@/lib/openai/workspace-client';

const ActionInputSchema = z.object({
  description: z.string().min(10, "Please provide a more detailed description."),
});

const AVAILABLE_METRICS = [
  "CPU_USAGE", "MEMORY_USAGE", "NETWORK_IO_IN", "NETWORK_IO_OUT",
  "TASK_THROUGHPUT", "SUCCESS_RATE", "TASK_QUEUE_LENGTH", "AGENT_STATUS"
];

const AVAILABLE_ACTIONS = [
  "SCALE_AGENT_UP", "SCALE_AGENT_DOWN", "PAUSE_AGENT", "RESUME_AGENT",
  "RESTART_AGENT", "SEND_ALERT_TO_SLACK", "SEND_ALERT_TO_EMAIL"
];

export async function generatePolicySuggestions(prevState: any, formData: FormData) {
  const validatedFields = ActionInputSchema.safeParse({
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      errors: validatedFields.error.flatten().fieldErrors,
      suggestions: [],
    };
  }

  try {
    const { client: openai } = await getBusinessOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that generates policy rules for autonomous agent management.
Given a natural language description, generate structured policy rules.

Available metrics: ${AVAILABLE_METRICS.join(", ")}
Available actions: ${AVAILABLE_ACTIONS.join(", ")}

Respond with a JSON object containing a "suggestedPolicies" array. Each policy should have:
- condition: string (e.g., "CPU_USAGE > 80% AND MEMORY_USAGE > 90%")
- action: string (one of the available actions)
- priority: number (lower = higher priority, default 100)
- description: string (human-readable explanation)`
        },
        {
          role: "user",
          content: validatedFields.data.description
        }
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        message: 'The AI could not generate suggestions. Please try again.',
        errors: null,
        suggestions: [],
      };
    }

    const parsed = JSON.parse(content);
    const suggestions = parsed.suggestedPolicies || [];

    if (suggestions.length === 0) {
      return {
        message: 'The AI could not generate suggestions for this description. Please try a different approach.',
        errors: null,
        suggestions: [],
      };
    }

    return { message: 'success', errors: null, suggestions };
  } catch (error: any) {
    if (error.message?.includes('not configured')) {
      return {
        message: 'OpenAI API key not configured. Please add your API key in Settings → API Keys.',
        errors: null,
        suggestions: [],
      };
    }
    console.error('Error generating policy suggestions:', error);
    return {
      message: 'An unexpected error occurred while contacting the AI. Please try again later.',
      errors: null,
      suggestions: [],
    };
  }
}
