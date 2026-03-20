// ==================== Core / Auth ====================
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  workspace_id: string;
  display_name: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
  updated_at: string;
}

// ==================== Agent Lifecycle ====================
export type AgentStatus = 'draft' | 'active' | 'paused' | 'archived';
export type AgentType = 'assistant' | 'workflow' | 'autonomous';
export type Environment = 'dev' | 'staging' | 'prod';

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  status: AgentStatus;
  agent_type: AgentType;
  model_provider: string;
  model_id: string;
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  tools: any[];
  metadata: Record<string, any>;
  environment: Environment;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentVersion {
  id: string;
  agent_id: string;
  version_number: number;
  snapshot: Record<string, any>;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AgentTemplate {
  id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  config: Record<string, any>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Prompts & Workflows ====================
export interface Prompt {
  id: string;
  agent_id: string | null;
  workspace_id: string;
  name: string;
  content: string;
  version: number;
  is_active: boolean;
  variables: any[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptTest {
  id: string;
  prompt_id: string;
  input: Record<string, any>;
  expected_output: string | null;
  actual_output: string | null;
  score: number | null;
  model_id: string | null;
  variant: 'A' | 'B' | 'control';
  tokens_used: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface Workflow {
  id: string;
  agent_id: string | null;
  workspace_id: string;
  name: string;
  description: string | null;
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'archived';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'prompt' | 'tool_call' | 'condition' | 'loop' | 'transform';
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed';
  input: Record<string, any> | null;
  output: Record<string, any> | null;
  step_results: any[];
  error: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

// ==================== Monitoring ====================
export interface Conversation {
  id: string;
  agent_id: string | null;
  workspace_id: string;
  external_user_id: string | null;
  channel: string | null;
  metadata: Record<string, any>;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls: any | null;
  tokens_prompt: number;
  tokens_completion: number;
  latency_ms: number | null;
  model_id: string | null;
  created_at: string;
}

export interface UsageMetric {
  id: string;
  agent_id: string | null;
  workspace_id: string;
  timestamp: string;
  requests: number;
  tokens_prompt: number;
  tokens_completion: number;
  latency_avg_ms: number;
  latency_p99_ms: number;
  errors: number;
  cost_usd: number;
  period: 'minute' | 'hour' | 'day';
  created_at: string;
}

export interface AlertRule {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  name: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '=';
  threshold: number;
  severity: Severity;
  notification_channels: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  rule_name: string | null;
  condition: Record<string, any> | null;
  severity: Severity;
  status: 'active' | 'acknowledged' | 'resolved';
  message: string | null;
  triggered_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface ErrorLog {
  id: string;
  agent_id: string | null;
  workspace_id: string;
  error_type: string | null;
  message: string | null;
  stack_trace: string | null;
  request_context: Record<string, any> | null;
  created_at: string;
}

// ==================== Security & Governance ====================
export interface AuditLog {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  actor?: Profile;
}

export interface GovernancePolicy {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  policy_type: 'content_filter' | 'data_masking' | 'rate_limit' | 'access_control';
  rules: any[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRecord {
  id: string;
  workspace_id: string;
  regulation: string;
  status: 'compliant' | 'non_compliant' | 'in_review';
  evidence: Record<string, any>;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Integrations ====================
export interface Integration {
  id: string;
  workspace_id: string;
  name: string;
  type: 'api' | 'database' | 'webhook' | 'plugin';
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  source_type: 'upload' | 'url' | 'database';
  embedding_model: string;
  chunk_size: number;
  status: 'processing' | 'ready' | 'error';
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  knowledge_base_id: string;
  filename: string;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number;
  chunk_count: number;
  status: 'pending' | 'processed' | 'error';
  created_at: string;
}

export interface Webhook {
  id: string;
  workspace_id: string;
  url: string;
  events: string[];
  secret: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Cost ====================
export interface Budget {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  monthly_limit_usd: number;
  alert_threshold_pct: number;
  current_spend_usd: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface CostEntry {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  model_id: string | null;
  tokens_prompt: number;
  tokens_completion: number;
  cost_usd: number;
  timestamp: string;
  created_at: string;
}

// ==================== Evaluation & Collaboration ====================
export interface Evaluation {
  id: string;
  agent_id: string | null;
  workspace_id: string;
  name: string;
  eval_type: 'benchmark' | 'human_review' | 'automated';
  dataset: any[];
  results: Record<string, any>;
  score: number | null;
  status: 'pending' | 'running' | 'completed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  message_id: string | null;
  agent_id: string | null;
  workspace_id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  submitted_by: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  workspace_id: string;
  resource_type: string;
  resource_id: string;
  author_id: string | null;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  replies?: Comment[];
}

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  resource_type: string | null;
  resource_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

// ==================== Canvas ====================
export interface CanvasLayout {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  name: string;
  description: string | null;
  layout_json: CanvasLayoutJson;
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CanvasLayoutJson {
  elements: CanvasElement[];
}

export interface CanvasElement {
  id: string;
  type: 'card' | 'image' | 'text' | 'button' | 'table' | 'chart' | 'form' | 'carousel' | 'list';
  props: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
  children?: CanvasElement[];
  binding_id?: string;
  conditions?: CanvasCondition[];
}

export interface CanvasCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | 'contains' | 'empty';
  value: any;
  action: 'show' | 'hide' | 'highlight' | 'disable';
}

export interface CanvasInteraction {
  id: string;
  layout_id: string;
  conversation_id: string | null;
  event_type: 'click' | 'scroll' | 'form_submit' | 'dwell';
  element_id: string | null;
  element_type: string | null;
  metadata: Record<string, any>;
  timestamp: string;
  created_at: string;
}

export interface CanvasDataBinding {
  id: string;
  layout_id: string;
  element_id: string;
  source_type: 'database' | 'api' | 'knowledge_base' | 'realtime';
  source_config: Record<string, any>;
  refresh_interval_ms: number;
  created_at: string;
  updated_at: string;
}

// ==================== Legacy types (kept for backward compat) ====================
export interface PolicyRule {
  id: string;
  condition: string;
  action: string;
  priority: number;
  description: string;
  createdBy: 'user' | 'ai';
}

export type TimeSeriesData = {
  time: string;
  cpu: number;
  memory: number;
}

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type EventStatus = 'active' | 'investigating' | 'mitigated' | 'resolved';

export interface SecurityMetricCard {
  label: string;
  value: number;
  delta: number;
  icon: string;
}

export interface ThreatTimeSeriesPoint {
  time: string;
  alerts: number;
  threats: number;
  incidents: number;
}

export interface ThreatCategory {
  name: string;
  count: number;
  percentage: number;
}

export interface SecurityEvent {
  id: string;
  title: string;
  description: string;
  severity: ThreatSeverity;
  status: EventStatus;
  source: string;
  timestamp: string;
  ip: string;
}

export interface AiInsight {
  label: string;
  value: number;
  unit: string;
  description: string;
  progress: number;
}
