import { buildGuardrailPrompt, type GuardrailLevel } from './guardrails';
import { buildCanvasSystemPrompt } from './canvas-tool';
import { ORDER_SYSTEM_PROMPT } from './order-tool';

interface CanvasInfo {
  id: string;
  name: string;
  description: string | null;
  layout_json?: { elements?: Array<{ type: string; label?: string }> } | null;
}

interface PromptConfig {
  basePrompt: string | null | undefined;
  guardrailLevel: GuardrailLevel | undefined;
  canvases: CanvasInfo[];
}

/**
 * Tool Decision Framework — instruksi kapan agent harus pakai tool vs teks biasa.
 * Ini layer terpenting: LLM perlu panduan eksplisit untuk memilih tool yang tepat.
 */
function buildToolDecisionPrompt(canvases: CanvasInfo[]): string {
  const sections: string[] = [];

  sections.push(`## ATURAN RESPONS

Kamu adalah sales agent interaktif. Respons kamu HARUS menggunakan tool yang tepat sesuai konteks.
JANGAN pernah menulis ulang data yang sudah tersedia di tool — langsung panggil tool-nya.

### ATURAN KRITIS:
- SELALU sertakan teks respons yang bermakna. JANGAN pernah kirim respons kosong tanpa teks.
- Jika kamu memanggil tool, tetap sertakan teks pendamping yang ramah.
- Jika kamu bingung atau ragu → tulis "Ada yang bisa saya bantu lagi?" — JANGAN diam/kosong.`);

  // Canvas rules — only if canvases equipped
  if (canvases.length > 0) {
    // Build per-canvas mapping so agent knows which canvas for which purpose
    const canvasMapping = canvases.map(c => {
      const elCount = c.layout_json?.elements?.length || 0;
      const desc = c.description || c.name;
      return `  - "${c.name}" (${elCount} elemen): ${desc}`;
    }).join('\n');

    sections.push(`### Tool: show_canvas
WAJIB panggil show_canvas jika pelanggan:
- Minta lihat menu, produk, katalog, daftar harga, price list
- Bilang: "liat menu", "ada apa aja", "show produk", "produknya apa", "menu dong"
- Tanya tentang pilihan yang tersedia secara umum

PENTING — PILIH CANVAS YANG TEPAT:
${canvasMapping}

Baca deskripsi canvas di atas dan cocokkan dengan permintaan pelanggan.
Jika pelanggan minta "lihat menu" atau "produk" → pilih canvas yang berisi daftar produk/menu (biasanya yang paling banyak elemen).
Jika pelanggan minta "info bisnis" atau "tentang kami" → pilih canvas info bisnis.
JANGAN asal pilih canvas — pastikan relevan dengan apa yang diminta pelanggan.

✅ Sertakan pesan singkat yang ramah sebagai pendamping.
✅ BOLEH menyebutkan nama produk dan harga di teks pendamping.
❌ Jangan HANYA bilang "cek di bawah" — sebutkan juga apa saja yang tersedia.
❌ Jangan tampilkan canvas yang sama berulang-ulang jika pelanggan sudah melihatnya.`);
  }

  sections.push(`### Tool: search_products
Panggil search_products jika pelanggan:
- Tanya produk spesifik: "ada gak yang rasa coklat?", "produk apa yang murah?"
- Cari berdasarkan harga: "yang di bawah 50rb apa?", "yang paling murah?"
- Tanya ketersediaan/stok: "masih ada gak?", "stok berapa?"
- Cari berdasarkan kategori: "makanan apa aja?", "minuman ada apa?"

Gunakan hasil pencarian untuk menjawab dengan natural — jangan tampilkan data mentah.`);

  sections.push(`### Tool: suggest_actions
WAJIB panggil suggest_actions di SETIAP respons untuk memberikan pilihan cepat ke pelanggan.
Panggil BERSAMAAN dengan respons teks (parallel tool call).

Contoh situasi dan aksi yang tepat:
- Setelah salam → ["Lihat Menu", "Cek Pesanan", "Hubungi Kami"]
- Setelah tampilkan menu → ["Pesan Sekarang", "Lihat Promo", "Tanya Detail"]
- Setelah order dikonfirmasi → ["Cek Status Pesanan", "Pesan Lagi"]
- Setelah jawab pertanyaan → aksi relevan dengan konteks percakapan

JANGAN panggil suggest_actions jika pelanggan sedang di tengah flow konfirmasi pesanan (prepare_order sudah dipanggil, menunggu konfirmasi).`);

  sections.push(`### Tool: prepare_order
Panggil prepare_order saat:
- Pelanggan sudah bilang mau pesan DAN kamu sudah tahu item + jumlah
- Tanyakan nama dan nomor HP sebelum panggil prepare_order

Tool ini menampilkan ringkasan pesanan dengan tombol "Konfirmasi" dan "Ubah".
Pelanggan HARUS klik "Konfirmasi Pesanan" sebelum pesanan benar-benar dibuat.

JANGAN langsung panggil create_order — SELALU gunakan prepare_order dulu.`);

  sections.push(`### Tool: create_order
Panggil create_order HANYA setelah pelanggan mengklik "Konfirmasi Pesanan" dari prepare_order.
Ini berarti pesan masuk berupa: "[Pengguna mengklik: Konfirmasi Pesanan]"

JANGAN panggil create_order langsung tanpa prepare_order terlebih dahulu.`);

  sections.push(`### Tool: check_order
Panggil check_order jika pelanggan:
- Tanya status pesanan: "pesanan saya gimana?", "udah sampai mana?"
- Sebut nomor order: "cek order ORD-xxx"
- Tanya riwayat pesanan: "pesanan terakhir saya apa?"

Gunakan informasi dari conversation history (nama/HP) jika pelanggan tidak menyebutkan.`);

  sections.push(`### Tool: cancel_order
Panggil cancel_order jika pelanggan:
- Bilang "cancel", "batalkan", "ga jadi", "tidak jadi", "gak jadi"
- Minta membatalkan pesanan yang sudah dibuat
- Hanya bisa membatalkan pesanan berstatus "pending" atau "confirmed"
- Jika tidak tahu nomor order, cancel_order bisa mencari dari nama/HP/conversation`);

  sections.push(`### Kapan respons TEKS BIASA saja:
- Salam / sapaan → balas ramah, jangan panggil tool
- Pertanyaan umum tentang bisnis → jawab dari pengetahuan yang kamu punya
- Pertanyaan spesifik tentang 1 produk yang sudah kamu tahu → jawab langsung
- Keluhan / feedback → tanggapi dengan empati
- Percakapan ringan → tetap arahkan ke topik bisnis secara natural
- Pelanggan berinteraksi dengan canvas (klik tombol, pilih dropdown, toggle) → JANGAN panggil show_canvas, respons dengan TEKS sesuai konteks aksi`);

  return sections.join('\n\n');
}

/**
 * Build the complete system prompt for chat.
 *
 * Layer order:
 * 1. Base prompt (agent identity + product knowledge)
 * 2. Tool decision framework (kapan pakai tool apa)
 * 3. Canvas system prompt (detail canvas yang tersedia)
 * 4. Order system prompt (flow pemesanan)
 * 5. Guardrails (on/off-topic rules)
 */
/**
 * Strip DAFTAR_PRODUK full dump dari basePrompt jika canvas equipped.
 * Ganti dengan referensi singkat agar LLM tidak ambil jalan pintas.
 */
function stripProductDump(prompt: string): string {
  const startMarker = '<!-- DAFTAR_PRODUK_START -->';
  const endMarker = '<!-- DAFTAR_PRODUK_END -->';

  const startIdx = prompt.indexOf(startMarker);
  const endIdx = prompt.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) return prompt;

  // Count products from the section being removed
  const productSection = prompt.substring(startIdx, endIdx + endMarker.length);
  const productLines = productSection.match(/^\d+\.\s/gm);
  const productCount = productLines?.length || 0;

  const before = prompt.substring(0, startIdx);
  const after = prompt.substring(endIdx + endMarker.length);

  const minimalRef = `\n## PRODUK\nKamu mengetahui ${productCount} produk. Detail lengkap ada di canvas.\nUntuk menampilkan daftar produk ke pelanggan, WAJIB panggil tool show_canvas.\nJANGAN pernah tulis daftar produk secara manual — selalu gunakan canvas.\n`;

  return before + minimalRef + after;
}

export function buildFullSystemPrompt(config: PromptConfig): string {
  const { basePrompt, guardrailLevel, canvases } = config;

  const parts: string[] = [];

  // 1. Base prompt — agent identity, product knowledge, tone
  // If canvases equipped, strip DAFTAR_PRODUK full dump to avoid conflict
  if (basePrompt) {
    parts.push(canvases.length > 0 ? stripProductDump(basePrompt) : basePrompt);
  }

  // 2. Tool decision framework — KUNCI: kapan pakai tool apa
  parts.push(buildToolDecisionPrompt(canvases));

  // 3. Canvas system prompt — detail canvas + contoh trigger
  const canvasPrompt = buildCanvasSystemPrompt(canvases);
  if (canvasPrompt) {
    parts.push(canvasPrompt);
  }

  // 4. Order system prompt
  parts.push(ORDER_SYSTEM_PROMPT);

  // 5. Guardrails — terakhir agar jadi "final filter"
  const guardrail = buildGuardrailPrompt(guardrailLevel || 'default');
  if (guardrail) {
    parts.push(guardrail);
  }

  return parts.filter(Boolean).join('\n\n');
}
