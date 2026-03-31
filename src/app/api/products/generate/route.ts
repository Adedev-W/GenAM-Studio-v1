import { NextResponse } from 'next/server';
import { getBusinessOpenAIClient } from '@/lib/openai/workspace-client';

export async function POST(req: Request) {
  try {
    const { business_type, description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: 'Deskripsi bisnis wajib diisi' }, { status: 400 });
    }

    const { client: openai } = await getBusinessOpenAIClient();

    const systemPrompt = `Kamu adalah asisten yang mengekstrak informasi produk dari deskripsi bisnis.
Dari teks berikut, buat daftar produk dalam format JSON array.

Untuk setiap produk, tentukan:
- name: nama produk
- description: deskripsi singkat (1-2 kalimat)
- category: kategori (kelompokkan yang mirip)
- price: harga dalam Rupiah (angka bulat, tanpa desimal)
- price_display: jika ada range harga, tulis range-nya
- variants: jika ada pilihan (ukuran, level, paket), buat array variant dengan format [{ "name": "Nama Varian", "options": ["Opsi1", "Opsi2"], "prices": [harga1, harga2] }]
- options: jika ada tambahan (addon, topping, extra), buat array options dengan format [{ "name": "Nama Addon", "price": harga }]
- tags: tag relevan (bestseller, baru, promo, dll) — hanya jika disebutkan
- metadata: info tambahan spesifik sektor (waktu persiapan, durasi, dll)

Sektor bisnis: ${business_type || 'Umum'}

Output HANYA dalam format JSON seperti ini, tanpa markdown code block:
{
  "products": [...],
  "categories": ["Kategori1", "Kategori2"],
  "business_summary": "ringkasan singkat bisnis"
}

Jangan tambahkan produk yang tidak disebutkan.
Kelompokkan ke kategori yang masuk akal.
Harga harus angka bulat dalam Rupiah.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description },
      ],
    });

    const content = response.choices[0]?.message?.content || '{}';

    // Parse JSON from response
    let parsed;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      return NextResponse.json({ error: 'Gagal memproses hasil AI. Coba lagi.' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    const isNotConfigured = error.message?.includes('not configured');
    const status = isNotConfigured ? 503 : 500;
    return NextResponse.json(
      { error: error.message, ...(isNotConfigured && { code: 'API_KEY_NOT_CONFIGURED' }) },
      { status },
    );
  }
}
