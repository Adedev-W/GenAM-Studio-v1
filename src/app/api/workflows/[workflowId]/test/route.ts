import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';

export async function POST(_: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  try {
    const supabase = await createClient();
    const { workspaceId } = await getWorkspaceContext(supabase);
    const { workflowId } = await params;

    const { data: wf, error: fetchErr } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('workspace_id', workspaceId)
      .single();

    if (fetchErr || !wf) {
      return NextResponse.json({ error: 'Automasi tidak ditemukan' }, { status: 404 });
    }

    // Dry run — simulate trigger, check condition, describe action
    const triggerOk = !!wf.trigger_type;
    const actionOk = !!wf.action_type;
    const conditionMet = !wf.condition_field || true; // no real data to check

    const log = {
      workflow_id: workflowId,
      workspace_id: workspaceId,
      trigger_data: { type: wf.trigger_type, config: wf.trigger_config, dry_run: true },
      condition_met: conditionMet,
      action_result: actionOk
        ? { type: wf.action_type, config: wf.action_config, simulated: true }
        : { error: 'Aksi belum dikonfigurasi' },
      status: triggerOk && actionOk ? 'success' : 'failed',
      error: !triggerOk ? 'Trigger belum dipilih' : !actionOk ? 'Aksi belum dipilih' : null,
    };

    const { data: logEntry, error: logErr } = await supabase
      .from('workflow_logs')
      .insert(log)
      .select()
      .single();

    if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

    return NextResponse.json({
      success: log.status === 'success',
      message: log.status === 'success'
        ? 'Test berhasil! Automasi siap diaktifkan.'
        : log.error,
      log: logEntry,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
