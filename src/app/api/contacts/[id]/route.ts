import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Get order history
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, subtotal, items, created_at')
      .eq('contact_id', id)
      .order('created_at', { ascending: false });

    // Get conversations
    const { data: conversations } = await supabase
      .from('chat_conversations')
      .select('id, session_id, created_at, chat_sessions(name)')
      .eq('contact_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ ...data, orders: orders || [], conversations: conversations || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const body = await req.json();

    const { data, error } = await supabase
      .from('contacts')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
