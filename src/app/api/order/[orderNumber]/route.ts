import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;

  const { data: order, error } = await serviceClient
    .from('orders')
    .select('id, order_number, status, items, subtotal, notes, created_at, updated_at')
    .eq('order_number', orderNumber)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
  }

  // Get status timeline
  const { data: timeline } = await serviceClient
    .from('order_status_log')
    .select('from_status, to_status, note, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    order_number: order.order_number,
    status: order.status,
    items: order.items,
    subtotal: order.subtotal,
    notes: order.notes,
    created_at: order.created_at,
    updated_at: order.updated_at,
    timeline: timeline || [],
  });
}
