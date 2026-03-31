import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check user is owner of this business
    const { data: membership } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Hanya owner yang bisa menghapus bisnis' }, { status: 403 });
    }

    // Check user has more than one business
    const { data: allMemberships } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id);

    if (!allMemberships || allMemberships.length <= 1) {
      return NextResponse.json({ error: 'Tidak bisa menghapus bisnis terakhir' }, { status: 400 });
    }

    // Find a replacement business to switch to
    const replacementId = allMemberships.find(m => m.business_id !== businessId)!.business_id;

    // Delete business_members for this business
    await supabase
      .from('business_members')
      .delete()
      .eq('business_id', businessId);

    // Delete the business
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Switch active business if the deleted one was active
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_business_id')
      .eq('id', user.id)
      .single();

    if (profile?.active_business_id === businessId) {
      await supabase
        .from('profiles')
        .update({ active_business_id: replacementId })
        .eq('id', user.id);
    }

    return NextResponse.json({ success: true, replacement_business_id: replacementId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
