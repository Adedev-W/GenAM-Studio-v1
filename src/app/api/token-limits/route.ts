import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { data, error } = await supabase
      .from('token_limits')
      .select('*, agents(name)')
      .eq('business_id', businessId)
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
    const { businessId } = await getBusinessContext(supabase);
    const body = await request.json();
    const { data, error } = await supabase
      .from('token_limits')
      .insert({
        business_id: businessId,
        name: body.name,
        agent_id: body.agent_id || null,
        monthly_token_limit: body.monthly_token_limit,
        alert_threshold_pct: body.alert_threshold_pct ?? 80,
        is_active: true,
      })
      .select('*, agents(name)')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
