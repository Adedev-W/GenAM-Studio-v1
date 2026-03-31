import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('active_business_id').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'No business' }, { status: 404 });

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('business_id', profile.active_business_id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('active_business_id').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'No business' }, { status: 404 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('agents')
    .insert({
      ...body,
      business_id: profile.active_business_id,
      created_by: user.id,
      slug: body.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
