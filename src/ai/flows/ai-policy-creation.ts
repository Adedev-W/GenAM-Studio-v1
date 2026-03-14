'use server';
/**
 * @fileOverview A Genkit flow to assist in designing proactive policies for agent management.
 * 
 * - aidPolicyCreation - A function that generates suggested policy rules based on natural language descriptions or historical data patterns.
 * - AidPolicyCreationInput - The input type for the aidPolicyCreation function.
 * - AidPolicyCreationOutput - The return type for the aidPolicyCreation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const AidPolicyCreationInputSchema = z.object({
  description: z.string().describe('A natural language description of the desired proactive policy or historical data patterns to analyze.'),
});
export type AidPolicyCreationInput = z.infer<typeof AidPolicyCreationInputSchema>;

// Output Schema
const PolicyRuleSchema = z.object({
  condition: z.string().describe('The condition that triggers the policy rule, e.g., "CPU_USAGE > 80% AND MEMORY_USAGE > 90%". Use available metrics: CPU_USAGE, MEMORY_USAGE, NETWORK_IO_IN, NETWORK_IO_OUT, TASK_THROUGHPUT, SUCCESS_RATE, TASK_QUEUE_LENGTH, AGENT_STATUS (running, idle, errored).'),
  action: z.string().describe('The action to take when the condition is met, e.g., "SCALE_AGENT_UP", "SEND_ALERT_TO_SLACK". Available actions: SCALE_AGENT_UP, SCALE_AGENT_DOWN, PAUSE_AGENT, RESUME_AGENT, RESTART_AGENT, SEND_ALERT_TO_SLACK, SEND_ALERT_TO_EMAIL.'),
  priority: z.number().optional().describe('Optional priority for the rule (lower number means higher priority, default is 100).'),
  description: z.string().optional().describe('A brief explanation of the rule.'),
});

const AidPolicyCreationOutputSchema = z.object({
  suggestedPolicies: z.array(PolicyRuleSchema).describe('An array of suggested proactive policy rules based on the input description.'),
});
export type AidPolicyCreationOutput = z.infer<typeof AidPolicyCreationOutputSchema>;

// Wrapper function
export async function aidPolicyCreation(input: AidPolicyCreationInput): Promise<AidPolicyCreationOutput> {
  return aidPolicyCreationFlow(input);
}

// Prompt definition
const policySuggestionPrompt = ai.definePrompt({
  name: 'policySuggestionPrompt',
  input: { schema: AidPolicyCreationInputSchema },
  output: { schema: AidPolicyCreationOutputSchema },
  prompt: `Anda adalah asisten AI yang dirancang untuk membantu membuat kebijakan proaktif untuk sistem pemantauan agen otonom.
Berdasarkan deskripsi yang diberikan tentang perilaku yang diinginkan atau pola historis, buatlah daftar aturan kebijakan.
Setiap aturan harus memiliki 'condition' (apa yang memicu aturan) dan 'action' (apa yang terjadi ketika terpicu).
Secara opsional, sertakan 'priority' (angka lebih rendah berarti prioritas lebih tinggi, default 100) dan 'description' (penjelasan singkat tentang aturan).

Gunakan metrik yang tersedia: CPU_USAGE, MEMORY_USAGE, NETWORK_IO_IN, NETWORK_IO_OUT, TASK_THROUGHPUT, SUCCESS_RATE, TASK_QUEUE_LENGTH, AGENT_STATUS (running, idle, errored).
Tindakan yang tersedia meliputi: SCALE_AGENT_UP, SCALE_AGENT_DOWN, PAUSE_AGENT, RESUME_AGENT, RESTART_AGENT, SEND_ALERT_TO_SLACK, SEND_ALERT_TO_EMAIL.

Deskripsi: {{{description}}}`,
});

// Flow definition
const aidPolicyCreationFlow = ai.defineFlow(
  {
    name: 'aidPolicyCreationFlow',
    inputSchema: AidPolicyCreationInputSchema,
    outputSchema: AidPolicyCreationOutputSchema,
  },
  async (input) => {
    const { output } = await policySuggestionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate policy suggestions.');
    }
    return output;
  }
);