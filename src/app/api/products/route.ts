import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';
import { syncProductsToAgentPrompts } from '@/lib/products/sync-prompts';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const available = searchParams.get('available');
    const search = searchParams.get('search');

    let query = supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (available === 'true') query = query.eq('is_available', true);
    if (available === 'false') query = query.eq('is_available', false);
    if (search) query = query.ilike('name', `%${search}%`);

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
    const { businessId } = await getBusinessContext(supabase);
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        business_id: businessId,
        name: body.name,
        description: body.description || null,
        category: body.category || null,
        image_url: body.image_url || null,
        images: body.images || [],
        price: body.price || 0,
        price_display: body.price_display || null,
        discount_pct: body.discount_pct || 0,
        discount_note: body.discount_note || null,
        is_available: body.is_available ?? true,
        stock_type: body.stock_type || 'unlimited',
        stock_quantity: body.stock_quantity ?? null,
        low_stock_alert: body.low_stock_alert ?? 5,
        variants: body.variants || [],
        options: body.options || [],
        metadata: body.metadata || {},
        sort_order: body.sort_order || 0,
        tags: body.tags || [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync products to agent prompts (fire and forget)
    syncProductsToAgentPrompts(supabase, businessId).catch(console.error);

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
