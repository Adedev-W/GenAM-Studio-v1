interface CanvasInfo {
  id: string;
  name: string;
  description: string | null;
  layout_json?: { elements?: Array<{ type: string; label?: string }> } | null;
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

  return `
PENTING — TOOL YANG WAJIB DIGUNAKAN:
Kamu memiliki tool "show_canvas" untuk menampilkan data visual yang sudah disiapkan pemilik bisnis.
SELALU panggil tool show_canvas jika pelanggan bertanya sesuatu yang relevan dengan canvas di bawah.
JANGAN pernah menulis ulang data canvas menggunakan tag <widget> — langsung panggil tool show_canvas.

Canvas yang tersedia:
${canvasList}

Contoh kapan harus panggil show_canvas:
- Pelanggan: "lihat menu" / "produk apa aja" / "ada apa aja" → panggil show_canvas
- Pelanggan: "harga berapa" / "price list" → panggil show_canvas
- Pelanggan: "lihat katalog" / "show produk" → panggil show_canvas
`;
}
