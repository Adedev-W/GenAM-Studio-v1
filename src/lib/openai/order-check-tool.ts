import { SupabaseClient } from '@supabase/supabase-js';

export function buildOrderCheckTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'check_order',
      description:
        'Cek status pesanan pelanggan. Gunakan saat pelanggan tanya status pesanan, sebut nomor order, atau tanya "pesanan saya gimana".',
      parameters: {
        type: 'object',
        properties: {
          order_number: {
            type: 'string',
            description: 'Nomor pesanan (format: ORD-xxx)',
          },
          customer_phone: {
            type: 'string',
            description: 'Nomor HP pelanggan untuk mencari pesanan',
          },
          customer_name: {
            type: 'string',
            description: 'Nama pelanggan untuk mencari pesanan',
          },
        },
        required: [],
      },
    },
  };
}

interface OrderCheckArgs {
  order_number?: string;
  customer_phone?: string;
  customer_name?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu konfirmasi',
  confirmed: 'Dikonfirmasi',
  processing: 'Sedang diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

export async function processOrderCheck(
  supabase: SupabaseClient,
  args: OrderCheckArgs,
  businessId: string,
): Promise<string> {
  try {
    // Build query based on available identifiers
    let q = supabase
      .from('orders')
      .select('order_number, status, items, subtotal, notes, created_at, contact:contacts(display_name, phone)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (args.order_number) {
      q = q.eq('order_number', args.order_number);
    } else if (args.customer_phone) {
      q = q.eq('contacts.phone', args.customer_phone);
    } else if (args.customer_name) {
      q = q.ilike('contacts.display_name', `%${args.customer_name}%`);
    } else {
      return 'Tidak bisa mencari pesanan tanpa nomor order, nama, atau nomor HP.';
    }

    const { data: orders, error } = await q;

    if (error) return `Error: ${error.message}`;
    if (!orders || orders.length === 0) return 'Pesanan tidak ditemukan.';

    const lines = orders.map((o: any) => {
      const status = STATUS_LABELS[o.status] || o.status;
      const items = Array.isArray(o.items)
        ? o.items.map((i: any) => `${i.qty}x ${i.name}`).join(', ')
        : '-';
      const contact = o.contact;
      const name = contact?.display_name || '-';
      const date = new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      return `Order ${o.order_number} (${date})
  Pelanggan: ${name}
  Item: ${items}
  Total: Rp${(o.subtotal || 0).toLocaleString('id-ID')}
  Status: ${status}${o.notes ? `\n  Catatan: ${o.notes}` : ''}`;
    });

    return lines.join('\n\n');
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}
