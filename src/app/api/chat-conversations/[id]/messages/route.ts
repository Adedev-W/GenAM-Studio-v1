import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);

    // Verify conversation belongs to this workspace via chat_sessions
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('id, session_id, chat_sessions(workspace_id)')
      .eq('id', id)
      .single();

    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sessionWorkspaceId = (conv.chat_sessions as any)?.workspace_id;
    if (sessionWorkspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('id, role, content, widgets, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(100);

    return NextResponse.json(messages || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
