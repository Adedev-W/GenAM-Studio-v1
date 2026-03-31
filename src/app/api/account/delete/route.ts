import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (body.confirmation !== 'HAPUS AKUN SAYA') {
      return NextResponse.json(
        { error: 'Konfirmasi tidak valid. Ketik "HAPUS AKUN SAYA" untuk melanjutkan.' },
        { status: 400 }
      );
    }

    const { error } = await supabase.rpc('delete_user_account', {
      target_user_id: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
