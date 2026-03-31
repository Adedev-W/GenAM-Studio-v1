import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if token usage has exceeded limits for a business/agent.
 * Returns { exceeded: true, message } if limit reached, { exceeded: false } otherwise.
 */
export async function checkTokenLimit(
  supabase: SupabaseClient,
  businessId: string,
  agentId: string | null
): Promise<{ exceeded: boolean; message?: string }> {
  const today = new Date().toISOString().split('T')[0];

  // Check limits within current period
  const { data: limits } = await supabase
    .from('token_limits')
    .select('id, name, monthly_token_limit, current_tokens_used, agent_id')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .lte('period_start', today)
    .gte('period_end', today);

  if (!limits || limits.length === 0) return { exceeded: false };

  for (const limit of limits) {
    const isMatch = limit.agent_id === null || limit.agent_id === agentId;
    if (isMatch && limit.current_tokens_used >= limit.monthly_token_limit) {
      const scope = limit.agent_id ? `Agent ini` : 'Workspace';
      return {
        exceeded: true,
        message: `${scope} telah mencapai batas penggunaan token bulanan (${limit.current_tokens_used.toLocaleString()} / ${limit.monthly_token_limit.toLocaleString()}). Silakan tingkatkan limit di pengaturan Usage.`,
      };
    }
  }

  return { exceeded: false };
}

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
  businessId: string;
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
  const { businessId, agentId, modelId, tokensPrompt, tokensCompletion, sessionId, conversationId } = params;

  const pricing = MODEL_PRICING[modelId] || { prompt: 1.00, completion: 1.00 };
  const costUsd = (tokensPrompt * pricing.prompt + tokensCompletion * pricing.completion) / 1_000_000;

  await supabase.from('cost_entries').insert({
    business_id: businessId,
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

  // Update business-wide limit
  try {
    await supabase.rpc('increment_token_usage', {
      p_business_id: businessId,
      p_agent_id: agentId || null,
      p_tokens: totalTokens,
      p_today: now,
    });
  } catch {}
}
