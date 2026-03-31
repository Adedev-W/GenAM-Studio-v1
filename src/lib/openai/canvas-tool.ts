interface CanvasInfo {
  id: string;
  name: string;
  description: string | null;
  layout_json?: { elements?: Array<{ type: string; label?: string; props?: any }> } | null;
}

/** Summarize what elements a canvas contains, e.g. "list (3 item), image (2 foto)" */
function summarizeCanvas(canvas: CanvasInfo): string {
  const elements = canvas.layout_json?.elements;
  if (!elements || elements.length === 0) return '';
  const counts: Record<string, number> = {};
  for (const el of elements) {
    counts[el.type] = (counts[el.type] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([type, count]) => `${type} (${count})`)
    .join(', ');
}

/**
 * Extract readable content from canvas elements so the LLM knows what's inside.
 * This gives the agent product knowledge without needing to duplicate data in the system prompt.
 */
function extractCanvasContent(canvas: CanvasInfo): string {
  const elements = canvas.layout_json?.elements;
  if (!elements || elements.length === 0) return '';

  const lines: string[] = [];
  for (const el of elements) {
    const p = el.props || {};
    switch (el.type) {
      case 'heading':
        if (p.content) lines.push(`# ${p.content}`);
        break;
      case 'text':
        if (p.content) lines.push(`${el.label ? `[${el.label}] ` : ''}${p.content}`);
        break;
      case 'stat':
        if (p.label || p.value) lines.push(`${p.label || ''}: ${p.value || ''}`);
        break;
      case 'badge':
        if (p.text) lines.push(`[${p.text}]`);
        break;
      case 'table':
        if (p.columns && p.rows) lines.push(`Tabel (${p.columns}): ${p.rows.split('\n').slice(0, 5).join(' | ')}`);
        break;
      case 'list':
        if (p.items) lines.push(`Daftar: ${typeof p.items === 'string' ? p.items : JSON.stringify(p.items)}`);
        break;
      case 'image':
        if (el.label || p.alt) lines.push(`[Gambar: ${el.label || p.alt || ''}]`);
        break;
      case 'button':
        // Already handled in interactive elements
        break;
    }
  }
  return lines.join('\n');
}

export function buildCanvasTools(canvases: CanvasInfo[]) {
  if (!canvases.length) return [];

  const canvasList = canvases.map(c => {
    const summary = summarizeCanvas(c);
    const desc = c.description ? ` — ${c.description}` : '';
    const content = summary ? ` [berisi: ${summary}]` : '';
    return `- "${c.name}" (canvas_id: "${c.id}")${desc}${content}`;
  }).join('\n');

  return [
    {
      type: 'function' as const,
      function: {
        name: 'show_canvas',
        description: `WAJIB DIGUNAKAN — Tampilkan canvas layout visual yang sudah disiapkan kepada pelanggan. Gunakan tool ini SETIAP KALI pelanggan bertanya tentang sesuatu yang relevan dengan canvas di bawah. JANGAN buat ulang data secara manual jika sudah ada di canvas.\n\nCanvas tersedia:\n${canvasList}`,
        parameters: {
          type: 'object',
          properties: {
            canvas_id: {
              type: 'string',
              enum: canvases.map(c => c.id),
              description: 'ID canvas yang akan ditampilkan',
            },
            message: {
              type: 'string',
              description: 'Pesan singkat pendamping untuk pelanggan dalam bahasa Indonesia',
            },
          },
          required: ['canvas_id', 'message'],
        },
      },
    },
  ];
}

/** Build the canvas priority instruction for system prompt */
export function buildCanvasSystemPrompt(canvases: CanvasInfo[]): string {
  if (!canvases.length) return '';

  const canvasList = canvases.map(c => {
    const summary = summarizeCanvas(c);
    const desc = c.description ? `: ${c.description}` : '';
    const content = summary ? ` → berisi ${summary}` : '';
    return `  - "${c.name}"${desc}${content}`;
  }).join('\n');

  // Extract actual content from canvases so agent can reference products/info in text
  const canvasContents = canvases.map(c => {
    const extracted = extractCanvasContent(c);
    if (!extracted) return '';
    return `### Isi Canvas "${c.name}":\n${extracted}`;
  }).filter(Boolean).join('\n\n');

  // Build element summary per canvas so LLM knows what buttons/actions exist
  const canvasDetails = canvases.map(c => {
    const elements = c.layout_json?.elements || [];
    const buttons = elements.filter((e: any) => e.type === 'button').map((e: any) => `"${e.props?.text || e.label || 'tombol'}"`);
    const selects = elements.filter((e: any) => e.type === 'select').map((e: any) => `"${e.props?.label || e.label || 'pilihan'}"`);
    const toggles = elements.filter((e: any) => e.type === 'toggle').map((e: any) => `"${e.props?.label || e.label || 'toggle'}"`);
    const interactiveInfo: string[] = [];
    if (buttons.length) interactiveInfo.push(`Tombol: ${buttons.join(', ')}`);
    if (selects.length) interactiveInfo.push(`Dropdown: ${selects.join(', ')}`);
    if (toggles.length) interactiveInfo.push(`Toggle: ${toggles.join(', ')}`);
    return interactiveInfo.length > 0 ? `  Canvas "${c.name}": ${interactiveInfo.join(' | ')}` : '';
  }).filter(Boolean).join('\n');

  return `
PENTING — TOOL YANG WAJIB DIGUNAKAN:
Kamu memiliki tool "show_canvas" untuk menampilkan data visual yang sudah disiapkan pemilik bisnis.
SELALU panggil tool show_canvas jika pelanggan bertanya sesuatu yang relevan dengan canvas di bawah.
Jangan pernah mencoba membuat format visual sendiri.

Canvas yang tersedia:
${canvasList}

${canvasContents ? `## PENGETAHUAN DARI CANVAS
Berikut isi konten canvas yang kamu ketahui. Gunakan informasi ini untuk menjawab pertanyaan pelanggan secara natural (sebutkan nama produk, harga, dll). Tetap panggil show_canvas untuk menampilkan visual, tapi SERTAI dengan penjelasan teks yang informatif.

${canvasContents}
` : ''}Contoh kapan harus panggil show_canvas:
- Pelanggan: "lihat menu" / "produk apa aja" / "ada apa aja" → panggil show_canvas
- Pelanggan: "harga berapa" / "price list" → panggil show_canvas
- Pelanggan: "lihat katalog" / "show produk" → panggil show_canvas

## INTERAKSI CANVAS (KRITIS)
Canvas memiliki elemen interaktif (tombol, dropdown, toggle). Ketika pelanggan berinteraksi, pesan akan datang dalam format:
- "[Pengguna mengklik: <label tombol>]"
- "[Pengguna memilih: <label> = <nilai>]"
- "[Pengguna mengubah toggle: <label> = aktif/nonaktif]"

${canvasDetails ? `Elemen interaktif yang ada:\n${canvasDetails}\n` : ''}ATURAN saat pelanggan berinteraksi dengan canvas:
1. JANGAN panggil show_canvas lagi — canvas sudah tampil, jangan tampilkan ulang
2. RESPONS sesuai konteks tombol/aksi yang diklik:
   - Tombol terkait pemesanan (pesan, beli, order, checkout) → mulai alur pemesanan, tanya nama + HP + konfirmasi
   - Tombol terkait kontak (hubungi, kontak, chat, WA) → berikan info kontak bisnis atau tawarkan bantuan langsung
   - Tombol terkait detail produk (detail, info, selengkapnya) → jelaskan detail produk tersebut
   - Tombol lainnya → respons sesuai makna label tombol secara natural
3. Untuk dropdown: akui pilihan pelanggan, lanjutkan percakapan sesuai konteks
4. Untuk toggle: konfirmasi perubahan dan jelaskan efeknya
5. Jika tidak yakin apa yang harus dilakukan → tanya pelanggan apa yang bisa dibantu terkait aksi tersebut
`;
}
