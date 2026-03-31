import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { buildProductPromptSection } from '@/lib/products/sync-prompts';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_business_id')
      .eq('id', user.id)
      .single();
    const businessId = profile?.active_business_id;
    if (!businessId) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // Fetch business profile (settings + business info)
    const { data: business } = await supabase
      .from('businesses')
      .select('settings, business_type, target_market, channels, tone')
      .eq('id', businessId)
      .single();
    const apiKey = (business?.settings as any)?.openai_api_key;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key belum dikonfigurasi. Silakan tambahkan di Settings → API Keys.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { product_ids, channels: reqChannels, tone: reqTone } = body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: 'Pilih minimal 1 produk' },
        { status: 400 }
      );
    }

    // Fetch selected products from DB
    const { data: selectedProducts } = await supabase
      .from('products')
      .select('*')
      .in('id', product_ids)
      .eq('business_id', businessId);

    if (!selectedProducts || selectedProducts.length === 0) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 400 }
      );
    }

    // Use business profile as defaults, override with request params
    const businessType = business?.business_type || 'Toko Online';
    const targetMarket = business?.target_market || 'Umum';
    const channelList = (reqChannels?.length ? reqChannels : business?.channels || ['Website']).join(', ');
    const tone = reqTone || business?.tone || 'Profesional & Formal';

    const toneMap: Record<string, string> = {
      'Profesional & Formal': 'profesional dan formal',
      'Santai & Akrab': 'santai, akrab, dan ramah seperti teman',
      'Semangat & Energik': 'semangat, energik, dan antusias',
    };
    const toneDesc = toneMap[tone] || 'profesional dan ramah';

    // Build product list from DB data
    const productList = selectedProducts.map((p: any) =>
      `- ${p.name}: Rp${Number(p.price).toLocaleString('id-ID')}${p.description ? ` — ${p.description}` : ''}`
    ).join('\n');

    const metaPrompt = `Kamu adalah AI yang membantu membuat konfigurasi chatbot untuk bisnis UMKM Indonesia.

Berdasarkan informasi bisnis berikut, buat konfigurasi agent AI yang lengkap:

Jenis Bisnis: ${businessType}
Target Pelanggan: ${targetMarket}
Channel Penjualan: ${channelList}
Gaya Komunikasi: ${tone}

Produk/Jasa (dari database):
${productList}

Tugas kamu: Generate output JSON dengan format PERSIS seperti berikut (jangan tambahkan teks lain di luar JSON):

{
  "name": "nama agent yang singkat dan deskriptif (contoh: Asisten Toko Batik Nusantara)",
  "description": "deskripsi satu kalimat tentang apa yang dilakukan agent ini",
  "system_prompt": "system prompt lengkap dalam Bahasa Indonesia..."
}

Untuk system_prompt, tulis dalam Bahasa Indonesia yang ${toneDesc}. System prompt harus:
1. Memperkenalkan agent sebagai asisten penjualan interaktif untuk ${businessType}
2. Menjelaskan produk/jasa berdasarkan data produk di atas (gunakan nama dan harga yang tepat)
3. Menyebutkan target pelanggan: ${targetMarket}
4. Menginstruksikan agent untuk membantu pelanggan di channel: ${channelList}
5. Menyertakan panduan gaya komunikasi yang ${toneDesc}
6. Menginstruksikan agent untuk membantu pelanggan: menjawab pertanyaan, menjelaskan produk, dan memandu proses pemesanan
7. JANGAN sertakan instruksi tentang tool (show_canvas, create_order, dll) — tool decision akan ditangani oleh sistem secara otomatis
8. JANGAN sertakan format HTML, widget, atau formatting khusus apapun — agent hanya merespons dengan teks biasa
9. Fokus pada IDENTITAS agent dan PENGETAHUAN PRODUK saja
10. Panjang system prompt minimal 200 kata, komprehensif

Pastikan output adalah JSON valid, tidak ada markdown, tidak ada penjelasan tambahan.`;

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Kamu adalah AI yang menghasilkan konfigurasi chatbot bisnis. Selalu kembalikan output sebagai JSON valid tanpa markdown code block.',
        },
        { role: 'user', content: metaPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Gagal memproses respons AI' }, { status: 500 });
    }

    // Build product section from all selected products
    const productSection = buildProductPromptSection(selectedProducts);

    const result = {
      name: parsed.name || `Asisten ${businessType}`,
      description:
        parsed.description || `Agent AI untuk membantu pelanggan ${businessType}`,
      system_prompt: (parsed.system_prompt || '') + productSection,
    };

    // Save agent_products relations
    // First delete existing relations for this agent
    await supabase
      .from('agent_products')
      .delete()
      .eq('agent_id', agentId);

    // Insert new relations
    if (product_ids.length > 0) {
      await supabase
        .from('agent_products')
        .insert(product_ids.map((pid: string) => ({ agent_id: agentId, product_id: pid })));
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[generate agent]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
