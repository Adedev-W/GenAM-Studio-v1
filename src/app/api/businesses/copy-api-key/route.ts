import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { source_business_id, target_business_id } = await request.json();
    if (!source_business_id || !target_business_id) {
      return NextResponse.json({ error: 'source_business_id and target_business_id required' }, { status: 400 });
    }

    // Verify user is member of both businesses
    const { data: memberships } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id)
      .in('business_id', [source_business_id, target_business_id]);

    if (!memberships || memberships.length < 2) {
      return NextResponse.json({ error: 'Not a member of both businesses' }, { status: 403 });
    }

    // Read API key from source
    const { data: source } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', source_business_id)
      .single();

    const apiKey = (source?.settings as any)?.openai_api_key;
    if (!apiKey) {
      return NextResponse.json({ error: 'Source business has no API key' }, { status: 400 });
    }

    // Read current settings from target and merge
    const { data: target } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', target_business_id)
      .single();

    const targetSettings = (target?.settings as any) || {};
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ settings: { ...targetSettings, openai_api_key: apiKey } })
      .eq('id', target_business_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
