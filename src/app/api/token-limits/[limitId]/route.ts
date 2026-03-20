import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ limitId: string }> }) {
  try {
    const { limitId } = await params;
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const body = await request.json();
    const { data, error } = await supabase
      .from('token_limits')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', limitId)
      .eq('workspace_id', workspaceId)
      .select('*, agents(name)')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ limitId: string }> }) {
  try {
    const { limitId } = await params;
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { error } = await supabase
      .from('token_limits')
      .delete()
      .eq('id', limitId)
      .eq('workspace_id', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
