import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';
import { getWorkspaceOpenAIClient } from '@/lib/openai/workspace-client';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data, error } = await supabase
      .from('audit_reports')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { workspaceId, userId } = await getWorkspaceContext(supabase);
    const body = await request.json();
    const { date_from, date_to } = body;

    if (!date_from || !date_to) {
      return NextResponse.json({ error: 'date_from and date_to are required' }, { status: 400 });
    }

    // Fetch audit logs for the range
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('action, resource_type, created_at, profiles(display_name)')
      .eq('workspace_id', workspaceId)
      .gte('created_at', date_from)
      .lte('created_at', date_to)
      .order('created_at', { ascending: false })
      .limit(500);

    // Fetch cost entries for the range
    const { data: costs } = await supabase
      .from('cost_entries')
      .select('cost_usd, tokens_prompt, tokens_completion, model_id')
      .eq('workspace_id', workspaceId)
      .gte('created_at', date_from)
      .lte('created_at', date_to);

    const auditLogs = logs || [];
    const costEntries = costs || [];

    // Summarize data for AI
    const actionCounts: Record<string, number> = {};
    for (const log of auditLogs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    }

    const totalCost = costEntries.reduce((s, c) => s + (c.cost_usd || 0), 0);
    const totalTokens = costEntries.reduce((s, c) => s + (c.tokens_prompt || 0) + (c.tokens_completion || 0), 0);

    const details = {
      total_logs: auditLogs.length,
      action_counts: actionCounts,
      total_cost_usd: parseFloat(totalCost.toFixed(4)),
      total_tokens: totalTokens,
      cost_entries_count: costEntries.length,
    };

    // Generate summary with OpenAI
    let summary = '';
    try {
      const { client } = await getWorkspaceOpenAIClient();
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah auditor sistem AI. Buat ringkasan audit dalam Bahasa Indonesia yang padat dan informatif. Fokus pada: aktivitas utama, penggunaan token/biaya, dan hal-hal yang perlu perhatian. Maksimal 200 kata.',
          },
          {
            role: 'user',
            content: `Data audit dari ${date_from} sampai ${date_to}:\n\nTotal log: ${auditLogs.length}\nAksi: ${JSON.stringify(actionCounts)}\nTotal token: ${totalTokens}\nTotal biaya: $${totalCost.toFixed(4)}\nJumlah request: ${costEntries.length}`,
          },
        ],
      });
      summary = completion.choices[0]?.message?.content || 'Ringkasan tidak tersedia.';
    } catch {
      // If OpenAI fails, generate basic summary
      summary = `Audit periode ${new Date(date_from).toLocaleDateString('id-ID')} - ${new Date(date_to).toLocaleDateString('id-ID')}: ${auditLogs.length} log aktivitas, ${totalTokens.toLocaleString()} token terpakai, biaya $${totalCost.toFixed(4)}.`;
    }

    // Insert report
    const { data: report, error } = await supabase
      .from('audit_reports')
      .insert({
        workspace_id: workspaceId,
        report_type: 'manual',
        date_from,
        date_to,
        summary,
        details,
        created_by: userId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
