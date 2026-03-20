import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ webhookId: string }> }) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { webhookId } = await params;
    const body = await request.json();
    const { data, error } = await supabase
      .from('webhooks')
      .update(body)
      .eq('id', webhookId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ webhookId: string }> }) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { webhookId } = await params;
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('workspace_id', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
