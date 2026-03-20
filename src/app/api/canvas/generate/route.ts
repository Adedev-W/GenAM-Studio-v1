import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/queries/helpers';
import OpenAI from 'openai';

const EXAMPLE_OUTPUT = JSON.stringify({
  name: "Menu Restoran Sederhana",
  description: "Daftar menu makanan dan minuman dengan harga",
  elements: [
    { id: "el_1", type: "heading", label: "Header", props: { content: "Menu Kami", level: "h2" } },
    { id: "el_2", type: "badge", label: "Promo", props: { text: "Promo Hari Ini!", color: "amber" } },
    { id: "el_3", type: "list", label: "Makanan", props: { items: "Nasi Goreng — Rp 25.000\nMie Ayam — Rp 20.000\nSoto Ayam — Rp 18.000", numbered: "true" } },
    { id: "el_4", type: "stat", label: "Paket Hemat", props: { label: "Paket Isi 5", value: "Rp 80.000", delta: "Hemat 20%", trend: "up" } },
    { id: "el_5", type: "alert", label: "Info", props: { title: "Gratis Ongkir", message: "Minimal order Rp 50.000", type: "success" } },
    { id: "el_6", type: "button", label: "CTA", props: { text: "Pesan Sekarang", variant: "default", size: "lg" } },
  ],
}, null, 2);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { workspaceId, userId } = await getWorkspaceContext(supabase);

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
    const { prompt, agent_id } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Deskripsi canvas wajib diisi' }, { status: 400 });
    }

    const userPrompt = `Buat canvas layout untuk chatbot bisnis UMKM Indonesia.

Deskripsi: "${prompt}"

ATURAN PENTING:
- "label" adalah teks singkat deskriptif (contoh: "Header", "Produk 1", "Info Kontak"). BUKAN berisi props.
- "props" adalah OBJECT berisi konfigurasi widget. SEMUA konfigurasi widget HARUS masuk ke "props", BUKAN ke "label".
- Setiap element: { "id": "el_N", "type": "...", "label": "teks singkat", "props": { ... } }

TIPE WIDGET DAN PROPS-NYA:
- heading: props = { "content": "judul teks", "level": "h1/h2/h3/h4" }
- text: props = { "content": "isi teks", "size": "xs/sm/base/lg", "weight": "light/normal/semibold/bold" }
- badge: props = { "text": "teks badge", "color": "blue/green/amber/red/purple" }
- separator: props = {} (kosong)
- button: props = { "text": "teks tombol", "variant": "default/outline/secondary", "size": "sm/default/lg" }
- card: props = { "title": "judul", "subtitle": "sub", "body": "isi lengkap" }
- alert: props = { "title": "judul", "message": "isi pesan", "type": "info/success/warning/error" }
- stat: props = { "label": "keterangan", "value": "nilai", "delta": "+10%", "trend": "up/down/neutral" }
- list: props = { "items": "Item 1\\nItem 2\\nItem 3", "numbered": "true/false" }
- table: props = { "columns": "Kol1,Kol2,Kol3", "rows": "A,B,C\\nD,E,F" }
- rating: props = { "label": "Rating", "value": "4.5", "max": "5" }
- image: props = { "url": "https://...", "alt": "deskripsi", "caption": "caption" }

CONTOH OUTPUT YANG BENAR:
${EXAMPLE_OUTPUT}

Buat 5-15 elements yang relevan. Gunakan Bahasa Indonesia yang realistis.`;

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Kamu menghasilkan canvas layout JSON untuk chatbot bisnis. Kembalikan HANYA JSON valid. Konfigurasi widget SELALU masuk ke "props", bukan ke "label". "label" hanya teks singkat deskriptif.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: 'AI tidak mengembalikan respons' }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Gagal memproses respons AI' }, { status: 500 });
    }

    const name = parsed.name || 'Canvas Baru';
    const description = parsed.description || '';
    const elements = Array.isArray(parsed.elements) ? parsed.elements : [];

    // Safety: if AI put props in label (stringified JSON), fix it
    const fixedElements = elements.map((el: any) => {
      if (el.label && typeof el.label === 'string' && el.label.startsWith('{') && (!el.props || Object.keys(el.props).length === 0)) {
        try {
          const parsedLabel = JSON.parse(el.label);
          if (typeof parsedLabel === 'object' && parsedLabel !== null) {
            return { ...el, label: el.type, props: parsedLabel };
          }
        } catch { /* not JSON, keep as-is */ }
      }
      return el;
    });

    const { data, error } = await supabase
      .from('canvas_layouts')
      .insert({
        name,
        description,
        layout_json: { elements: fixedElements },
        agent_id: agent_id || null,
        is_active: false,
        workspace_id: workspaceId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[canvas generate]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
