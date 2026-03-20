import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { searchParams } = new URL(req.url);
  const userIdentifier = searchParams.get('user') || 'anonymous';

  const supabase = await createClient();

  // Get session by token
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, is_public, workflow_id, require_email, workspace_id')
    .eq('share_token', token)
    .eq('is_active', true)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (!session.is_public) return NextResponse.json({ error: 'This chat is private' }, { status: 403 });
  if (!session.workflow_id) return NextResponse.json({ error: 'No workflow configured for this chat' }, { status: 400 });

  // Get workspace API key
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: workspace } = await serviceClient
    .from('workspaces')
    .select('settings')
    .eq('id', session.workspace_id)
    .single();

  const apiKey = (workspace?.settings as any)?.openai_api_key;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured for this workspace' }, { status: 503 });

  // Create ChatKit session
  const openai = new OpenAI({ apiKey });
  const chatSession = await openai.beta.chatkit.sessions.create({
    user: userIdentifier,
    workflow: { id: session.workflow_id },
  });

  return NextResponse.json({ client_secret: chatSession.client_secret });
}
