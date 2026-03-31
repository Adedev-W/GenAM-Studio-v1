import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function POST(_: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { workflowId } = await params;

    // Get current state
    const { data: current, error: fetchErr } = await supabase
      .from('workflows')
      .select('is_active')
      .eq('id', workflowId)
      .eq('business_id', businessId)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Automasi tidak ditemukan' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('workflows')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', workflowId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
