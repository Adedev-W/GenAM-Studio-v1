import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

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
      .select('workspace_id')
      .eq('id', user.id)
      .single();
    const workspaceId = profile?.workspace_id;
    if (!workspaceId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single();
    const apiKey = (workspace?.settings as any)?.openai_api_key;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key belum dikonfigurasi. Silakan tambahkan di Settings → API Keys.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { business_type, products, target_market, channels, tone, product_images } = body;

    if (!business_type || !products) {
      return NextResponse.json(
        { error: 'business_type dan products wajib diisi' },
        { status: 400 }
      );
    }

    const channelList = Array.isArray(channels) ? channels.join(', ') : channels || 'Website';
    const toneMap: Record<string, string> = {
      'Profesional & Formal': 'profesional dan formal',
      'Santai & Akrab': 'santai, akrab, dan ramah seperti teman',
      'Semangat & Energik': 'semangat, energik, dan antusias',
    };
    const toneDesc = toneMap[tone] || 'profesional dan ramah';

    const imageList = Array.isArray(product_images) ? product_images.filter((img: any) => img.url) : [];
    const imageSection = imageList.length > 0
      ? `\nFoto Produk Tersedia (embed URL ini dalam system_prompt):\n${imageList.map((img: any, i: number) =>
          `${i + 1}. ${img.name || `Produk ${i + 1}`}${img.description ? ` — ${img.description}` : ''}: ${img.url}`
        ).join('\n')}\n`
      : '';

    const metaPrompt = `Kamu adalah AI yang membantu membuat konfigurasi chatbot untuk bisnis UMKM Indonesia.

Berdasarkan informasi bisnis berikut, buat konfigurasi agent AI yang lengkap:

Jenis Bisnis: ${business_type}
Produk/Jasa: ${products}
Target Pelanggan: ${target_market || 'Umum'}
Channel Penjualan: ${channelList}
Gaya Komunikasi: ${tone || 'Profesional & Formal'}
${imageSection}

Tugas kamu: Generate output JSON dengan format PERSIS seperti berikut (jangan tambahkan teks lain di luar JSON):

{
  "name": "nama agent yang singkat dan deskriptif (contoh: Asisten Toko Batik Nusantara)",
  "description": "deskripsi satu kalimat tentang apa yang dilakukan agent ini",
  "system_prompt": "system prompt lengkap dalam Bahasa Indonesia...",
  "suggested_widgets": ["stat", "list", "card"]
}

Untuk system_prompt, tulis dalam Bahasa Indonesia yang ${toneDesc}. System prompt harus:
1. Memperkenalkan agent sebagai asisten untuk ${business_type}
2. Menjelaskan produk/jasa: ${products}
3. Menyebutkan target pelanggan: ${target_market || 'umum'}
4. Menginstruksikan agent untuk membantu pelanggan di channel: ${channelList}
5. Menyertakan panduan gaya komunikasi yang ${toneDesc}
6. Menginstruksikan agent untuk memberikan informasi harga, stok, cara pemesanan jika ditanya
7. Sertakan instruksi widget EKSPLISIT dengan contoh format nyata berdasarkan produk bisnis ini. Instruksi harus mencakup:
   - Kapan pakai widget list: "Ketika pelanggan minta lihat produk/menu, tampilkan dengan format: <widget>{"type":"list","label":"Produk Kami","props":{"items":"[contoh item dari ${products.split('\n')[0] || 'produk bisnis'}]"}}</widget>"
   - Kapan pakai widget stat: "Ketika menyebutkan harga atau paket spesial, gunakan: <widget>{"type":"stat","label":"Harga","props":{"label":"[nama produk]","value":"[harga]","trend":"up"}}</widget>"
   - Kapan pakai widget alert: "Untuk promo atau pengumuman penting: <widget>{"type":"alert","label":"Info","props":{"title":"[judul]","message":"[isi]","type":"success"}}</widget>"
   - Kapan pakai widget card: "Untuk detail satu produk: <widget>{"type":"card","label":"Detail","props":{"title":"[nama]","subtitle":"[kategori]","body":"[deskripsi + harga]"}}</widget>"
   - Tekankan: JSON harus valid, gunakan \\n untuk baris baru dalam items
${imageList.length > 0 ? `8. Sertakan instruksi widget IMAGE untuk setiap foto produk yang tersedia. Contoh:\n   "Untuk menampilkan foto produk, gunakan: <widget>{\\"type\\":\\"image\\",\\"label\\":\\"Foto ${imageList[0]?.name || 'Produk'}\\",\\"props\\":{\\"url\\":\\"${imageList[0]?.url || ''}\\",\\"alt\\":\\"${imageList[0]?.name || ''}\\",\\"caption\\":\\"${imageList[0]?.description || ''}\\"}}</widget>"\n   Embed URL foto yang sudah diberikan di atas langsung ke dalam system_prompt.\n9. Panjang system prompt minimal 300 kata, komprehensif dengan contoh widget yang sudah diisi sesuai bisnis` : '8. Panjang system prompt minimal 300 kata, komprehensif dengan contoh widget yang sudah diisi sesuai bisnis'}

Untuk suggested_widgets, pilih 3-5 widget yang paling relevan dari daftar ini: stat, table, list, bar_chart, line_chart, pie_chart, badge, alert, code, card
Contoh: untuk toko online -> ["list", "card", "stat", "badge"], untuk restoran -> ["list", "card", "alert"]

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

    const result = {
      name: parsed.name || `Asisten ${business_type}`,
      description:
        parsed.description || `Agent AI untuk membantu pelanggan ${business_type}`,
      system_prompt: parsed.system_prompt || '',
      suggested_widgets: Array.isArray(parsed.suggested_widgets)
        ? parsed.suggested_widgets
        : ['list', 'card', 'stat'],
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[generate agent]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
