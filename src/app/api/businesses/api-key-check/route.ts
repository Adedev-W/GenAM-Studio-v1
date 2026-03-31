import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get all businesses where user is a member
    const { data: memberships } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ has_key: false });
    }

    const businessIds = memberships.map(m => m.business_id);
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, settings')
      .in('id', businessIds);

    // Find first business with API key configured
    const withKey = (businesses || []).find(
      (b: any) => b.settings?.openai_api_key
    );

    if (!withKey) {
      return NextResponse.json({ has_key: false });
    }

    const key = (withKey.settings as any).openai_api_key as string;
    return NextResponse.json({
      has_key: true,
      business_id: withKey.id,
      business_name: withKey.name,
      hint: `****${key.slice(-4)}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
