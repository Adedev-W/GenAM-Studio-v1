import { SupabaseClient } from '@supabase/supabase-js';

const ORDER_PARAMS = {
  type: 'object' as const,
  properties: {
    customer_name: {
      type: 'string' as const,
      description: 'Nama pelanggan',
    },
    customer_phone: {
      type: 'string' as const,
      description: 'Nomor HP/WhatsApp pelanggan',
    },
    items: {
      type: 'array' as const,
      description: 'Daftar item yang dipesan',
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const, description: 'Nama produk' },
          qty: { type: 'integer' as const, description: 'Jumlah' },
          price: { type: 'number' as const, description: 'Harga satuan dalam Rupiah' },
          note: { type: 'string' as const, description: 'Catatan khusus item' },
        },
        required: ['name', 'qty', 'price'],
      },
    },
    notes: {
      type: 'string' as const,
      description: 'Catatan tambahan (alamat, waktu antar, dll)',
    },
  },
  required: ['customer_name', 'items'],
};

export function buildPrepareOrderTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'prepare_order',
      description:
        'Siapkan ringkasan pesanan untuk dikonfirmasi pelanggan. Panggil SEBELUM membuat pesanan final. Pelanggan akan melihat kartu konfirmasi dan bisa klik "Konfirmasi" atau "Ubah".',
      parameters: ORDER_PARAMS,
    },
  };
}

export function buildOrderTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'create_order',
      description:
        'Buat pesanan final. HANYA panggil setelah pelanggan mengklik "Konfirmasi Pesanan" dari prepare_order. JANGAN panggil langsung tanpa prepare_order.',
      parameters: ORDER_PARAMS,
    },
  };
}

export const ORDER_SYSTEM_PROMPT = `
## SIKLUS PESANAN — SCOPE AGENT

Kamu adalah sales/kasir agent. Berikut siklus lengkap interaksi kamu:

### FASE 1: PEMESANAN BARU
1. Pelanggan bilang mau pesan → tanya detail (item, jumlah)
2. Tanya nama dan nomor HP jika belum tahu
3. Panggil prepare_order → pelanggan lihat ringkasan dengan tombol Konfirmasi/Ubah
4. Pelanggan klik "Konfirmasi Pesanan" → panggil create_order
5. Pelanggan bilang "ubah" → tanya perubahan, ulangi prepare_order

ATURAN: SELALU gunakan prepare_order dulu, JANGAN langsung create_order.
create_order HANYA dipanggil setelah pelanggan mengklik "Konfirmasi Pesanan".

### FASE 2: SETELAH ORDER BERHASIL (create_order selesai)
Pesanan SELESAI. Konteks pesanan sebelumnya sudah TUNTAS.

✅ YANG HARUS DILAKUKAN:
- Langsung siap melayani permintaan baru (pesan lagi, lihat menu, tanya produk, cek status, dll)
- Jika pelanggan mau pesan lagi → mulai FASE 1 dari awal (tanya item baru, nama, HP)
- Jika pelanggan minta lihat menu → panggil show_canvas dengan canvas menu/produk
- Tetap ingat nama pelanggan dari history untuk pengalaman personal
- Respons dengan teks yang jelas dan lengkap — JANGAN kirim respons kosong

❌ YANG DILARANG:
- JANGAN campurkan data pesanan lama ke pesanan baru
- JANGAN ulangi detail pesanan lama kecuali pelanggan bertanya spesifik
- JANGAN stuck/freeze — kamu HARUS selalu merespons dengan teks yang bermakna
- JANGAN kirim respons kosong (content: "") — ini FATAL, selalu tulis minimal 1 kalimat

### FASE 3: CEK STATUS
- Pelanggan tanya status pesanan → panggil check_order
- Gunakan nama/HP dari history jika pelanggan tidak menyebutkan nomor order

### FASE 4: PEMBATALAN
- Pelanggan bilang "cancel", "batalkan", "ga jadi", "tidak jadi" → panggil cancel_order
- cancel_order hanya bisa membatalkan pesanan berstatus "pending" atau "confirmed"
- Jika status sudah paid/processing/completed → sampaikan bahwa pesanan tidak bisa di-cancel, hubungi pemilik bisnis

### ATURAN KRITIS — ANTI FREEZE:
- SELALU respons dengan teks yang bermakna — JANGAN PERNAH kirim pesan kosong
- Jika kamu bingung atau tidak yakin → tanya pelanggan "Ada yang bisa saya bantu?"
- Jika tool gagal → tetap respons dengan teks yang menjelaskan situasi
- JANGAN stuck di satu konteks — setelah selesai satu flow, kamu SIAP untuk flow berikutnya
- JANGAN mengarang info yang tidak kamu punya (harga, stok, fitur produk)
- Jika pelanggan tanya di luar kemampuanmu → arahkan ke pemilik bisnis
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
  businessId: string;
  agentId?: string;
  conversationId?: string;
  sessionId?: string;
}

/**
 * Build order_confirmation widget from prepare_order args.
 * Returns widget elements to be added to canvas widgets.
 */
export function buildOrderConfirmationWidget(args: OrderToolArgs): any[] {
  const subtotal = args.items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const itemRows = args.items
    .map((item) => `${item.name},${item.qty},Rp${(item.price).toLocaleString('id-ID')},Rp${(item.qty * item.price).toLocaleString('id-ID')}`)
    .join('\n');

  return [
    {
      id: 'oc_heading',
      type: 'heading',
      label: 'Konfirmasi Pesanan',
      props: { content: 'Konfirmasi Pesanan', level: 'h3' },
    },
    {
      id: 'oc_customer',
      type: 'text',
      label: 'Info Pelanggan',
      props: {
        content: `Nama: ${args.customer_name}${args.customer_phone ? `\nHP: ${args.customer_phone}` : ''}${args.notes ? `\nCatatan: ${args.notes}` : ''}`,
        size: 'sm',
      },
    },
    {
      id: 'oc_items',
      type: 'table',
      label: 'Daftar Pesanan',
      props: {
        columns: 'Produk,Qty,Harga,Subtotal',
        rows: itemRows,
      },
    },
    {
      id: 'oc_total',
      type: 'stat',
      label: 'Total',
      props: {
        label: 'Total Pesanan',
        value: `Rp${subtotal.toLocaleString('id-ID')}`,
        trend: 'neutral',
      },
    },
    {
      id: 'oc_confirm',
      type: 'button',
      label: 'Konfirmasi',
      props: { text: 'Konfirmasi Pesanan', variant: 'default', size: 'lg', action: { type: 'order' } },
    },
    {
      id: 'oc_edit',
      type: 'button',
      label: 'Ubah',
      props: { text: 'Ubah Pesanan', variant: 'outline', size: 'default', action: { type: 'order' } },
    },
  ];
}

export async function processCreateOrder({
  supabase,
  args,
  businessId,
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
        .eq('business_id', businessId)
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
        .eq('business_id', businessId)
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
          business_id: businessId,
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
        business_id: businessId,
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
