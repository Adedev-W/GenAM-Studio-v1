import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { recordTokenUsage } from '@/lib/openai/record-usage';
import { buildCanvasTools, buildCanvasSystemPrompt } from '@/lib/openai/canvas-tool';
import { buildOrderTool, ORDER_SYSTEM_PROMPT, processCreateOrder, formatOrderConfirmation } from '@/lib/openai/order-tool';
import { buildGuardrailPrompt } from '@/lib/openai/guardrails';
import { triggerWorkflows } from '@/lib/workflows/engine';

const WIDGET_SYSTEM_PROMPT = `
Kamu dapat menampilkan widget interaktif dalam respons dengan format PERSIS seperti ini:
<widget>{"type":"TIPE","label":"Judul Widget","props":{...}}</widget>

WIDGET TERSEDIA DAN FORMAT PROPS-NYA:

1. list — Daftar produk, menu, atau item
   props: { "items": "Item 1\nItem 2\nItem 3", "numbered": false }
   Contoh: <widget>{"type":"list","label":"Produk Kami","props":{"items":"Risol Mayo - Rp5.000\nRisol Ayam - Rp6.000\nRisol Keju - Rp7.000"}}</widget>

2. card — Info detail satu produk/layanan
   props: { "title": "Nama Produk", "subtitle": "Kategori", "body": "Deskripsi lengkap" }
   Contoh: <widget>{"type":"card","label":"Detail Produk","props":{"title":"Risol Mayo","subtitle":"Best Seller","body":"Isian smoked beef, telur, dan mayo. Kulit tipis renyah. Harga Rp5.000/pcs."}}</widget>

3. stat — Angka/statistik penting (harga, jumlah, diskon)
   props: { "label": "Keterangan", "value": "Nilai", "delta": "+10%", "trend": "up" }
   Contoh: <widget>{"type":"stat","label":"Harga Paket Hemat","props":{"label":"Paket Isi 10","value":"Rp45.000","delta":"Hemat 10%","trend":"up"}}</widget>

4. badge — Label status, tag, atau highlight singkat
   props: { "text": "Teks badge", "color": "green" } — color: green|amber|blue|red|purple
   Contoh: <widget>{"type":"badge","label":"Status","props":{"text":"Stok Tersedia","color":"green"}}</widget>

5. alert — Pengumuman, promo, atau peringatan penting
   props: { "title": "Judul", "message": "Isi pesan", "type": "info" } — type: info|success|warning|error
   Contoh: <widget>{"type":"alert","label":"Promo","props":{"title":"Promo Hari Ini!","message":"Beli 5 gratis 1 untuk semua varian. Berlaku sampai pukul 21.00.","type":"success"}}</widget>

6. table — Tabel perbandingan produk atau harga
   props: { "columns": "Nama,Harga,Stok", "rows": "Produk A,Rp10rb,Ada\nProduk B,Rp15rb,Habis" }
   Contoh: <widget>{"type":"table","label":"Daftar Harga","props":{"columns":"Produk,Harga","rows":"Risol Mayo,Rp5.000\nRisol Ayam,Rp6.000"}}</widget>

7. bar_chart — Grafik perbandingan (penjualan, popularitas)
   props: { "title": "Judul", "labels": "Jan,Feb,Mar", "values": "40,65,50", "color": "emerald" }

8. image — Foto produk
   props: { "url": "https://...", "alt": "Nama produk", "caption": "Rp 50.000" }
   Contoh: <widget>{"type":"image","label":"Foto Produk","props":{"url":"https://example.com/produk.jpg","alt":"Risol Mayo","caption":"Rp 5.000/pcs"}}</widget>
   Gunakan ketika pelanggan bertanya tentang produk yang ada fotonya.

KAPAN MENGGUNAKAN WIDGET:
- Ada pertanyaan "apa produknya?" / "show menu" / "lihat katalog" → gunakan LIST
- Ada pertanyaan detail satu produk → gunakan CARD
- Ada pertanyaan harga / diskon / jumlah → gunakan STAT
- Ada pengumuman promo / info penting → gunakan ALERT
- Ada perbandingan banyak produk → gunakan TABLE
- Ada foto produk tersedia → gunakan IMAGE
- Percakapan biasa (salam, pertanyaan singkat) → JANGAN pakai widget

INTERAKSI WIDGET:
Ketika kamu menerima pesan dalam format "[Pengguna mengklik: ...]", "[Pengguna memilih: ...]", atau "[Pengguna mengubah toggle: ...]",
artinya user baru saja berinteraksi dengan widget yang kamu tampilkan. Respon langsung sesuai isi aksinya —
misalnya konfirmasi pilihan, tanyakan detail selanjutnya, atau tampilkan informasi relevan.
Jangan komentari format pesannya, langsung respon isinya.

PENTING: Pastikan JSON valid. Gunakan \\n untuk baris baru di dalam string. Jangan gunakan markdown di dalam props.
`;

function parseWidgets(content: string): { text: string; widgets: any[] } {
  const widgets: any[] = [];
  const text = content.replace(/<widget>([\s\S]*?)<\/widget>/g, (_, json) => {
    try { widgets.push(JSON.parse(json.trim())); } catch {}
    return '';
  }).trim();
  return { text, widgets };
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  const { data: session } = await supabase
    .from('chat_sessions').select('id, is_public, allow_multi_user').eq('share_token', token).eq('is_active', true).single();
  if (!session?.is_public) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = serviceClient.from('chat_messages').select('*').eq('session_id', session.id).order('created_at', { ascending: true });
  if (conversationId) query = query.eq('conversation_id', conversationId);

  const { data } = await query;
  return NextResponse.json(data || []);
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { content, conversationId, userIdentifier, email, displayName } = body;

  // Get session
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('*, agents(name, model_id, system_prompt, temperature, metadata)')
    .eq('share_token', token).eq('is_active', true).single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (!session.is_public) return NextResponse.json({ error: 'This chat is private' }, { status: 403 });
  if (session.require_email && !email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    // For multi-user: find existing shared conversation; for single: create new
    if (session.allow_multi_user) {
      const { data: existing } = await serviceClient
        .from('chat_conversations').select('id').eq('session_id', session.id).limit(1).single();
      if (existing) {
        convId = existing.id;
      }
    }
    if (!convId) {
      const { data: conv } = await serviceClient.from('chat_conversations')
        .insert({ session_id: session.id, user_identifier: userIdentifier || email || 'anon', email, display_name: displayName })
        .select().single();
      convId = conv?.id;

      // Link to existing contact by email
      if (email && convId) {
        const { data: contact } = await serviceClient
          .from('contacts')
          .select('id')
          .eq('workspace_id', session.workspace_id)
          .eq('email', email)
          .limit(1)
          .single();
        if (contact) {
          await serviceClient
            .from('chat_conversations')
            .update({ contact_id: contact.id })
            .eq('id', convId);
        }
      }
    }
  }

  // Save user message
  await serviceClient.from('chat_messages').insert({
    conversation_id: convId, session_id: session.id, role: 'user', content,
  });

  // Trigger automasi: chat_keyword
  triggerWorkflows({
    type: 'chat_keyword',
    workspaceId: session.workspace_id,
    data: {
      message: content,
      conversation_id: convId,
      session_id: session.id,
      chat_session_id: session.id,
      user_identifier: userIdentifier || email || 'anon',
    },
  }).catch((err) => console.error('[Automasi] chat_keyword trigger failed:', err));

  // Get history
  const { data: history } = await serviceClient.from('chat_messages')
    .select('role, content').eq('conversation_id', convId).order('created_at', { ascending: true }).limit(30);

  // Get workspace API key
  const { data: workspace } = await serviceClient
    .from('workspaces').select('settings').eq('id', session.workspace_id).single();
  const apiKey = (workspace?.settings as any)?.openai_api_key;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured for this chat' }, { status: 503 });

  const openai = new OpenAI({ apiKey });
  const agent = session.agents as any;

  // Build canvas tools from equipped canvases
  let canvases: Array<{ id: string; name: string; description: string | null; layout_json?: any }> = [];
  const canvasIds = (agent?.metadata as any)?.canvas_ids;
  if (Array.isArray(canvasIds) && canvasIds.length > 0) {
    const { data: canvasData } = await serviceClient
      .from('canvas_layouts')
      .select('id, name, description, layout_json')
      .in('id', canvasIds)
      .eq('is_active', true);
    if (canvasData && canvasData.length > 0) {
      canvases = canvasData;
    }
  }

  // Build system prompt: canvas tool instructions FIRST (if any), then widget prompt with caveat
  const canvasSystemPrompt = buildCanvasSystemPrompt(canvases);
  const widgetCaveat = canvases.length > 0
    ? '\n\nCATATAN: Jika ada tool show_canvas yang tersedia, PRIORITASKAN tool tersebut daripada menulis <widget> secara manual. Hanya gunakan <widget> untuk data yang TIDAK tersedia di canvas.'
    : '';
  const guardrailPrompt = buildGuardrailPrompt((agent?.metadata as any)?.guardrail_level || 'default');
  const systemPrompt = [
    agent?.system_prompt,
    guardrailPrompt,
    canvasSystemPrompt,
    ORDER_SYSTEM_PROMPT,
    WIDGET_SYSTEM_PROMPT + widgetCaveat,
  ].filter(Boolean).join('\n\n');

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(history || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  const canvasTools = buildCanvasTools(canvases);
  const orderTool = buildOrderTool();
  const allTools = [...canvasTools, orderTool];
  const modelId = agent?.model_id || 'gpt-4o-mini';

  const stream = await openai.chat.completions.create({
    model: modelId,
    messages,
    temperature: agent?.temperature ?? 0.7,
    stream: true,
    stream_options: { include_usage: true },
    tools: allTools,
  });

  let fullContent = '';
  let toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
  let usage: { prompt_tokens: number; completion_tokens: number } | null = null;
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          // Capture usage from final chunk
          if (chunk.usage) {
            usage = { prompt_tokens: chunk.usage.prompt_tokens, completion_tokens: chunk.usage.completion_tokens };
          }

          const choice = chunk.choices[0];
          if (!choice) continue;

          // Stream text content
          const delta = choice.delta?.content || '';
          if (delta) {
            fullContent += delta;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }

          // Accumulate tool calls
          if (choice.delta?.tool_calls) {
            for (const tc of choice.delta.tool_calls) {
              const idx = tc.index;
              if (idx !== undefined) {
                if (!toolCalls[idx]) toolCalls[idx] = { id: '', name: '', arguments: '' };
                if (tc.id) toolCalls[idx].id = tc.id;
                if (tc.function?.name) toolCalls[idx].name = tc.function.name;
                if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
              }
            }
          }
        }

        // Parse widgets from text content
        const { text: textAfterWidgets, widgets } = parseWidgets(fullContent);

        // Process tool calls
        let canvasWidgets: any[] = [];
        let toolMessage = '';
        for (const tc of toolCalls) {
          if (!tc) continue;
          if (tc.name === 'show_canvas') {
            try {
              const args = JSON.parse(tc.arguments);
              const { data } = await serviceClient
                .from('canvas_layouts')
                .select('layout_json, name')
                .eq('id', args.canvas_id)
                .eq('is_active', true)
                .single();
              if (data?.layout_json && Array.isArray((data.layout_json as any).elements)) {
                canvasWidgets.push(...(data.layout_json as any).elements);
              }
              if (args.message) toolMessage = args.message;
            } catch {}
          } else if (tc.name === 'create_order') {
            try {
              const args = JSON.parse(tc.arguments);
              const result = await processCreateOrder({
                supabase: serviceClient,
                args,
                workspaceId: session.workspace_id,
                agentId: session.agent_id,
                conversationId: convId,
                sessionId: session.id,
              });
              if (result.success && result.order) {
                const origin = new URL(req.url).origin;
                toolMessage = formatOrderConfirmation(result.order, origin);
              } else {
                toolMessage = 'Maaf, terjadi kesalahan saat membuat pesanan. Silakan coba lagi.';
              }
            } catch {
              toolMessage = 'Maaf, terjadi kesalahan saat membuat pesanan. Silakan coba lagi.';
            }
          }
        }

        // Determine final text
        let finalText = textAfterWidgets;
        if (!finalText && toolMessage) {
          finalText = toolMessage;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: toolMessage })}\n\n`));
        }

        const allWidgets = [...widgets, ...canvasWidgets];

        // Save assistant message
        const { data: saved } = await serviceClient.from('chat_messages').insert({
          conversation_id: convId, session_id: session.id,
          role: 'assistant', content: finalText, widgets: allWidgets,
        }).select().single();

        // Record token usage (non-blocking)
        if (usage) {
          recordTokenUsage(serviceClient, {
            workspaceId: session.workspace_id,
            agentId: session.agent_id,
            modelId,
            tokensPrompt: usage.prompt_tokens,
            tokensCompletion: usage.completion_tokens,
            sessionId: session.id,
            conversationId: convId,
          }).catch(() => {});
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, message: saved, conversationId: convId })}\n\n`));
        controller.close();
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
