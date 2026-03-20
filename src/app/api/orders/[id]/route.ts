import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';
import { triggerWorkflows } from '@/lib/workflows/engine';

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: 'Pesanan kamu sudah dikonfirmasi! Silakan lakukan pembayaran.',
  paid: 'Pembayaran diterima! Pesanan akan segera diproses.',
  processing: 'Pesanan kamu sedang diproses!',
  completed: 'Pesanan selesai! Terima kasih sudah belanja.',
  cancelled: 'Pesanan dibatalkan.',
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);

    const { data, error } = await supabase
      .from('orders')
      .select('*, contacts(display_name, email, phone)')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Get status timeline
    const { data: timeline } = await supabase
      .from('order_status_log')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ ...data, timeline: timeline || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { workspaceId, userId } = await getWorkspaceContext(supabase);
    const body = await req.json();

    // Get current order for status log
    const { data: current } = await supabase
      .from('orders')
      .select('status, conversation_id')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updateData: any = { ...body, updated_at: new Date().toISOString() };

    // If marking as paid, set paid_at
    if (body.status === 'paid' && current.status !== 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*, contacts(display_name, email, phone)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log status change
    if (body.status && body.status !== current.status) {
      await supabase.from('order_status_log').insert({
        order_id: id,
        from_status: current.status,
        to_status: body.status,
        changed_by: userId,
        note: body.status_note || STATUS_MESSAGES[body.status] || null,
      });

      // Broadcast status update to customer chat
      if (current.conversation_id && STATUS_MESSAGES[body.status]) {
        const convChannel = supabase.channel(`conversation:${current.conversation_id}`);
        await convChannel.subscribe();
        await convChannel.send({
          type: 'broadcast',
          event: 'order_status',
          payload: {
            order_number: data.order_number,
            status: body.status,
            message: STATUS_MESSAGES[body.status],
          },
        });
        supabase.removeChannel(convChannel);
      }

      // Trigger automasi: order_status_changed
      triggerWorkflows({
        type: 'order_status_changed',
        workspaceId,
        data: {
          id, order_id: id,
          order_number: data.order_number,
          from_status: current.status,
          to_status: body.status,
          status: body.status,
          subtotal: data.subtotal,
          conversation_id: current.conversation_id,
          order: { total: data.subtotal, item_count: (data.items || []).length, status: body.status },
        },
      }).catch((err) => console.error('[Automasi] order_status_changed trigger failed:', err));

      // Broadcast to order tracking page
      if (data.order_number) {
        const orderChannel = supabase.channel(`order:${data.order_number}`);
        await orderChannel.subscribe();
        await orderChannel.send({
          type: 'broadcast',
          event: 'status_update',
          payload: { status: body.status, message: STATUS_MESSAGES[body.status] || null },
        });
        supabase.removeChannel(orderChannel);
      }
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { workspaceId, userId } = await getWorkspaceContext(supabase);

    // Soft cancel instead of hard delete
    const { data: current } = await supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('order_status_log').insert({
      order_id: id,
      from_status: current.status,
      to_status: 'cancelled',
      changed_by: userId,
      note: 'Pesanan dibatalkan',
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
