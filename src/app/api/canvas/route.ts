import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { data, error } = await supabase
      .from('canvas_layouts')
      .select('*')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false });
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
    const { elements, ...rest } = body;
    const { data, error } = await supabase
      .from('canvas_layouts')
      .insert({
        ...rest,
        layout_json: { elements: elements || [] },
        business_id: businessId,
        created_by: userId,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
