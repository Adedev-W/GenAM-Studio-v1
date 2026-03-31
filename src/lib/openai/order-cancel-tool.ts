import { SupabaseClient } from '@supabase/supabase-js';

export function buildCancelOrderTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'cancel_order',
      description:
        'Batalkan pesanan pelanggan. Hanya bisa membatalkan pesanan dengan status "pending" atau "confirmed". Gunakan saat pelanggan bilang "cancel", "batalkan", atau "ga jadi".',
      parameters: {
        type: 'object',
        properties: {
          order_number: {
            type: 'string',
            description: 'Nomor pesanan (format: ORD-xxx). Jika tidak tahu, cari dari nama/HP pelanggan.',
          },
          customer_phone: {
            type: 'string',
            description: 'Nomor HP pelanggan untuk mencari pesanan jika order_number tidak diketahui',
          },
          customer_name: {
            type: 'string',
            description: 'Nama pelanggan untuk mencari pesanan jika order_number tidak diketahui',
          },
          reason: {
            type: 'string',
            description: 'Alasan pembatalan (opsional)',
          },
        },
        required: [],
      },
    },
  };
}

interface CancelOrderArgs {
  order_number?: string;
  customer_phone?: string;
  customer_name?: string;
  reason?: string;
}

const CANCELLABLE_STATUSES = ['pending', 'confirmed'];

export async function processCancelOrder(
  supabase: SupabaseClient,
  args: CancelOrderArgs,
  businessId: string,
  conversationId?: string,
): Promise<string> {
  try {
    // Find the order
    let q = supabase
      .from('orders')
      .select('id, order_number, status, subtotal, items, conversation_id, contact:contacts(display_name, phone)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (args.order_number) {
      q = q.eq('order_number', args.order_number);
    } else if (args.customer_phone) {
      q = q.eq('contacts.phone', args.customer_phone);
    } else if (args.customer_name) {
      q = q.ilike('contacts.display_name', `%${args.customer_name}%`);
    } else if (conversationId) {
      // Fallback: find latest order in this conversation
      q = q.eq('conversation_id', conversationId);
    } else {
      return 'Tidak bisa mencari pesanan. Tolong sebutkan nomor order, nama, atau nomor HP.';
    }

    const { data: orders, error } = await q;

    if (error) return `Error: ${error.message}`;
    if (!orders || orders.length === 0) return 'Pesanan tidak ditemukan.';

    const order = orders[0] as any;

    // Check if cancellable
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      const statusLabels: Record<string, string> = {
        paid: 'sudah dibayar',
        processing: 'sedang diproses',
        completed: 'sudah selesai',
        cancelled: 'sudah dibatalkan sebelumnya',
      };
      const label = statusLabels[order.status] || order.status;
      return `Pesanan ${order.order_number} tidak bisa dibatalkan karena statusnya ${label}. Silakan hubungi pemilik bisnis untuk bantuan lebih lanjut.`;
    }

    // Cancel the order
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    if (updateError) return `Gagal membatalkan pesanan: ${updateError.message}`;

    // Log status change
    await supabase.from('order_status_log').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: 'cancelled',
      note: args.reason ? `Dibatalkan pelanggan: ${args.reason}` : 'Dibatalkan oleh pelanggan via chat',
    });

    // Broadcast to conversation if available
    const convId = order.conversation_id || conversationId;
    if (convId) {
      const channel = supabase.channel(`conversation:${convId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'order_status',
        payload: {
          order_number: order.order_number,
          status: 'cancelled',
          message: `Pesanan ${order.order_number} telah dibatalkan.`,
        },
      });
      supabase.removeChannel(channel);
    }

    const items = Array.isArray(order.items)
      ? order.items.map((i: any) => `${i.qty}x ${i.name}`).join(', ')
      : '-';

    return `Pesanan ${order.order_number} berhasil dibatalkan.\n\nDetail pesanan yang dibatalkan:\n- Item: ${items}\n- Total: Rp${(order.subtotal || 0).toLocaleString('id-ID')}\n\nJika pelanggan ingin memesan lagi, silakan bantu mulai pesanan baru.`;
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}
