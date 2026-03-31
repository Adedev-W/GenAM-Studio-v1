"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bot, Search, Filter, MoreHorizontal, Trash2, Copy, Loader2, Wand2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorAlert } from "@/components/common/error-alert";
import { useApiError } from "@/hooks/use-api-error";
import { apiFetch } from "@/lib/api";
import type { Agent } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  const { error, handleError, clearError } = useApiError();

  useEffect(() => {
    apiFetch<Agent[]>('/api/agents')
      .then(data => setAgents(Array.isArray(data) ? data : []))
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [handleError]);

  const filtered = agents.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      const data = await apiFetch<Agent>('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Agen Baru", agent_type: "assistant",
          model_provider: "openai", model_id: "gpt-4o-mini",
          temperature: 0.7, max_tokens: 4096, environment: "prod",
          status: "draft", tools: [], metadata: {},
        }),
      });
      router.push(`/agents/${data.id}`);
    } catch (err) {
      handleError(err);
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAgent) return;
    try {
      await apiFetch(`/api/agents/${deleteAgent.id}`, { method: 'DELETE' });
      setAgents(prev => prev.filter(a => a.id !== deleteAgent.id));
      setDeleteAgent(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleDuplicate = async (agent: Agent) => {
    try {
      const data = await apiFetch<Agent>('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${agent.name} (Copy)`, description: agent.description,
          agent_type: agent.agent_type, model_provider: agent.model_provider,
          model_id: agent.model_id, system_prompt: agent.system_prompt,
          temperature: agent.temperature, max_tokens: agent.max_tokens,
          environment: "prod", status: "draft", tools: agent.tools || [], metadata: {},
        }),
      });
      setAgents(prev => [data, ...prev]);
    } catch (err) {
      handleError(err);
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
      <PageHeader title="Agen" description="Buat, kelola, dan deploy AI agent kamu">
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" disabled={creating} onClick={handleCreateNew}>
          {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Buat Agen Baru
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

      {error && <ErrorAlert error={error} onDismiss={clearError} className="mb-4" />}

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
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bot} title="Belum ada agen" description="Buat AI agent pertamamu untuk memulai">
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" disabled={creating} onClick={handleCreateNew}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Buat Agen Baru
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
