import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);

    const { data: orders } = await supabase
      .from('orders')
      .select('status, subtotal, created_at')
      .eq('workspace_id', workspaceId);

    const all = orders || [];
    const today = new Date().toISOString().split('T')[0];

    const pending = all.filter(o => o.status === 'pending').length;
    const processing = all.filter(o => o.status === 'processing').length;
    const todayOrders = all.filter(o => o.created_at?.startsWith(today));
    const todayRevenue = todayOrders
      .filter(o => ['paid', 'processing', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
    const totalCompleted = all.filter(o => o.status === 'completed').length;
    const totalRevenue = all
      .filter(o => ['paid', 'processing', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.subtotal || 0), 0);

    return NextResponse.json({
      pending,
      processing,
      todayOrders: todayOrders.length,
      todayRevenue,
      totalOrders: all.length,
      totalCompleted,
      totalRevenue,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
