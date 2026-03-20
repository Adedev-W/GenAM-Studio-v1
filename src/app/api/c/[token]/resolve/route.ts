import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid) return NextResponse.json({ conversationId: null, hasActiveOrder: false });

  // Validate session is public
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, is_public')
    .eq('share_token', token)
    .eq('is_active', true)
    .single();

  if (!session?.is_public) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find latest conversation by user_identifier
  const { data: conv } = await serviceClient
    .from('chat_conversations')
    .select('id')
    .eq('session_id', session.id)
    .eq('user_identifier', uid)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!conv) return NextResponse.json({ conversationId: null, hasActiveOrder: false });

  // Check if this conversation has active orders
  const { data: activeOrders } = await serviceClient
    .from('orders')
    .select('id')
    .eq('conversation_id', conv.id)
    .in('status', ['pending', 'confirmed', 'paid', 'processing'])
    .limit(1);

  return NextResponse.json({
    conversationId: conv.id,
    hasActiveOrder: (activeOrders?.length || 0) > 0,
  });
}
