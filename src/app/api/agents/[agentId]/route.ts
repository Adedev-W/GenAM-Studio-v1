import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from('agents').select('*').eq('id', agentId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { data, error } = await supabase.from('agents').update(body).eq('id', agentId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('agents').delete().eq('id', agentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
