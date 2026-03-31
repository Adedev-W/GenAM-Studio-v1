import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getBusinessContext } from '@/lib/queries/helpers';

/** Verify conversation belongs to business, return conv + session_id */
async function verifyConversation(supabase: any, id: string, businessId: string) {
  const { data: conv } = await supabase
    .from('chat_conversations')
    .select('id, session_id, chat_sessions(business_id)')
    .eq('id', id)
    .single();

  if (!conv) return null;

  const sessionBusinessId = (conv.chat_sessions as any)?.business_id;
  if (sessionBusinessId !== businessId) return null;

  return conv;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);

    const conv = await verifyConversation(supabase, id, businessId);
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('id, role, content, widgets, sender_type, sender_id, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(100);

    return NextResponse.json(messages || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { businessId, userId } = await getBusinessContext(supabase);
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const conv = await verifyConversation(supabase, id, businessId);
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Save owner message — role 'assistant' so customer sees it as a reply
    const { data: saved, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: id,
        session_id: conv.session_id,
        role: 'assistant',
        content: content.trim(),
        sender_type: 'owner',
        sender_id: userId,
      })
      .select('id, role, content, sender_type, sender_id, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Broadcast to customer's chat UI via Realtime
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await serviceClient
      .channel(`conversation:${id}`)
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          id: saved.id,
          role: 'assistant',
          content: saved.content,
          sender_type: 'owner',
          widgets: [],
        },
      });

    return NextResponse.json(saved);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
