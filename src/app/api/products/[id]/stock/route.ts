import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const body = await req.json();

    // action: 'set' | 'increment' | 'decrement'
    const { action = 'set', value } = body;
    if (typeof value !== 'number') {
      return NextResponse.json({ error: 'value harus berupa angka' }, { status: 400 });
    }

    // Fetch current product
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('stock_type, stock_quantity')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();

    if (fetchErr || !product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    let newQty: number;
    if (action === 'set') {
      newQty = value;
    } else if (action === 'increment') {
      newQty = (product.stock_quantity || 0) + value;
    } else if (action === 'decrement') {
      newQty = (product.stock_quantity || 0) - value;
    } else {
      return NextResponse.json({ error: 'action harus set, increment, atau decrement' }, { status: 400 });
    }

    if (newQty < 0) newQty = 0;

    const { data, error } = await supabase
      .from('products')
      .update({
        stock_quantity: newQty,
        is_available: newQty > 0 || product.stock_type === 'unlimited',
      })
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
