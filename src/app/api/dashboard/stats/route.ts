import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [agentsRes, costsRes, contactsRes, ordersRes] = await Promise.all([
      supabase.from('agents').select('status').eq('workspace_id', workspaceId),
      supabase.from('cost_entries').select('cost_usd, tokens_prompt, tokens_completion').eq('workspace_id', workspaceId).gte('created_at', todayISO),
      supabase.from('contacts').select('id, created_at').eq('workspace_id', workspaceId),
      supabase.from('orders').select('status, subtotal, created_at').eq('workspace_id', workspaceId),
    ]);

    const agents = agentsRes.data || [];
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'active').length;

    const costs = costsRes.data || [];
    const costToday = costs.reduce((sum, c) => sum + (c.cost_usd || 0), 0);
    const tokensToday = costs.reduce((sum, c) => sum + (c.tokens_prompt || 0) + (c.tokens_completion || 0), 0);
    const requestsToday = costs.length;

    const contacts = contactsRes.data || [];
    const totalContacts = contacts.length;
    const newContactsToday = contacts.filter(c => c.created_at >= todayISO).length;

    const orders = ordersRes.data || [];
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const todayOrders = orders.filter(o => o.created_at >= todayISO);
    const todayOrderCount = todayOrders.length;
    const todayRevenue = todayOrders
      .filter(o => ['paid', 'processing', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);

    return NextResponse.json({
      totalAgents,
      activeAgents,
      costToday: parseFloat(costToday.toFixed(4)),
      tokensToday,
      requestsToday,
      totalContacts,
      newContactsToday,
      pendingOrders,
      todayOrderCount,
      todayRevenue,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
