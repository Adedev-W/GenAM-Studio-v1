import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { data, error } = await supabase
      .from('budgets')
      .select('*, agents(name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
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
    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...body, workspace_id: workspaceId, created_by: userId })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
