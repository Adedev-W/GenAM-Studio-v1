import { SupabaseClient } from '@supabase/supabase-js';

export function buildOrderTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'create_order',
      description:
        'Buat pesanan baru untuk pelanggan. WAJIB panggil saat pelanggan sudah konfirmasi mau pesan. Tanyakan nama dan nomor HP sebelum membuat pesanan.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: {
            type: 'string',
            description: 'Nama pelanggan',
          },
          customer_phone: {
            type: 'string',
            description: 'Nomor HP/WhatsApp pelanggan',
          },
          items: {
            type: 'array',
            description: 'Daftar item yang dipesan',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Nama produk' },
                qty: { type: 'integer', description: 'Jumlah' },
                price: { type: 'number', description: 'Harga satuan dalam Rupiah' },
                note: { type: 'string', description: 'Catatan khusus item' },
              },
              required: ['name', 'qty', 'price'],
            },
          },
          notes: {
            type: 'string',
            description: 'Catatan tambahan (alamat, waktu antar, dll)',
          },
        },
        required: ['customer_name', 'items'],
      },
    },
  };
}

export const ORDER_SYSTEM_PROMPT = `
TOOL PESANAN:
Kamu memiliki tool "create_order" untuk mencatat pesanan pelanggan.

KAPAN PANGGIL create_order:
- Pelanggan sudah konfirmasi mau pesan/order/beli
- Kamu sudah tahu: nama pelanggan, item yang dipesan, dan jumlahnya
- Tanyakan nama dan nomor HP jika belum tahu

FLOW PEMESANAN:
1. Pelanggan bilang mau pesan → tanya detail (item, jumlah)
2. Konfirmasi ulang pesanan → "Jadi pesanannya: 10x Risol Mayo, 5x Risol Keju. Benar?"
3. Pelanggan konfirmasi → tanya nama dan HP jika belum ada
4. Panggil create_order dengan data lengkap
5. Tampilkan ringkasan pesanan ke pelanggan

JANGAN panggil create_order jika:
- Pelanggan masih bertanya-tanya / belum konfirmasi
- Data belum lengkap (minimal nama + items)
`;

interface OrderToolArgs {
  customer_name: string;
  customer_phone?: string;
  items: Array<{ name: string; qty: number; price: number; note?: string }>;
  notes?: string;
}

interface ProcessOrderParams {
  supabase: SupabaseClient;
  args: OrderToolArgs;
  workspaceId: string;
  agentId?: string;
  conversationId?: string;
  sessionId?: string;
}

export async function processCreateOrder({
  supabase,
  args,
  workspaceId,
  agentId,
  conversationId,
  sessionId,
}: ProcessOrderParams): Promise<{ success: boolean; order?: any; error?: string }> {
  try {
    // 1. Find or create contact
    let contactId: string | null = null;

    if (args.customer_phone) {
      // Try find by phone
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('phone', args.customer_phone)
        .limit(1)
        .single();

      if (existing) {
        contactId = existing.id;
        // Update name if needed
        await supabase
          .from('contacts')
          .update({ display_name: args.customer_name, last_seen_at: new Date().toISOString() })
          .eq('id', contactId);
      }
    }

    if (!contactId) {
      // Try find by name in workspace
      const { data: byName } = await supabase
        .from('contacts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('display_name', args.customer_name)
        .limit(1)
        .single();

      if (byName) {
        contactId = byName.id;
        if (args.customer_phone) {
          await supabase
            .from('contacts')
            .update({ phone: args.customer_phone, last_seen_at: new Date().toISOString() })
            .eq('id', contactId);
        }
      }
    }

    if (!contactId) {
      // Create new contact
      const { data: newContact } = await supabase
        .from('contacts')
        .insert({
          workspace_id: workspaceId,
          display_name: args.customer_name,
          phone: args.customer_phone || null,
          source_session_id: sessionId || null,
        })
        .select('id')
        .single();
      contactId = newContact?.id || null;
    }

    // Link contact to conversation
    if (contactId && conversationId) {
      await supabase
        .from('chat_conversations')
        .update({ contact_id: contactId })
        .eq('id', conversationId);
    }

    // 2. Calculate subtotal
    const subtotal = args.items.reduce((sum, item) => sum + item.qty * item.price, 0);

    // 3. Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        agent_id: agentId || null,
        conversation_id: conversationId || null,
        items: args.items,
        subtotal,
        notes: args.notes || null,
        status: 'pending',
      })
      .select('id, order_number, subtotal, status')
      .single();

    if (error) return { success: false, error: error.message };

    // 4. Log initial status
    await supabase.from('order_status_log').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      note: `Pesanan dari ${args.customer_name} via chat`,
    });

    return {
      success: true,
      order: {
        ...order,
        customer_name: args.customer_name,
        items: args.items,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Format order result as text for the agent to relay to customer */
export function formatOrderConfirmation(order: any, baseUrl?: string): string {
  const itemLines = order.items
    .map((item: any) => {
      const total = item.qty * item.price;
      return `${item.qty}x ${item.name} = Rp${total.toLocaleString('id-ID')}`;
    })
    .join('\n');

  const trackingUrl = baseUrl ? `${baseUrl}/order/${order.order_number}` : `/order/${order.order_number}`;

  return `Pesanan berhasil dibuat!\n\nOrder ${order.order_number}\n${itemLines}\n\nTotal: Rp${order.subtotal.toLocaleString('id-ID')}\nStatus: Menunggu konfirmasi pemilik\n\nLacak pesanan kamu di:\n${trackingUrl}\n\nPemilik akan segera mengonfirmasi pesanan kamu!`;
}
