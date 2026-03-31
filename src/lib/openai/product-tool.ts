import { SupabaseClient } from '@supabase/supabase-js';

export function buildProductSearchTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'search_products',
      description:
        'Cari produk dari database bisnis. Gunakan saat pelanggan tanya produk spesifik, cari berdasarkan harga, atau tanya ketersediaan.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Kata kunci pencarian nama produk (opsional)',
          },
          category: {
            type: 'string',
            description: 'Filter berdasarkan kategori produk (opsional)',
          },
          max_price: {
            type: 'number',
            description: 'Harga maksimum dalam Rupiah (opsional)',
          },
          is_available: {
            type: 'boolean',
            description: 'Filter hanya produk yang tersedia (default: true)',
          },
        },
        required: [],
      },
    },
  };
}

interface ProductSearchArgs {
  query?: string;
  category?: string;
  max_price?: number;
  is_available?: boolean;
}

export async function processProductSearch(
  supabase: SupabaseClient,
  args: ProductSearchArgs,
  businessId: string,
): Promise<string> {
  try {
    let q = supabase
      .from('products')
      .select('name, description, category, price, price_display, discount_pct, discount_note, is_available, stock_type, stock_quantity, variants, options')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .limit(20);

    if (args.is_available !== false) {
      q = q.eq('is_available', true);
    }
    if (args.category) {
      q = q.ilike('category', `%${args.category}%`);
    }
    if (args.max_price) {
      q = q.lte('price', args.max_price);
    }
    if (args.query) {
      q = q.ilike('name', `%${args.query}%`);
    }

    const { data: products, error } = await q;

    if (error) return `Error: ${error.message}`;
    if (!products || products.length === 0) return 'Tidak ada produk yang cocok ditemukan.';

    // Format as structured text for LLM to compose
    const lines = products.map((p, i) => {
      let line = `${i + 1}. ${p.name}`;
      if (p.category) line += ` [${p.category}]`;
      line += ` — Rp${p.price.toLocaleString('id-ID')}`;
      if (p.discount_pct > 0) line += ` (diskon ${p.discount_pct}%${p.discount_note ? ': ' + p.discount_note : ''})`;
      if (!p.is_available) line += ' (HABIS)';
      if (p.stock_type === 'limited' && p.stock_quantity !== null) line += ` | Stok: ${p.stock_quantity}`;
      if (p.description) line += `\n   ${p.description}`;
      if (p.variants?.length > 0) {
        const varStr = p.variants.map((v: any) => `${v.name}: ${v.options.join(', ')}`).join('; ');
        line += `\n   Varian: ${varStr}`;
      }
      if (p.options?.length > 0) {
        const optStr = p.options.map((o: any) => `${o.name} (+Rp${o.price.toLocaleString('id-ID')})`).join(', ');
        line += `\n   Opsi: ${optStr}`;
      }
      return line;
    });

    return `Ditemukan ${products.length} produk:\n${lines.join('\n')}`;
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}
