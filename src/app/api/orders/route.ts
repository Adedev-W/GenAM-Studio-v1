import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';
import { triggerWorkflows } from '@/lib/workflows/engine';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const contactId = searchParams.get('contact_id');

    let query = supabase
      .from('orders')
      .select('*, contacts(display_name, email, phone)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { workspaceId, userId } = await getWorkspaceContext(supabase);
    const body = await req.json();

    // Calculate subtotal from items
    const items = body.items || [];
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0);

    const { data, error } = await supabase
      .from('orders')
      .insert({
        workspace_id: workspaceId,
        contact_id: body.contact_id,
        agent_id: body.agent_id,
        conversation_id: body.conversation_id,
        items,
        subtotal,
        notes: body.notes,
        status: 'pending',
      })
      .select('*, contacts(display_name, email, phone)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log initial status
    await supabase.from('order_status_log').insert({
      order_id: data.id,
      from_status: null,
      to_status: 'pending',
      changed_by: userId,
      note: 'Pesanan dibuat',
    });

    // Trigger automasi: order_created
    triggerWorkflows({
      type: 'order_created',
      workspaceId,
      data: {
        id: data.id,
        order_id: data.id,
        order_number: data.order_number,
        status: 'pending',
        subtotal: data.subtotal,
        items: data.items,
        contact_id: data.contact_id,
        conversation_id: body.conversation_id,
        order: { total: data.subtotal, item_count: (data.items || []).length, status: 'pending' },
      },
    }).catch((err) => console.error('[Automasi] order_created trigger failed:', err));

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
