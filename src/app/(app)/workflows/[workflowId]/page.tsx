"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow, Background, Controls, type Node, type Edge,
  type OnNodesChange, type OnEdgesChange, type NodeMouseHandler,
  applyNodeChanges, applyEdgeChanges, MarkerType, ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft, Save, Play, Loader2, Zap, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, SkipForward, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AutomationNode } from "@/components/workflows/automation-node";
import { FlowToolbar } from "@/components/workflows/flow-toolbar";
import { ConfigPanel } from "@/components/workflows/config-panel";
import { useToast } from "@/hooks/use-toast";

const TRIGGER_LABELS: Record<string, string> = {
  order_created: "Pesanan Masuk",
  order_status_changed: "Status Berubah",
  chat_keyword: "Keyword Chat",
  new_customer: "Pelanggan Baru",
  schedule: "Jadwal",
  token_limit: "Token Limit",
};

const ACTION_LABELS: Record<string, string> = {
  send_message: "Kirim Pesan",
  update_order_status: "Update Status",
  notify_webhook: "Notify Webhook",
  auto_reply: "Balas Otomatis",
  assign_agent: "Assign Agent",
};

function getSubLabel(type: string, config: any): string {
  if (!type) return "Klik untuk konfigurasi";
  if (type === "chat_keyword" && config?.keyword) return `"${config.keyword}"`;
  if (type === "order_status_changed" && config?.to_status) return `→ ${config.to_status}`;
  if (type === "schedule" && config?.frequency) return `${config.frequency} ${config.time || "08:00"}`;
  if (type === "send_message" && config?.message) return config.message.slice(0, 30) + (config.message.length > 30 ? "..." : "");
  if (type === "notify_webhook" && config?.webhook_url) return config.webhook_url.slice(0, 30) + "...";
  return "Klik untuk konfigurasi";
}

function buildNodes(wf: any): Node[] {
  return [
    {
      id: "trigger",
      type: "automationNode",
      position: { x: 50, y: 120 },
      data: {
        nodeType: "trigger",
        label: TRIGGER_LABELS[wf.trigger_type] || "Trigger",
        subLabel: getSubLabel(wf.trigger_type, wf.trigger_config),
        subType: wf.trigger_type,
        configured: !!wf.trigger_type,
      },
    },
    {
      id: "condition",
      type: "automationNode",
      position: { x: 350, y: 120 },
      data: {
        nodeType: "condition",
        label: wf.condition_field ? `${wf.condition_field} ${wf.condition_operator} ${wf.condition_value}` : "Kondisi",
        subLabel: wf.condition_field ? "Filter aktif" : "Opsional — klik untuk set",
        configured: !!wf.condition_field,
      },
    },
    {
      id: "action",
      type: "automationNode",
      position: { x: 650, y: 120 },
      data: {
        nodeType: "action",
        label: ACTION_LABELS[wf.action_type] || "Aksi",
        subLabel: getSubLabel(wf.action_type, wf.action_config),
        subType: wf.action_type,
        configured: !!wf.action_type,
      },
    },
  ];
}

const EDGES: Edge[] = [
  {
    id: "trigger-condition",
    source: "trigger",
    target: "condition",
    type: "smoothstep",
    animated: true,
    style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
  },
  {
    id: "condition-action",
    source: "condition",
    target: "action",
    type: "smoothstep",
    animated: true,
    style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
  },
];

function WorkflowDetailInner() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const workflowId = params.workflowId as string;

  const [wf, setWf] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>("trigger");
  const [locked, setLocked] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [name, setName] = useState("");

  // Editable fields
  const [triggerType, setTriggerType] = useState("");
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  const [conditionField, setConditionField] = useState("");
  const [conditionOperator, setConditionOperator] = useState("");
  const [conditionValue, setConditionValue] = useState("");
  const [actionType, setActionType] = useState("");
  const [actionConfig, setActionConfig] = useState<any>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/workflows/${workflowId}`).then(r => r.json()),
      fetch("/api/agents").then(r => r.json()),
    ]).then(([data, a]) => {
      setWf(data);
      setName(data.name || "");
      setTriggerType(data.trigger_type || "");
      setTriggerConfig(data.trigger_config || {});
      setConditionField(data.condition_field || "");
      setConditionOperator(data.condition_operator || "");
      setConditionValue(data.condition_value || "");
      setActionType(data.action_type || "");
      setActionConfig(data.action_config || {});
      setAgents(Array.isArray(a) ? a : []);
    }).catch(() => {
      toast({ title: "Gagal memuat data", variant: "destructive" });
    }).finally(() => setLoading(false));
  }, [workflowId]);

  // Build nodes from current state
  const currentState = useMemo(() => ({
    trigger_type: triggerType,
    trigger_config: triggerConfig,
    condition_field: conditionField,
    condition_operator: conditionOperator,
    condition_value: conditionValue,
    action_type: actionType,
    action_config: actionConfig,
  }), [triggerType, triggerConfig, conditionField, conditionOperator, conditionValue, actionType, actionConfig]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>(EDGES);

  useEffect(() => {
    setNodes(buildNodes(currentState));
  }, [currentState]);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    if (locked) return;
    setNodes(nds => applyNodeChanges(changes, nds));
  }, [locked]);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node.id);
  }, []);

  const nodeTypes = useMemo(() => ({ automationNode: AutomationNode }), []);

  function handleConfigChange(field: string, value: any) {
    switch (field) {
      case "trigger_type": setTriggerType(value); break;
      case "trigger_config": setTriggerConfig(value); break;
      case "condition_field": setConditionField(value); break;
      case "condition_operator": setConditionOperator(value); break;
      case "condition_value": setConditionValue(value); break;
      case "action_type": setActionType(value); break;
      case "action_config": setActionConfig(value); break;
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          trigger_type: triggerType || null,
          trigger_config: triggerConfig,
          condition_field: conditionField || null,
          condition_operator: conditionOperator || null,
          condition_value: conditionValue || null,
          action_type: actionType || null,
          action_config: actionConfig,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWf(data);
        toast({ title: "Automasi tersimpan!" });
      }
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/test`, { method: "POST" });
      const data = await res.json();
      toast({
        title: data.success ? "Test Berhasil!" : "Test Gagal",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      if (showLogs) fetchLogs();
    } catch {
      toast({ title: "Test gagal", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  }

  async function toggleActive() {
    const res = await fetch(`/api/workflows/${workflowId}/toggle`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setWf(data);
    }
  }

  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/logs`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {}
    setLogsLoading(false);
  }

  useEffect(() => {
    if (showLogs) fetchLogs();
  }, [showLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!wf) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Automasi tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/workflows")}>Kembali</Button>
      </div>
    );
  }

  const selectedNodeType = selectedNode === "trigger" ? "trigger" : selectedNode === "condition" ? "condition" : "action";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/workflows")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-lg font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 w-[300px]"
          />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${wf.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted/30 text-muted-foreground border-border/30"}`}>
              {wf.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
            <Switch checked={wf.is_active} onCheckedChange={toggleActive} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5" />}
            Test
          </Button>
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            Simpan
          </Button>
        </div>
      </div>

      {/* Main layout: Canvas + Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 220px)" }}>
        {/* React Flow Canvas */}
        <div className="lg:col-span-2 rounded-2xl border border-border/50 overflow-hidden bg-muted/10 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.4 }}
            minZoom={0.5}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={!locked}
            className="!bg-transparent"
          >
            <Background gap={20} size={1} className="!stroke-border/30" />
            <FlowToolbar locked={locked} onToggleLock={() => setLocked(l => !l)} />
          </ReactFlow>
        </div>

        {/* Config Panel */}
        <div className="overflow-y-auto">
          <Card className="border-border/50 sticky top-0">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2">
                {/* Node selector tabs */}
                {(["trigger", "condition", "action"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedNode(t)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${selectedNode === t
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }
                    `}
                  >
                    {t === "trigger" ? "Trigger" : t === "condition" ? "Kondisi" : "Aksi"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ConfigPanel
                nodeType={selectedNodeType}
                triggerType={triggerType}
                triggerConfig={triggerConfig}
                conditionField={conditionField}
                conditionOperator={conditionOperator}
                conditionValue={conditionValue}
                actionType={actionType}
                actionConfig={actionConfig}
                agents={agents}
                onChange={handleConfigChange}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Execution Logs - Collapsible */}
      <Card className="border-border/50">
        <CardHeader className="p-4 pb-2">
          <button onClick={() => setShowLogs(!showLogs)} className="flex items-center justify-between w-full">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" /> Log Eksekusi
              {logs.length > 0 && (
                <Badge variant="outline" className="text-xs">{logs.length}</Badge>
              )}
            </CardTitle>
            {showLogs ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        {showLogs && (
          <CardContent className="p-4 pt-2">
            {logsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground font-light text-center py-6">Belum ada log eksekusi</p>
            ) : (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : log.status === "skipped" ? (
                      <SkipForward className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">
                        {log.status === "success" ? "Berhasil" : log.status === "skipped" ? "Dilewati" : "Gagal"}
                        {log.error && <span className="text-muted-foreground font-light"> — {log.error}</span>}
                      </p>
                      {log.trigger_data?.dry_run && (
                        <Badge variant="outline" className="text-[10px] mt-0.5 bg-amber-500/10 text-amber-500 border-amber-500/20">Dry Run</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-light shrink-0">
                      {new Date(log.executed_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function WorkflowDetailPage() {
  return (
    <ReactFlowProvider>
      <WorkflowDetailInner />
    </ReactFlowProvider>
  );
}
