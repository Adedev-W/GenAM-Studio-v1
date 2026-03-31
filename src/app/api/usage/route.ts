import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [entriesRes, limitsRes] = await Promise.all([
      supabase
        .from('cost_entries')
        .select('*, agents(name)')
        .eq('business_id', businessId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true }),
      supabase
        .from('token_limits')
        .select('*, agents(name)')
        .eq('business_id', businessId)
        .eq('is_active', true),
    ]);

    if (entriesRes.error) return NextResponse.json({ error: entriesRes.error.message }, { status: 500 });

    const entries = entriesRes.data || [];
    const limits = limitsRes.data || [];

    // Aggregate by day
    const byDay: Record<string, { tokensPrompt: number; tokensCompletion: number; cost: number; requests: number }> = {};
    const byAgent: Record<string, { name: string; tokensPrompt: number; tokensCompletion: number; requests: number }> = {};
    const byModel: Record<string, { tokensPrompt: number; tokensCompletion: number; requests: number }> = {};

    let totalPrompt = 0;
    let totalCompletion = 0;
    let totalRequests = 0;

    for (const e of entries) {
      const day = e.created_at ? new Date(e.created_at).toISOString().split('T')[0] : '';
      const tp = e.tokens_prompt || 0;
      const tc = e.tokens_completion || 0;

      totalPrompt += tp;
      totalCompletion += tc;
      totalRequests += 1;

      if (!byDay[day]) byDay[day] = { tokensPrompt: 0, tokensCompletion: 0, cost: 0, requests: 0 };
      byDay[day].tokensPrompt += tp;
      byDay[day].tokensCompletion += tc;
      byDay[day].cost += e.cost_usd || 0;
      byDay[day].requests += 1;

      if (e.agent_id) {
        const name = (e as any).agents?.name || 'Unknown';
        if (!byAgent[e.agent_id]) byAgent[e.agent_id] = { name, tokensPrompt: 0, tokensCompletion: 0, requests: 0 };
        byAgent[e.agent_id].tokensPrompt += tp;
        byAgent[e.agent_id].tokensCompletion += tc;
        byAgent[e.agent_id].requests += 1;
      }

      if (e.model_id) {
        if (!byModel[e.model_id]) byModel[e.model_id] = { tokensPrompt: 0, tokensCompletion: 0, requests: 0 };
        byModel[e.model_id].tokensPrompt += tp;
        byModel[e.model_id].tokensCompletion += tc;
        byModel[e.model_id].requests += 1;
      }
    }

    // Fill all dates in range (so chart shows continuous axis, not just days with data)
    const dailyData: Array<{ date: string; tokensPrompt: number; tokensCompletion: number; cost: number; requests: number }> = [];
    const sinceDate = since.toISOString().split('T')[0];
    const todayDate = new Date().toISOString().split('T')[0];
    let cursorDate = sinceDate;

    while (cursorDate <= todayDate) {
      dailyData.push(byDay[cursorDate]
        ? { date: cursorDate, ...byDay[cursorDate] }
        : { date: cursorDate, tokensPrompt: 0, tokensCompletion: 0, cost: 0, requests: 0 }
      );
      // Advance by 1 day using UTC
      const next = new Date(cursorDate + 'T00:00:00Z');
      next.setUTCDate(next.getUTCDate() + 1);
      cursorDate = next.toISOString().split('T')[0];
    }

    const agentData = Object.entries(byAgent)
      .map(([id, v]) => ({ id, ...v, total: v.tokensPrompt + v.tokensCompletion }))
      .sort((a, b) => b.total - a.total);

    const modelData = Object.entries(byModel)
      .map(([model, v]) => ({ model, ...v, total: v.tokensPrompt + v.tokensCompletion }))
      .sort((a, b) => b.total - a.total);

    // Workspace-level limit (agent_id is null)
    const businessLimit = limits.find((l: any) => !l.agent_id);

    // chartData for dashboard TelemetryCharts compatibility
    const chartData = dailyData.map(d => ({
      date: d.date,
      cost: parseFloat(d.cost.toFixed(4)),
      count: d.requests,
      tokens: d.tokensPrompt + d.tokensCompletion,
    }));

    return NextResponse.json({
      dailyData,
      chartData,
      agentData,
      modelData,
      totalPrompt,
      totalCompletion,
      totalTokens: totalPrompt + totalCompletion,
      totalRequests,
      workspaceLimit: businessLimit ? {
        id: businessLimit.id,
        name: businessLimit.name,
        limit: businessLimit.monthly_token_limit,
        used: businessLimit.current_tokens_used,
        alertPct: businessLimit.alert_threshold_pct,
      } : null,
      limits: limits.map((l: any) => ({
        id: l.id,
        name: l.name,
        agentId: l.agent_id,
        agentName: l.agents?.name || null,
        limit: l.monthly_token_limit,
        used: l.current_tokens_used,
        alertPct: l.alert_threshold_pct,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
