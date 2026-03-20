import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';
import { triggerWorkflows } from '@/lib/workflows/engine';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('last_seen_at', { ascending: false });

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
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
    const { workspaceId } = await getWorkspaceContext(supabase);
    const body = await req.json();

    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...body, workspace_id: workspaceId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Trigger automasi: new_customer
    triggerWorkflows({
      type: 'new_customer',
      workspaceId,
      data: {
        id: data.id,
        display_name: data.display_name,
        email: data.email,
        phone: data.phone,
        customer: { order_count: 0 },
      },
    }).catch((err) => console.error('[Automasi] new_customer trigger failed:', err));

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
