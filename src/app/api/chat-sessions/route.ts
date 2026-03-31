import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, agents(name, model_id)')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { businessId, userId } = await getBusinessContext(supabase);
    const body = await req.json();
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ ...body, business_id: businessId, created_by: userId })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
