import { createClient } from '@supabase/supabase-js';

type TriggerType = 'order_created' | 'order_status_changed' | 'chat_keyword' | 'new_customer' | 'schedule' | 'token_limit';

interface TriggerEvent {
  type: TriggerType;
  workspaceId: string;
  data: Record<string, any>;
}

function createServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Main entry point — call this from API routes when an event happens.
 * It finds all matching active workflows and executes them.
 */
export async function triggerWorkflows(event: TriggerEvent): Promise<void> {
  try {
    const supabase = createServiceSupabase();

    // Find active workflows matching this trigger type and workspace
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('workspace_id', event.workspaceId)
      .eq('is_active', true)
      .eq('trigger_type', event.type);

    if (error) {
      console.error('[WorkflowEngine] Query error:', error);
      return;
    }
    if (!workflows || workflows.length === 0) {
      console.log(`[WorkflowEngine] No active workflows for type=${event.type} workspace=${event.workspaceId}`);
      return;
    }
    console.log(`[WorkflowEngine] Found ${workflows.length} workflow(s) for type=${event.type}`);

    // Execute each matching workflow (non-blocking)
    await Promise.allSettled(
      workflows.map(wf => executeWorkflow(supabase, wf, event))
    );
  } catch (err) {
    console.error('[WorkflowEngine] triggerWorkflows error:', err);
  }
}

async function executeWorkflow(supabase: any, wf: any, event: TriggerEvent) {
  try {
    console.log(`[WorkflowEngine] Executing workflow "${wf.name}" (${wf.id}), trigger=${wf.trigger_type}, action=${wf.action_type}`);

    // 1. Check trigger config match
    if (!matchesTriggerConfig(wf, event)) {
      console.log(`[WorkflowEngine] Skipped: trigger config mismatch for "${wf.name}"`);
      await logExecution(supabase, wf, event, false, 'skipped', null, 'Trigger config tidak cocok');
      return;
    }

    // 2. Check condition
    const conditionMet = evaluateCondition(wf, event.data);
    if (!conditionMet) {
      console.log(`[WorkflowEngine] Skipped: condition not met for "${wf.name}"`);
      await logExecution(supabase, wf, event, false, 'skipped', null, 'Kondisi tidak terpenuhi');
      return;
    }

    // 3. Execute action
    console.log(`[WorkflowEngine] Running action "${wf.action_type}" for "${wf.name}"`);
    const result = await executeAction(supabase, wf, event);
    console.log(`[WorkflowEngine] Action result for "${wf.name}":`, JSON.stringify(result));

    // 4. Log success
    await logExecution(supabase, wf, event, true, 'success', result, null);

    // 5. Update workflow stats
    await supabase
      .from('workflows')
      .update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: (wf.trigger_count || 0) + 1,
      })
      .eq('id', wf.id);

  } catch (err: any) {
    console.error(`[WorkflowEngine] Error executing "${wf.name}":`, err.message);
    await logExecution(supabase, wf, event, true, 'failed', null, err.message);
  }
}

function matchesTriggerConfig(wf: any, event: TriggerEvent): boolean {
  const config = wf.trigger_config || {};

  switch (event.type) {
    case 'order_status_changed': {
      if (config.from_status && event.data.from_status !== config.from_status) return false;
      if (config.to_status && event.data.to_status !== config.to_status) return false;
      return true;
    }
    case 'chat_keyword': {
      if (!config.keyword || !event.data.message) return false;
      const msg = event.data.message.toLowerCase();
      const keyword = config.keyword.toLowerCase();
      if (config.match_type === 'exact') return msg === keyword;
      return msg.includes(keyword);
    }
    case 'token_limit': {
      const threshold = config.threshold_percent || 80;
      return (event.data.usage_percent || 0) >= threshold;
    }
    default:
      return true; // order_created, new_customer, schedule — no extra config needed
  }
}

function evaluateCondition(wf: any, data: Record<string, any>): boolean {
  if (!wf.condition_field || !wf.condition_operator) return true; // no condition = always pass

  const fieldValue = getNestedValue(data, wf.condition_field);
  const compareValue = wf.condition_value;

  switch (wf.condition_operator) {
    case '<': return Number(fieldValue) < Number(compareValue);
    case '>': return Number(fieldValue) > Number(compareValue);
    case '=': return String(fieldValue) === String(compareValue);
    case 'contains': return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
    default: return true;
  }
}

function getNestedValue(obj: any, path: string): any {
  // Supports "order.total", "customer.order_count" etc.
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

async function executeAction(supabase: any, wf: any, event: TriggerEvent): Promise<any> {
  const config = wf.action_config || {};

  switch (wf.action_type) {
    case 'send_message':
      return await actionSendMessage(supabase, wf, config, event);

    case 'update_order_status':
      return await actionUpdateOrderStatus(supabase, config, event);

    case 'notify_webhook':
      return await actionNotifyWebhook(config, wf, event);

    case 'auto_reply':
      return await actionAutoReply(supabase, config, event);

    case 'assign_agent':
      return await actionAssignAgent(supabase, config, event);

    default:
      return { message: 'Action type tidak dikenal' };
  }
}

async function resolveSessionId(supabase: any, event: TriggerEvent): Promise<string | null> {
  const sessionId = event.data.session_id || event.data.chat_session_id;
  if (sessionId) return sessionId;

  const conversationId = event.data.conversation_id;
  if (!conversationId) return null;

  const { data } = await supabase
    .from('chat_conversations')
    .select('session_id')
    .eq('id', conversationId)
    .single();
  return data?.session_id || null;
}

async function actionSendMessage(supabase: any, wf: any, config: any, event: TriggerEvent) {
  const message = config.message || 'Pesan otomatis dari automasi';

  const conversationId = event.data.conversation_id;
  if (!conversationId) {
    return { sent: false, reason: 'Tidak ada conversation_id' };
  }
  const sessionId = await resolveSessionId(supabase, event);
  if (!sessionId) {
    return { sent: false, reason: 'Tidak ada session_id (lookup dari conversation gagal)' };
  }

  const { data: inserted, error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    session_id: sessionId,
    role: 'assistant',
    content: message,
  }).select().single();

  if (error) {
    console.error('[WorkflowEngine] actionSendMessage insert error:', error);
    return { sent: false, reason: error.message };
  }

  // Broadcast to realtime so chat UI updates instantly
  const channel = supabase.channel(`chat:${sessionId}`);
  await channel.subscribe();
  await channel.send({ type: 'broadcast', event: 'automation_message', payload: { id: inserted.id, role: 'assistant', content: message, widgets: [] } });
  supabase.removeChannel(channel);

  return { sent: true, message, conversation_id: conversationId };
}

async function actionUpdateOrderStatus(supabase: any, config: any, event: TriggerEvent) {
  const orderId = event.data.order_id || event.data.id;
  const newStatus = config.new_status;
  if (!orderId || !newStatus) return { updated: false, reason: 'Missing order_id or new_status' };

  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('id, status, order_number')
    .single();

  if (!error && data) {
    // Log status change
    await supabase.from('order_status_log').insert({
      order_id: orderId,
      from_status: event.data.status || event.data.from_status,
      to_status: newStatus,
      note: `Otomatis oleh automasi`,
    });
  }

  return { updated: !error, order: data };
}

async function actionNotifyWebhook(config: any, wf: any, event: TriggerEvent) {
  const url = config.webhook_url;
  if (!url) return { sent: false, reason: 'Webhook URL tidak ada' };

  const payload = {
    workflow_id: wf.id,
    workflow_name: wf.name,
    trigger_type: event.type,
    trigger_data: event.data,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    return { sent: true, status: res.status };
  } catch (err: any) {
    return { sent: false, error: err.message };
  }
}

async function actionAutoReply(supabase: any, config: any, event: TriggerEvent) {
  const message = config.message || 'Balasan otomatis';
  const conversationId = event.data.conversation_id;
  if (!conversationId) return { sent: false, reason: 'Tidak ada conversation_id' };
  const sessionId = await resolveSessionId(supabase, event);
  if (!sessionId) return { sent: false, reason: 'Tidak ada session_id (lookup dari conversation gagal)' };

  const { data: inserted, error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    session_id: sessionId,
    role: 'assistant',
    content: message,
  }).select().single();

  if (error) {
    console.error('[WorkflowEngine] actionAutoReply insert error:', error);
    return { sent: false, reason: error.message };
  }

  // Broadcast to realtime so chat UI updates instantly
  const channel = supabase.channel(`chat:${sessionId}`);
  await channel.subscribe();
  await channel.send({ type: 'broadcast', event: 'automation_message', payload: { id: inserted.id, role: 'assistant', content: message, widgets: [] } });
  supabase.removeChannel(channel);

  return { sent: true, message };
}

async function actionAssignAgent(supabase: any, config: any, event: TriggerEvent) {
  const agentId = config.agent_id;
  if (!agentId) return { assigned: false, reason: 'Agent belum dipilih' };

  // If there's a chat session, update its agent
  const sessionId = await resolveSessionId(supabase, event);
  if (sessionId) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ agent_id: agentId })
      .eq('id', sessionId);
    return { assigned: !error, agent_id: agentId, session_id: sessionId };
  }

  return { assigned: false, reason: 'Tidak ada session untuk di-assign' };
}

async function logExecution(
  supabase: any, wf: any, event: TriggerEvent,
  conditionMet: boolean, status: string, result: any, error: string | null
) {
  const { error: logError } = await supabase.from('workflow_logs').insert({
    workflow_id: wf.id,
    workspace_id: event.workspaceId,
    trigger_data: { type: event.type, data: event.data },
    condition_met: conditionMet,
    action_result: result || {},
    status,
    error,
  });
  if (logError) {
    console.error('[WorkflowEngine] Failed to write log:', logError);
  }
}
