import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: memberships } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json([]);
    }

    const businessIds = memberships.map(m => m.business_id);
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, slug, plan, business_type, target_market, channels, tone')
      .in('id', businessIds);

    return NextResponse.json(businesses || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, business_type, description } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Pre-generate ID so we can INSERT without needing .select() (RLS SELECT requires business_members first)
    const businessId = crypto.randomUUID();

    // Create business (no .select() chain — RLS SELECT requires business_members first)
    const { error: bizError } = await supabase
      .from('businesses')
      .insert({ id: businessId, name, slug, business_type: business_type || null, description: description || null, plan: 'free', settings: {} });

    if (bizError) return NextResponse.json({ error: bizError.message }, { status: 500 });

    // Add user as owner (must happen before any SELECT on businesses due to RLS)
    const { error: memberError } = await supabase
      .from('business_members')
      .insert({ business_id: businessId, user_id: user.id, role: 'owner' });

    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

    // Set as active business
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ active_business_id: businessId })
      .eq('id', user.id);

    if (profileError) return NextResponse.json({ error: `Bisnis dibuat tapi gagal diaktifkan: ${profileError.message}` }, { status: 500 });

    // Now we can read the full business (RLS passes because business_members exists)
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    return NextResponse.json(business, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
