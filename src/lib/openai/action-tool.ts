/**
 * suggest_actions tool — LLM-generated quick-reply buttons.
 * Passthrough tool: tidak butuh execution + follow-up.
 * Cukup extract actions dari tool call args dan attach ke response.
 */

export function buildSuggestActionsTool() {
  return {
    type: 'function' as const,
    function: {
      name: 'suggest_actions',
      description:
        'Tampilkan tombol quick-reply untuk pelanggan. Panggil BERSAMAAN dengan respons teks. Maksimal 4 aksi. WAJIB panggil di setiap respons kecuali saat pelanggan sedang konfirmasi pesanan.',
      parameters: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            maxItems: 4,
            description: 'Daftar tombol aksi cepat untuk pelanggan',
            items: {
              type: 'object',
              properties: {
                label: {
                  type: 'string',
                  description: 'Teks tombol (singkat, max 30 karakter)',
                },
                type: {
                  type: 'string',
                  enum: ['reply', 'order', 'link'],
                  description:
                    'Jenis aksi: reply = kirim teks, order = mulai pesanan, link = buka URL',
                },
              },
              required: ['label'],
            },
          },
        },
        required: ['actions'],
      },
    },
  };
}

export interface SuggestedActionFromTool {
  label: string;
  type?: 'reply' | 'order' | 'link';
}

/**
 * Parse suggest_actions tool call arguments.
 * Returns null if parsing fails.
 */
export function parseSuggestActions(
  argsJson: string,
): SuggestedActionFromTool[] | null {
  try {
    const parsed = JSON.parse(argsJson);
    if (!parsed.actions || !Array.isArray(parsed.actions)) return null;
    return parsed.actions
      .filter((a: any) => a && typeof a.label === 'string')
      .slice(0, 4);
  } catch {
    return null;
  }
}
