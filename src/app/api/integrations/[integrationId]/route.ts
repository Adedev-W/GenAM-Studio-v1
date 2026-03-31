import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ integrationId: string }> }) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { integrationId } = await params;
    const body = await request.json();
    const { data, error } = await supabase
      .from('integrations')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', integrationId)
      .eq('business_id', businessId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ integrationId: string }> }) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { integrationId } = await params;
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', integrationId)
      .eq('business_id', businessId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
