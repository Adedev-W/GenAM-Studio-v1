import { SupabaseClient } from '@supabase/supabase-js';

// Pricing per 1M tokens (USD)
export const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o': { prompt: 2.50, completion: 10.00 },
  'gpt-4o-mini': { prompt: 0.15, completion: 0.60 },
  'gpt-4.1': { prompt: 2.00, completion: 8.00 },
  'gpt-4.1-mini': { prompt: 0.40, completion: 1.60 },
  'gpt-4.1-nano': { prompt: 0.10, completion: 0.40 },
  'gpt-4-turbo': { prompt: 10.00, completion: 30.00 },
  'gpt-3.5-turbo': { prompt: 0.50, completion: 1.50 },
};

interface RecordUsageParams {
  workspaceId: string;
  agentId: string | null;
  modelId: string;
  tokensPrompt: number;
  tokensCompletion: number;
  sessionId?: string | null;
  conversationId?: string | null;
}

export async function recordTokenUsage(
  supabase: SupabaseClient,
  params: RecordUsageParams
) {
  const { workspaceId, agentId, modelId, tokensPrompt, tokensCompletion, sessionId, conversationId } = params;

  const pricing = MODEL_PRICING[modelId] || { prompt: 1.00, completion: 1.00 };
  const costUsd = (tokensPrompt * pricing.prompt + tokensCompletion * pricing.completion) / 1_000_000;

  await supabase.from('cost_entries').insert({
    workspace_id: workspaceId,
    agent_id: agentId || null,
    model_id: modelId,
    tokens_prompt: tokensPrompt,
    tokens_completion: tokensCompletion,
    cost_usd: costUsd,
    session_id: sessionId || null,
    conversation_id: conversationId || null,
    timestamp: new Date().toISOString(),
  });

  // Increment current_tokens_used on matching token_limits
  const totalTokens = tokensPrompt + tokensCompletion;
  const now = new Date().toISOString().split('T')[0];

  // Update workspace-wide limit
  try {
    await supabase.rpc('increment_token_usage', {
      p_workspace_id: workspaceId,
      p_agent_id: agentId || null,
      p_tokens: totalTokens,
      p_today: now,
    });
  } catch {}
}
