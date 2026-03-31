import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';
import OpenAI from 'openai';

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await getBusinessContext(supabase);

    const { data: workspace } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', ctx.businessId)
      .single();

    const apiKey: string | undefined = workspace?.settings?.openai_api_key;
    const configured = Boolean(apiKey);
    const hint = configured ? `sk-...${apiKey!.slice(-4)}` : null;

    return NextResponse.json({ openai_configured: configured, openai_key_hint: hint });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await getBusinessContext(supabase);

    const { openai_api_key } = await request.json();
    if (!openai_api_key || typeof openai_api_key !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Validate key against OpenAI before saving
    try {
      const testClient = new OpenAI({ apiKey: openai_api_key });
      await testClient.models.list();
    } catch {
      return NextResponse.json({ error: 'Invalid OpenAI API key. Please check your key and try again.' }, { status: 400 });
    }

    // Fetch current settings and merge
    const { data: workspace } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', ctx.businessId)
      .single();

    const currentSettings = workspace?.settings || {};
    const { error } = await supabase
      .from('businesses')
      .update({ settings: { ...currentSettings, openai_api_key } })
      .eq('id', ctx.businessId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, hint: `sk-...${openai_api_key.slice(-4)}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const ctx = await getBusinessContext(supabase);

    const { data: workspace } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', ctx.businessId)
      .single();

    const { openai_api_key: _removed, ...rest } = workspace?.settings || {};
    const { error } = await supabase
      .from('businesses')
      .update({ settings: rest })
      .eq('id', ctx.businessId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
