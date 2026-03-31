import { SupabaseClient } from '@supabase/supabase-js';

const MARKER_START = '<!-- DAFTAR_PRODUK_START -->';
const MARKER_END = '<!-- DAFTAR_PRODUK_END -->';

function fmtRupiah(n: number) {
  return `Rp${n.toLocaleString('id-ID')}`;
}

export function buildProductPromptSection(products: any[]): string {
  if (products.length === 0) return '';

  const grouped: Record<string, any[]> = {};
  for (const p of products) {
    const cat = p.category || 'Lainnya';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  let lines: string[] = [
    '',
    MARKER_START,
    '## DAFTAR PRODUK YANG TERSEDIA',
    '',
  ];

  let num = 1;
  for (const [cat, items] of Object.entries(grouped)) {
    lines.push(`Kategori: ${cat}`);
    for (const p of items) {
      const status = p.is_available ? 'tersedia' : 'HABIS — informasikan ke pelanggan';
      const priceStr = p.price_display || fmtRupiah(p.price);
      let line = `${num}. ${p.name} — ${priceStr} (${status})`;
      if (p.discount_pct > 0) {
        line += ` [DISKON ${p.discount_pct}%${p.discount_note ? ` - ${p.discount_note}` : ''}]`;
      }
      lines.push(line);

      // Variants
      if (Array.isArray(p.variants)) {
        for (const v of p.variants) {
          if (v.options && v.options.length > 0) {
            const opts = v.options.map((o: string, i: number) => {
              const price = v.prices?.[i];
              return price ? `${o} (${fmtRupiah(price)})` : o;
            }).join(', ');
            lines.push(`   Pilihan ${v.name}: ${opts}`);
          }
        }
      }

      // Options/Addons
      if (Array.isArray(p.options) && p.options.length > 0) {
        const opts = p.options.map((o: any) => `${o.name} (+${fmtRupiah(o.price)})`).join(', ');
        lines.push(`   Tambahan: ${opts}`);
      }

      num++;
    }
    lines.push('');
  }

  lines.push('PENTING:');
  lines.push('- Jika pelanggan pesan produk yang HABIS, informasikan dan tawarkan alternatif.');
  lines.push('- Selalu sebut harga sesuai daftar di atas.');
  lines.push('- Jika pelanggan tanya produk yang tidak ada di daftar, bilang tidak tersedia.');
  lines.push(MARKER_END);
  lines.push('');

  return lines.join('\n');
}

export async function syncProductsToAgentPrompts(
  supabase: SupabaseClient,
  businessId: string,
): Promise<void> {
  // Fetch all products for business
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true });

  const section = buildProductPromptSection(products || []);

  // Fetch all agents for business
  const { data: agents } = await supabase
    .from('agents')
    .select('id, system_prompt')
    .eq('business_id', businessId);

  if (!agents || agents.length === 0) return;

  for (const agent of agents) {
    const prompt = agent.system_prompt || '';
    let newPrompt: string;

    if (prompt.includes(MARKER_START) && prompt.includes(MARKER_END)) {
      // Replace existing section
      const before = prompt.substring(0, prompt.indexOf(MARKER_START));
      const after = prompt.substring(prompt.indexOf(MARKER_END) + MARKER_END.length);
      newPrompt = before + section + after;
    } else {
      // Append section
      newPrompt = prompt + section;
    }

    if (newPrompt !== prompt) {
      await supabase
        .from('agents')
        .update({ system_prompt: newPrompt })
        .eq('id', agent.id);
    }
  }
}
