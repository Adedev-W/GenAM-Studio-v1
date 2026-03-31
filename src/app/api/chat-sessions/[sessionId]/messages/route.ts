import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessContext } from '@/lib/queries/helpers';
import { getBusinessOpenAIClient } from '@/lib/openai/workspace-client';
import { recordTokenUsage, checkTokenLimit } from '@/lib/openai/record-usage';
import { buildCanvasTools } from '@/lib/openai/canvas-tool';
import { buildOrderTool, buildPrepareOrderTool, processCreateOrder, formatOrderConfirmation, buildOrderConfirmationWidget } from '@/lib/openai/order-tool';
import { buildProductSearchTool, processProductSearch } from '@/lib/openai/product-tool';
import { buildOrderCheckTool, processOrderCheck } from '@/lib/openai/order-check-tool';
import { buildCancelOrderTool, processCancelOrder } from '@/lib/openai/order-cancel-tool';
import { buildFullSystemPrompt } from '@/lib/openai/agent-prompt-builder';
import { analyzeIntent, buildToolChoice } from '@/lib/openai/intent-analyzer';
import { buildSuggestActionsTool, parseSuggestActions } from '@/lib/openai/action-tool';
import { triggerWorkflows } from '@/lib/workflows/engine';

export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { businessId } = await getBusinessContext(supabase);
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    // Verify session belongs to business
    const { data: session } = await supabase
      .from('chat_sessions').select('id').eq('id', sessionId).eq('business_id', businessId).single();
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let query = supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (conversationId) query = query.eq('conversation_id', conversationId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { businessId, userId } = await getBusinessContext(supabase);
    const body = await req.json();
    const { content, conversationId } = body;

    // Get session + agent
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('*, agents(name, model_id, system_prompt, temperature, metadata)')
      .eq('id', sessionId).eq('business_id', businessId).single();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const { data: conv } = await supabase.from('chat_conversations')
        .insert({ session_id: sessionId, user_identifier: userId })
        .select().single();
      convId = conv?.id;
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      conversation_id: convId, session_id: sessionId, role: 'user', content,
    });

    // Trigger automasi: chat_keyword
    triggerWorkflows({
      type: 'chat_keyword',
      businessId,
      data: {
        message: content,
        conversation_id: convId,
        session_id: sessionId,
        chat_session_id: sessionId,
      },
    }).catch((err) => console.error('[Automasi] chat_keyword trigger failed:', err));

    // Get history for context
    const { data: history } = await supabase.from('chat_messages')
      .select('role, content').eq('conversation_id', convId).order('created_at', { ascending: true }).limit(20);

    // Check token limit before proceeding
    const limitCheck = await checkTokenLimit(supabase, businessId, session.agent_id);
    if (limitCheck.exceeded) {
      return NextResponse.json({ error: limitCheck.message }, { status: 429 });
    }

    // Build OpenAI messages
    const agent = session.agents as any;
    const D = '[Agent Debug][private]';

    console.log(`${D} ========== NEW MESSAGE ==========`);
    console.log(`${D} User message: "${content}"`);
    console.log(`${D} Session: ${sessionId} | Business: ${businessId} | ConvId: ${convId}`);
    console.log(`${D} Agent: ${agent?.name || 'unnamed'} | model_id saved: ${agent?.model_id || 'NULL'} | temperature: ${agent?.temperature}`);
    console.log(`${D} Agent metadata:`, JSON.stringify(agent?.metadata || {}, null, 2));

    // Build canvas tools from equipped canvases
    let canvases: Array<{ id: string; name: string; description: string | null; layout_json?: any }> = [];
    const canvasIds = (agent?.metadata as any)?.canvas_ids;
    console.log(`${D} Canvas IDs from metadata: ${JSON.stringify(canvasIds)}`);
    if (Array.isArray(canvasIds) && canvasIds.length > 0) {
      const { data: canvasData } = await supabase
        .from('canvas_layouts')
        .select('id, name, description, layout_json')
        .in('id', canvasIds)
        .eq('is_active', true);
      if (canvasData && canvasData.length > 0) {
        canvases = canvasData;
      }
      console.log(`${D} Canvas query result: ${canvasData?.length || 0} found → ${canvases.length} active`);
      canvases.forEach(c => console.log(`${D}   Canvas: "${c.name}" (${c.id}) — ${(c.layout_json?.elements || []).length} elements`));
    } else {
      console.log(`${D} NO CANVAS EQUIPPED — agent will NOT have show_canvas tool`);
    }

    // Build system prompt via centralized prompt builder
    const systemPrompt = buildFullSystemPrompt({
      basePrompt: agent?.system_prompt,
      guardrailLevel: (agent?.metadata as any)?.guardrail_level,
      canvases,
    });
    console.log(`${D} System prompt length: ${systemPrompt.length} chars`);
    console.log(`${D} System prompt contains DAFTAR_PRODUK_START: ${systemPrompt.includes('DAFTAR_PRODUK_START')}`);
    console.log(`${D} System prompt preview (first 500):`, systemPrompt.substring(0, 500));

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];
    console.log(`${D} Total messages to LLM: ${messages.length} (1 system + ${(history || []).length} history)`);

    // Stream OpenAI response
    const { client: openai } = await getBusinessOpenAIClient();
    const canvasTools = buildCanvasTools(canvases);
    const orderTool = buildOrderTool();
    const productSearchTool = buildProductSearchTool();
    const orderCheckTool = buildOrderCheckTool();
    const cancelOrderTool = buildCancelOrderTool();
    const prepareOrderTool = buildPrepareOrderTool();
    const suggestActionsTool = buildSuggestActionsTool();
    const allTools = [...canvasTools, orderTool, prepareOrderTool, productSearchTool, orderCheckTool, cancelOrderTool, suggestActionsTool];
    const modelId = agent?.model_id || 'gpt-4.1';

    console.log(`${D} Model: ${modelId} (raw: ${agent?.model_id || 'NULL → fallback gpt-4.1'})`);
    console.log(`${D} Tools available: [${allTools.map((t: any) => t.function?.name).join(', ')}] (${allTools.length} total)`);
    console.log(`${D} Canvas tools count: ${canvasTools.length}`);

    // Intent analysis — force tool_choice when confidence is high
    const intentResult = analyzeIntent(content, canvases.length > 0);
    const { forcedTool } = intentResult;
    const toolChoice = buildToolChoice(forcedTool, allTools);

    console.log(`${D} Intent analysis:`, JSON.stringify(intentResult));
    console.log(`${D} tool_choice sent to OpenAI:`, JSON.stringify(toolChoice));

    const stream = await openai.chat.completions.create({
      model: modelId,
      messages,
      temperature: agent?.temperature ?? 0.1,
      stream: true,
      stream_options: { include_usage: true },
      tools: allTools,
      tool_choice: toolChoice,
    });
    console.log(`${D} OpenAI stream started`);

    // Collect full response then save
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

          // Process tool calls
          console.log(`${D} --- Stream finished ---`);
          console.log(`${D} LLM text content: "${fullContent.substring(0, 200)}${fullContent.length > 200 ? '...' : ''}"`);
          console.log(`${D} LLM tool_calls: ${toolCalls.filter(Boolean).length} calls`);
          toolCalls.filter(Boolean).forEach((tc, i) => {
            console.log(`${D}   Tool call #${i}: ${tc.name}(${tc.arguments})`);
          });
          if (toolCalls.filter(Boolean).length === 0 && !fullContent) {
            console.log(`${D} WARNING: LLM returned NOTHING — no text, no tool calls`);
          }
          if (toolCalls.filter(Boolean).length === 0 && fullContent) {
            console.log(`${D} WARNING: LLM chose TEXT ONLY — ignored all tools`);
          }

          let canvasWidgets: any[] = [];
          let toolMessage = '';
          const toolResults: Array<{ tool_call_id: string; content: string }> = [];
          let needsFollowUp = false;
          let suggestedActions: any[] | null = null;

          for (const tc of toolCalls) {
            if (!tc) continue;
            if (tc.name === 'suggest_actions') {
              const parsed = parseSuggestActions(tc.arguments);
              if (parsed) {
                suggestedActions = parsed;
                console.log(`${D} suggest_actions → ${parsed.length} actions:`, JSON.stringify(parsed));
              } else {
                console.log(`${D} suggest_actions PARSE FAILED:`, tc.arguments);
              }
              continue;
            } else if (tc.name === 'show_canvas') {
              try {
                const args = JSON.parse(tc.arguments);
                console.log(`${D} Executing show_canvas → canvas_id: ${args.canvas_id}`);
                const { data } = await supabase
                  .from('canvas_layouts')
                  .select('layout_json, name')
                  .eq('id', args.canvas_id)
                  .eq('is_active', true)
                  .single();
                if (data?.layout_json && Array.isArray((data.layout_json as any).elements)) {
                  canvasWidgets.push(...(data.layout_json as any).elements);
                  console.log(`${D} show_canvas OK → ${(data.layout_json as any).elements.length} widgets loaded from "${data.name}"`);
                } else {
                  console.log(`${D} show_canvas FAIL → canvas not found or no elements. Data:`, data);
                }
                if (args.message) toolMessage = args.message;
              } catch (e: any) {
                console.log(`${D} show_canvas ERROR:`, e.message);
              }
            } else if (tc.name === 'prepare_order') {
              try {
                const args = JSON.parse(tc.arguments);
                console.log(`${D} Executing prepare_order → args:`, JSON.stringify(args));
                const confirmWidgets = buildOrderConfirmationWidget(args);
                canvasWidgets.push(...confirmWidgets);
                toolMessage = `Berikut ringkasan pesanan kamu. Silakan cek dan klik "Konfirmasi Pesanan" jika sudah benar.`;
                console.log(`${D} prepare_order OK → ${confirmWidgets.length} confirmation widgets`);
              } catch (e: any) {
                console.log(`${D} prepare_order ERROR:`, e.message);
                toolMessage = 'Maaf, terjadi kesalahan saat menyiapkan pesanan.';
              }
            } else if (tc.name === 'create_order') {
              try {
                const args = JSON.parse(tc.arguments);
                console.log(`${D} Executing create_order → args:`, JSON.stringify(args));
                const result = await processCreateOrder({
                  supabase,
                  args,
                  businessId,
                  agentId: session.agent_id,
                  conversationId: convId,
                  sessionId,
                });
                console.log(`${D} create_order result: success=${result.success}, order=${result.order?.order_number || 'none'}`);
                if (result.success && result.order) {
                  const origin = new URL(req.url).origin;
                  toolMessage = formatOrderConfirmation(result.order, origin);
                } else {
                  toolMessage = 'Maaf, terjadi kesalahan saat membuat pesanan. Silakan coba lagi.';
                }
              } catch (e: any) {
                console.log(`${D} create_order ERROR:`, e.message);
                toolMessage = 'Maaf, terjadi kesalahan saat membuat pesanan. Silakan coba lagi.';
              }
            } else if (tc.name === 'search_products') {
              try {
                const args = JSON.parse(tc.arguments);
                console.log(`${D} Executing search_products → args:`, JSON.stringify(args));
                const result = await processProductSearch(supabase, args, businessId);
                console.log(`${D} search_products result (first 300):`, result.substring(0, 300));
                toolResults.push({ tool_call_id: tc.id, content: result });
                needsFollowUp = true;
              } catch (e: any) {
                console.log(`${D} search_products ERROR:`, e.message);
                toolResults.push({ tool_call_id: tc.id, content: `Error: ${e.message}` });
                needsFollowUp = true;
              }
            } else if (tc.name === 'check_order') {
              try {
                const args = JSON.parse(tc.arguments);
                console.log(`${D} Executing check_order → args:`, JSON.stringify(args));
                const result = await processOrderCheck(supabase, args, businessId);
                console.log(`${D} check_order result (first 300):`, result.substring(0, 300));
                toolResults.push({ tool_call_id: tc.id, content: result });
                needsFollowUp = true;
              } catch (e: any) {
                console.log(`${D} check_order ERROR:`, e.message);
                toolResults.push({ tool_call_id: tc.id, content: `Error: ${e.message}` });
                needsFollowUp = true;
              }
            } else if (tc.name === 'cancel_order') {
              try {
                const args = JSON.parse(tc.arguments);
                console.log(`${D} Executing cancel_order → args:`, JSON.stringify(args));
                const result = await processCancelOrder(supabase, args, businessId, convId);
                console.log(`${D} cancel_order result (first 300):`, result.substring(0, 300));
                toolResults.push({ tool_call_id: tc.id, content: result });
                needsFollowUp = true;
              } catch (e: any) {
                console.log(`${D} cancel_order ERROR:`, e.message);
                toolResults.push({ tool_call_id: tc.id, content: `Error: ${e.message}` });
                needsFollowUp = true;
              }
            } else {
              console.log(`${D} UNKNOWN tool call: ${tc.name} — skipped`);
            }
          }

          // Multi-turn: if tools returned data, send back to LLM to compose response
          if (needsFollowUp && toolResults.length > 0) {
            console.log(`${D} --- Multi-turn follow-up ---`);
            console.log(`${D} Sending ${toolResults.length} tool results back to LLM`);
            // Add dummy results for non-multi-turn tools so OpenAI doesn't complain
            const allToolResults = [...toolResults];
            const handledIds = new Set(toolResults.map(tr => tr.tool_call_id));
            for (const tc of toolCalls.filter(Boolean)) {
              if (!handledIds.has(tc.id)) {
                allToolResults.push({ tool_call_id: tc.id, content: 'OK' });
              }
            }
            const followUpMessages = [
              ...messages,
              { role: 'assistant' as const, content: fullContent || null, tool_calls: toolCalls.filter(Boolean).map(tc => ({ id: tc.id, type: 'function' as const, function: { name: tc.name, arguments: tc.arguments } })) },
              ...allToolResults.map(tr => ({ role: 'tool' as const, tool_call_id: tr.tool_call_id, content: tr.content })),
            ];
            const followUp = await openai.chat.completions.create({
              model: modelId,
              messages: followUpMessages,
              temperature: agent?.temperature ?? 0.1,
            });
            const followUpContent = followUp.choices?.[0]?.message?.content || '';
            console.log(`${D} Follow-up LLM response (first 300): "${followUpContent.substring(0, 300)}"`);
            fullContent = followUpContent;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: followUpContent })}\n\n`));
            if (followUp.usage && usage) {
              usage.prompt_tokens += followUp.usage.prompt_tokens;
              usage.completion_tokens += followUp.usage.completion_tokens;
            }
          }

          // Determine final text
          let finalText = fullContent;
          if (!finalText && toolMessage) {
            finalText = toolMessage;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: toolMessage })}\n\n`));
          }

          // Fallback: jangan pernah kirim respons kosong
          if (!finalText && canvasWidgets.length === 0) {
            finalText = 'Hai! Ada yang bisa saya bantu?';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: finalText })}\n\n`));
            console.log(`${D} WARNING: Empty response detected — using fallback text`);
          }

          console.log(`${D} === FINAL RESPONSE ===`);
          console.log(`${D} Text: "${(finalText || '').substring(0, 300)}${(finalText || '').length > 300 ? '...' : ''}"`);
          console.log(`${D} Widgets: ${canvasWidgets.length} canvas widgets`);
          console.log(`${D} Suggested actions: ${suggestedActions ? JSON.stringify(suggestedActions) : 'none'}`);
          console.log(`${D} Usage: ${usage ? `${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion` : 'N/A'}`);

          // Save assistant message
          const { data: saved } = await supabase.from('chat_messages').insert({
            conversation_id: convId, session_id: sessionId,
            role: 'assistant', content: finalText, widgets: canvasWidgets,
            suggested_actions: suggestedActions,
          }).select().single();
          console.log(`${D} Message saved: ${saved?.id || 'FAILED'}`);

          // Update session message count
          await supabase.from('chat_sessions')
            .update({ message_count: (session.message_count || 0) + 2, updated_at: new Date().toISOString() })
            .eq('id', sessionId);

          // Record token usage (non-blocking)
          if (usage) {
            recordTokenUsage(supabase, {
              businessId,
              agentId: session.agent_id,
              modelId,
              tokensPrompt: usage.prompt_tokens,
              tokensCompletion: usage.completion_tokens,
              sessionId,
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
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
