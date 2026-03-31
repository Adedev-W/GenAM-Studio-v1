import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';

export async function GET(req: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);

    // Fetch report
    const { data: report } = await supabase
      .from('audit_reports')
      .select('*')
      .eq('id', reportId)
      .eq('business_id', businessId)
      .single();

    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch audit logs for the report's date range
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('created_at, action, resource_type, resource_id, ip_address, profiles(display_name)')
      .eq('business_id', businessId)
      .gte('created_at', report.date_from)
      .lte('created_at', report.date_to)
      .order('created_at', { ascending: false })
      .limit(1000);

    // Build CSV
    const rows = [['Waktu', 'Aktor', 'Aksi', 'Resource', 'IP'].join(',')];
    for (const log of logs || []) {
      const actor = (log.profiles as any)?.display_name || '-';
      rows.push([
        new Date(log.created_at).toLocaleString('id-ID'),
        `"${actor}"`,
        log.action,
        `${log.resource_type}:${log.resource_id}`,
        log.ip_address || '-',
      ].join(','));
    }

    const csv = rows.join('\n');
    const dateStr = new Date(report.date_from).toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=audit-report-${dateStr}.csv`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
