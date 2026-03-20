import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await getWorkspaceContext(supabase);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, role, created_at')
      .eq('id', ctx.userId)
      .single();

    return NextResponse.json({ ...profile, email: user?.email });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await getWorkspaceContext(supabase);

    const body = await request.json();
    const allowed = ['display_name', 'avatar_url'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', ctx.userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
