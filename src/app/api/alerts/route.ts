import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('alerts')
      .select('*, agents(name)')
      .eq('business_id', businessId)
      .order('triggered_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { businessId, userId } = await getBusinessContext(supabase);
    const body = await request.json();
    const { data, error } = await supabase
      .from('alerts')
      .insert({ ...body, business_id: businessId, created_by: userId })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
