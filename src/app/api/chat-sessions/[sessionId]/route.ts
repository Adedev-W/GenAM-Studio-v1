import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, agents(name, model_id, system_prompt, temperature, model_provider)')
      .eq('id', sessionId)
      .eq('business_id', businessId)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const body = await req.json();
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('business_id', businessId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    await supabase.from('chat_sessions').delete().eq('id', sessionId).eq('business_id', businessId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
