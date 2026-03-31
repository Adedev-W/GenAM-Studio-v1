import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);

    const todayISO = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    const [agentsRes, costsRes, contactsRes, ordersRes] = await Promise.all([
      supabase.from('agents').select('status').eq('business_id', businessId),
      supabase.from('cost_entries').select('cost_usd, tokens_prompt, tokens_completion').eq('business_id', businessId).gte('created_at', todayISO),
      supabase.from('contacts').select('id, created_at').eq('business_id', businessId),
      supabase.from('orders').select('status, subtotal, created_at').eq('business_id', businessId),
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
    const newContactsToday = contacts.filter(c => new Date(c.created_at) >= new Date(todayISO)).length;

    const orders = ordersRes.data || [];
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const todayOrders = orders.filter(o => new Date(o.created_at) >= new Date(todayISO));
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
