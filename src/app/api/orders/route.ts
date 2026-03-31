import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';
import { triggerWorkflows } from '@/lib/workflows/engine';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const contactId = searchParams.get('contact_id');

    let query = supabase
      .from('orders')
      .select('*, contacts(display_name, email, phone)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { businessId, userId } = await getBusinessContext(supabase);
    const body = await req.json();

    // Validate and enrich items with product data
    const rawItems = body.items || [];
    const items = [];
    for (const item of rawItems) {
      if (item.product_id) {
        const { data: product } = await supabase
          .from('products')
          .select('id, name, price, is_available, stock_type, stock_quantity')
          .eq('id', item.product_id)
          .eq('business_id', businessId)
          .single();

        if (!product) {
          return NextResponse.json({ error: `Produk "${item.name || item.product_id}" tidak ditemukan` }, { status: 400 });
        }
        if (!product.is_available) {
          return NextResponse.json({ error: `Produk "${product.name}" sedang tidak tersedia` }, { status: 400 });
        }
        if (product.stock_type === 'limited' && product.stock_quantity !== null && product.stock_quantity < item.qty) {
          return NextResponse.json({ error: `Stok "${product.name}" tidak cukup (tersisa ${product.stock_quantity})` }, { status: 400 });
        }

        // Use DB price, not client price
        items.push({ ...item, name: product.name, price: product.price });
      } else {
        items.push(item);
      }
    }

    // Calculate subtotal from validated items
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0);

    const { data, error } = await supabase
      .from('orders')
      .insert({
        business_id: businessId,
        contact_id: body.contact_id,
        agent_id: body.agent_id,
        conversation_id: body.conversation_id,
        items,
        subtotal,
        notes: body.notes,
        status: 'pending',
      })
      .select('*, contacts(display_name, email, phone)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log initial status
    await supabase.from('order_status_log').insert({
      order_id: data.id,
      from_status: null,
      to_status: 'pending',
      changed_by: userId,
      note: 'Pesanan dibuat',
    });

    // Decrement stock for tracked products
    for (const item of items) {
      if (item.product_id) {
        const { data: prod } = await supabase
          .from('products')
          .select('stock_type, stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (prod && prod.stock_type === 'limited' && prod.stock_quantity !== null) {
          const newQty = Math.max(0, prod.stock_quantity - item.qty);
          await supabase
            .from('products')
            .update({
              stock_quantity: newQty,
              is_available: newQty > 0,
            })
            .eq('id', item.product_id);
        }
      }
    }

    // Trigger automasi: order_created
    triggerWorkflows({
      type: 'order_created',
      businessId,
      data: {
        id: data.id,
        order_id: data.id,
        order_number: data.order_number,
        status: 'pending',
        subtotal: data.subtotal,
        items: data.items,
        contact_id: data.contact_id,
        conversation_id: body.conversation_id,
        order: { total: data.subtotal, item_count: (data.items || []).length, status: 'pending' },
      },
    }).catch((err) => console.error('[Automasi] order_created trigger failed:', err));

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
