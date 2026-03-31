import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';
import { syncProductsToAgentPrompts } from '@/lib/products/sync-prompts';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single();

    if (error) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const body = await req.json();

    // Remove fields that shouldn't be updated directly
    const { id: _id, business_id: _bs, created_at: _ca, updated_at: _ua, ...updates } = body;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync products to agent prompts
    syncProductsToAgentPrompts(supabase, businessId).catch(console.error);

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync products to agent prompts
    syncProductsToAgentPrompts(supabase, businessId).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
