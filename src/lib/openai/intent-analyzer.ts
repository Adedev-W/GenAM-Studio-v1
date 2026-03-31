/**
 * Intent Confidence Analyzer — Pre-LLM keyword matching
 * Deteksi intent dari pesan user sebelum dikirim ke LLM.
 * Jika confidence tinggi, paksa tool_choice agar LLM tidak bisa skip tool.
 */

type Intent = 'WIDGET_ACTION' | 'CONFIRM_ORDER' | 'VIEW_PRODUCTS' | 'SEARCH_PRODUCTS' | 'CHECK_ORDER' | 'CANCEL_ORDER' | 'CREATE_ORDER' | 'GREETING' | 'NONE';

interface IntentResult {
  intent: Intent;
  confidence: number;
  forcedTool: string | null;
}

const INTENT_PATTERNS: Array<{
  intent: Intent;
  patterns: RegExp[];
  confidence: number;
  tool: string | null;
  canvasTool?: string; // alternative tool when canvas available
}> = [
  {
    intent: 'VIEW_PRODUCTS',
    patterns: [
      /\b(menu|produk|katalog|pricelist|price\s*list|daftar\s*(harga|produk|menu)?)\b/i,
      /\b(ada\s+apa\s*(aja|saja)?|apa\s+aja|show|lihat|liat|tampil(kan)?)\b/i,
      /\b(jualan?(nya)?|dagangan|barang|item)\b/i,
      /\bmenunya\b/i,
      /\b(harga|price)\b/i,
    ],
    confidence: 0.9,
    tool: 'search_products',
    canvasTool: 'show_canvas',
  },
  {
    intent: 'SEARCH_PRODUCTS',
    patterns: [
      /\b(cari|search|filter)\b/i,
      /\b(yang\s+(murah|mahal|termurah|termahal))\b/i,
      /\b(di\s*bawah|kurang\s*dari|maksimal|max)\s*\d/i,
      /\b(rasa|varian|variant|kategori|jenis)\b/i,
      /\b(ada\s*(gak|nggak|tidak|ga)\s+yang)\b/i,
      /\b(stok|stock|ketersediaan|tersedia|available)\b/i,
      /\b(rekomendasi|rekomen|suggest)\b/i,
    ],
    confidence: 0.85,
    tool: 'search_products',
  },
  {
    intent: 'CHECK_ORDER',
    patterns: [
      /\b(pesanan|order|status\s*(pesanan|order)?)\b/i,
      /\bORD-/i,
      /\b(cek\s*(pesanan|order)|tracking|lacak)\b/i,
      /\b(udah|sudah)\s*(sampai|diproses|dikirim|selesai)/i,
      /\b(pesanan\s*(saya|gue|gw|ku|aku))\b/i,
    ],
    confidence: 0.85,
    tool: 'check_order',
  },
  {
    intent: 'CANCEL_ORDER',
    patterns: [
      /\b(cancel|batal(kan)?)\s*(pesanan|order)?\b/i,
      /\b(ga|gak|gk|tidak|tdk)\s+jadi\b/i,
      /\bgajadi\b/i,
    ],
    confidence: 0.85,
    tool: 'cancel_order',
  },
  {
    intent: 'CREATE_ORDER',
    patterns: [
      /\b(pesan|order|beli|mau\s*(pesan|beli|order))\b/i,
      /\b(checkout|bayar)\b/i,
    ],
    confidence: 0.6, // Lower — needs confirmation, don't force
    tool: null, // Let LLM handle order flow naturally
  },
  {
    intent: 'GREETING',
    patterns: [
      /^(halo|hai|hi|hey|hei|hello|selamat\s*(pagi|siang|sore|malam)|assalamualaikum|waalaikumsalam)\b/i,
      /^(p|halo+|hai+|hi+)\s*$/i,
    ],
    confidence: 0.95,
    tool: null, // Text-only response
  },
];

const CONFIDENCE_THRESHOLD = 0.8;

/**
 * Detect widget action messages: [Pengguna mengklik: ...], [Pengguna memilih: ...], etc.
 * MUST be checked FIRST — otherwise "[Pengguna mengklik: Lihat Menu]" would match VIEW_PRODUCTS
 * and force show_canvas again (re-showing the same canvas).
 */
const WIDGET_ACTION_PATTERN = /^\[Pengguna\s+(mengklik|memilih|mengubah\s+toggle):\s+/i;
const CONFIRM_ORDER_PATTERN = /^\[Pengguna\s+mengklik:\s+Konfirmasi Pesanan\]/i;
const CONFIRM_ORDER_PLAIN = /^konfirmasi\s+pesanan$/i;
const EDIT_ORDER_PATTERN = /^\[Pengguna\s+mengklik:\s+Ubah Pesanan\]/i;
const CANCEL_ORDER_PATTERN = /\b(cancel|batal(kan)?)\b/i;
const CANCEL_ORDER_FULL = /\b(ga|gak|gk|tidak|tdk)\s+jadi\b|\bgajadi\b/i;

export function analyzeIntent(message: string, hasCanvas: boolean): IntentResult {
  const normalized = message.trim();

  // Priority 0: Order confirmation button — force create_order
  // Match both wrapped format [Pengguna mengklik: ...] and plain text "Konfirmasi Pesanan"
  if (CONFIRM_ORDER_PATTERN.test(normalized) || CONFIRM_ORDER_PLAIN.test(normalized)) {
    return { intent: 'CONFIRM_ORDER', confidence: 0.99, forcedTool: 'create_order' };
  }

  // Priority 0b: Edit order button — let LLM handle naturally (no forced tool)
  if (EDIT_ORDER_PATTERN.test(normalized)) {
    return { intent: 'WIDGET_ACTION', confidence: 0.99, forcedTool: null };
  }

  // Priority 1: Widget action — intercept before any other pattern
  if (WIDGET_ACTION_PATTERN.test(normalized)) {
    return { intent: 'WIDGET_ACTION', confidence: 0.99, forcedTool: null };
  }

  // Priority 2: Cancel order — must be checked BEFORE general loop
  // because "cancel order" would otherwise match CHECK_ORDER first
  if (CANCEL_ORDER_PATTERN.test(normalized) || CANCEL_ORDER_FULL.test(normalized)) {
    return { intent: 'CANCEL_ORDER', confidence: 0.95, forcedTool: 'cancel_order' };
  }

  const lower = normalized.toLowerCase();
  let bestMatch: IntentResult = { intent: 'NONE', confidence: 0, forcedTool: null };

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(lower)) {
        if (pattern.confidence > bestMatch.confidence) {
          let tool = pattern.tool;
          // If canvas available and this intent has a canvas alternative, use it
          if (hasCanvas && pattern.canvasTool) {
            tool = pattern.canvasTool;
          }
          bestMatch = {
            intent: pattern.intent,
            confidence: pattern.confidence,
            forcedTool: pattern.confidence >= CONFIDENCE_THRESHOLD ? tool : null,
          };
        }
        break; // One pattern match is enough per intent group
      }
    }
  }

  return bestMatch;
}

/**
 * Build tool_choice parameter for OpenAI API.
 * - If forcedTool specified AND tool exists in allTools → force that specific tool
 * - Otherwise → "auto"
 */
export function buildToolChoice(
  forcedTool: string | null,
  allTools: Array<{ function?: { name: string } }>,
): 'auto' | { type: 'function'; function: { name: string } } {
  if (!forcedTool) return 'auto';

  // Verify the tool actually exists in the available tools
  const toolExists = allTools.some(
    (t) => (t as any).function?.name === forcedTool
  );

  if (!toolExists) return 'auto';

  return {
    type: 'function',
    function: { name: forcedTool },
  };
}
