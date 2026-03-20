"use client";

import { useState, useEffect } from "react";
import { Plus, Bot, Search, Filter, MoreHorizontal, Pencil, Trash2, Copy, Rocket, Loader2, Wand2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { Agent, AgentType, Environment } from "@/lib/types";

const agentTypeLabels: Record<string, string> = {
  assistant: "Assistant", workflow: "Workflow", autonomous: "Autonomous",
};

const envColors: Record<string, string> = {
  dev: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  staging: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  prod: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<AgentType>("assistant");
  const [formModel, setFormModel] = useState("gpt-4o");
  const [formPrompt, setFormPrompt] = useState("");
  const [formTemp, setFormTemp] = useState("0.7");
  const [formEnv, setFormEnv] = useState<Environment>("dev");

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => setAgents(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.agent_type !== typeFilter) return false;
    return true;
  });

  const resetForm = () => {
    setFormName(""); setFormDesc(""); setFormType("assistant"); setFormModel("gpt-4o");
    setFormPrompt(""); setFormTemp("0.7"); setFormEnv("dev");
  };

  const handleCreate = async () => {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName, description: formDesc || null, agent_type: formType,
        model_provider: "openai", model_id: formModel, system_prompt: formPrompt || null,
        temperature: parseFloat(formTemp), max_tokens: 4096, environment: formEnv,
        status: "draft", tools: [], metadata: {},
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAgents(prev => [data, ...prev]);
      setCreateOpen(false);
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!editAgent) return;
    const res = await fetch(`/api/agents/${editAgent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName, description: formDesc || null, agent_type: formType,
        model_id: formModel, system_prompt: formPrompt || null,
        temperature: parseFloat(formTemp), environment: formEnv,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAgents(prev => prev.map(a => a.id === editAgent.id ? data : a));
      setEditAgent(null);
      resetForm();
    }
  };

  const openEdit = (agent: Agent) => {
    setFormName(agent.name); setFormDesc(agent.description || ""); setFormType(agent.agent_type);
    setFormModel(agent.model_id); setFormPrompt(agent.system_prompt || ""); setFormTemp(String(agent.temperature));
    setFormEnv(agent.environment);
    setEditAgent(agent);
  };

  const handleDelete = async () => {
    if (!deleteAgent) return;
    await fetch(`/api/agents/${deleteAgent.id}`, { method: 'DELETE' });
    setAgents(prev => prev.filter(a => a.id !== deleteAgent.id));
    setDeleteAgent(null);
  };

  const handleDuplicate = async (agent: Agent) => {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${agent.name} (Copy)`, description: agent.description,
        agent_type: agent.agent_type, model_provider: agent.model_provider,
        model_id: agent.model_id, system_prompt: agent.system_prompt,
        temperature: agent.temperature, max_tokens: agent.max_tokens,
        environment: "dev", status: "draft", tools: agent.tools || [], metadata: {},
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAgents(prev => [data, ...prev]);
    }
  };

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    draft: agents.filter(a => a.status === 'draft').length,
    paused: agents.filter(a => a.status === 'paused').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" description="Create, manage, and deploy your AI agents">
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Agent
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: stats.total, color: "text-foreground" },
          { label: "Active", value: stats.active, color: "text-emerald-500" },
          { label: "Draft", value: stats.draft, color: "text-slate-400" },
          { label: "Paused", value: stats.paused, color: "text-amber-500" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
              <p className={`text-3xl font-thin mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="assistant">Assistant</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="autonomous">Autonomous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bot} title="No agents found" description="Create your first AI agent to get started">
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Agent
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => (
            <Card key={agent.id} className="group border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/agents/${agent.id}`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground font-light truncate">{agent.model_id}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `/agents/${agent.id}`; }}><Wand2 className="mr-2 h-4 w-4" /> Buka Builder</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(agent); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(agent); }}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteAgent(agent); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-xs text-muted-foreground font-light line-clamp-2 mb-3 min-h-[2rem]">
                  {agent.description || "No description"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={agent.status} />
                  <Badge variant="outline" className="text-xs font-medium">{agentTypeLabels[agent.agent_type] || agent.agent_type}</Badge>
                  <Badge variant="outline" className={`text-xs font-medium ${envColors[agent.environment] || ''}`}>{agent.environment}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground font-light">Updated {new Date(agent.updated_at).toLocaleDateString()}</span>
                  <span className="text-xs text-muted-foreground font-light">{agent.temperature}T / {agent.max_tokens} tok</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen || !!editAgent} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditAgent(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-semibold">{editAgent ? "Edit Agent" : "Create New Agent"}</DialogTitle>
            <DialogDescription className="font-light">{editAgent ? "Update your agent configuration" : "Configure your new AI agent"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-sm">Name</Label>
              <Input placeholder="My AI Agent" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">Description</Label>
              <Textarea placeholder="What does this agent do?" value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Type</Label>
                <Select value={formType} onValueChange={v => setFormType(v as AgentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assistant">Assistant</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="autonomous">Autonomous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Model</Label>
                <Select value={formModel} onValueChange={setFormModel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                    <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                    <SelectItem value="gpt-4.1-nano">GPT-4.1 Nano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-sm">Temperature</Label>
                <Input type="number" step="0.1" min="0" max="2" value={formTemp} onChange={e => setFormTemp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Environment</Label>
                <Select value={formEnv} onValueChange={v => setFormEnv(v as Environment)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dev">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="prod">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">System Prompt</Label>
              <Textarea placeholder="You are a helpful AI assistant..." value={formPrompt} onChange={e => setFormPrompt(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditAgent(null); resetForm(); }}>Cancel</Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={editAgent ? handleEdit : handleCreate} disabled={!formName}>
              {editAgent ? "Save Changes" : "Create Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteAgent}
        onOpenChange={() => setDeleteAgent(null)}
        title="Delete Agent"
        description={`Are you sure you want to delete "${deleteAgent?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
