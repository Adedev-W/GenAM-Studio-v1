import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await getBusinessContext(supabase);

    const { data: workspace } = await supabase
      .from('businesses')
      .select('id, name, slug, plan, settings, business_type, target_market, channels, tone, created_at')
      .eq('id', ctx.businessId)
      .single();

    // Never return the openai_api_key in workspace GET
    const { openai_api_key: _omit, ...safeSettings } = workspace?.settings || {};
    return NextResponse.json({ ...workspace, settings: safeSettings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await getBusinessContext(supabase);

    const body = await request.json();
    const allowed = ['name', 'slug', 'business_type', 'target_market', 'channels', 'tone'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Handle default_model in settings
    if ('default_model' in body) {
      const { data: workspace } = await supabase
        .from('businesses')
        .select('settings')
        .eq('id', ctx.businessId)
        .single();
      updates.settings = { ...(workspace?.settings || {}), default_model: body.default_model };
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', ctx.businessId)
      .select('id, name, slug, plan, settings, business_type, target_market, channels, tone, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { openai_api_key: _omit, ...safeSettings } = data?.settings || {};
    return NextResponse.json({ ...data, settings: safeSettings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
