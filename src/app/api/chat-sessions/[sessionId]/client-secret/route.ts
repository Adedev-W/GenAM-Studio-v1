import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';
import { getWorkspaceOpenAIClient } from '@/lib/openai/workspace-client';

export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const userIdentifier = searchParams.get('user') || 'workspace-user';

    const supabase = await createClient();
    const { workspaceId, userId } = await getWorkspaceContext(supabase);

    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id, workflow_id')
      .eq('id', sessionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (!session.workflow_id) return NextResponse.json({ error: 'No workflow configured' }, { status: 400 });

    const { client: openai } = await getWorkspaceOpenAIClient();
    const chatSession = await openai.beta.chatkit.sessions.create({
      user: userIdentifier || userId,
      workflow: { id: session.workflow_id },
    });

    return NextResponse.json({ client_secret: chatSession.client_secret });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
