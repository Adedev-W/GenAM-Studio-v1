import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';
import { syncProductsToAgentPrompts } from '@/lib/products/sync-prompts';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const body = await req.json();

    const products = body.products;
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'products harus berupa array yang tidak kosong' }, { status: 400 });
    }

    const rows = products.map((p: any) => ({
      business_id: businessId,
      name: p.name,
      description: p.description || null,
      category: p.category || null,
      image_url: p.image_url || null,
      images: p.images || [],
      price: p.price || 0,
      price_display: p.price_display || null,
      discount_pct: p.discount_pct || 0,
      discount_note: p.discount_note || null,
      is_available: p.is_available ?? true,
      stock_type: p.stock_type || 'unlimited',
      stock_quantity: p.stock_quantity ?? null,
      low_stock_alert: p.low_stock_alert ?? 5,
      variants: p.variants || [],
      options: p.options || [],
      metadata: p.metadata || {},
      sort_order: p.sort_order || 0,
      tags: p.tags || [],
    }));

    const { data, error } = await supabase
      .from('products')
      .insert(rows)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync products to agent prompts
    syncProductsToAgentPrompts(supabase, businessId).catch(console.error);

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
