import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function GET(_: Request, { params }: { params: Promise<{ layoutId: string }> }) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { layoutId } = await params;
    const { data, error } = await supabase
      .from('canvas_layouts')
      .select('*')
      .eq('id', layoutId)
      .eq('workspace_id', workspaceId)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ layoutId: string }> }) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { layoutId } = await params;
    const body = await request.json();
    const { elements, ...rest } = body;
    const updateData: any = { ...rest, updated_at: new Date().toISOString() };
    if (elements !== undefined) {
      updateData.layout_json = { elements };
    }
    const { data, error } = await supabase
      .from('canvas_layouts')
      .update(updateData)
      .eq('id', layoutId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ layoutId: string }> }) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { layoutId } = await params;
    const { error } = await supabase
      .from('canvas_layouts')
      .delete()
      .eq('id', layoutId)
      .eq('workspace_id', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
