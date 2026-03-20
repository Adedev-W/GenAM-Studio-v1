import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, name, description, welcome_message, is_public, require_email, allow_multi_user, agents(name, model_id)')
    .eq('share_token', token)
    .eq('is_active', true)
    .single();
  if (error || !data) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (!data.is_public) return NextResponse.json({ error: 'This chat is private' }, { status: 403 });
  return NextResponse.json(data);
}
