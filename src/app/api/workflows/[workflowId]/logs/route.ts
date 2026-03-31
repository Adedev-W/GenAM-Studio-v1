import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET(_: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { workflowId } = await params;

    const { data, error } = await supabase
      .from('workflow_logs')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('business_id', businessId)
      .order('executed_at', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
