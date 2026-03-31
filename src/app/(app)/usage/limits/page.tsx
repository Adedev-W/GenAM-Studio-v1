"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, AlertTriangle, Trash2, Loader2, Bot, Hash, Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

interface TokenLimit {
  id: string;
  name: string;
  agent_id: string | null;
  agents?: { name: string } | null;
  monthly_token_limit: number;
  current_tokens_used: number;
  alert_threshold_pct: number;
  is_active: boolean;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const PRESET_LIMITS = [
  { label: "100K", value: 100_000 },
  { label: "500K", value: 500_000 },
  { label: "1M", value: 1_000_000 },
  { label: "5M", value: 5_000_000 },
  { label: "10M", value: 10_000_000 },
];

export default function TokenLimitsPage() {
  const [limits, setLimits] = useState<TokenLimit[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    agent_id: "",
    monthly_token_limit: "",
    alert_threshold_pct: "80",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/token-limits").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
    ])
      .then(([l, a]) => {
        setLimits(Array.isArray(l) ? l : []);
        setAgents(Array.isArray(a) ? a : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createLimit() {
    const res = await fetch("/api/token-limits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        agent_id: form.agent_id || null,
        monthly_token_limit: parseInt(form.monthly_token_limit),
        alert_threshold_pct: parseInt(form.alert_threshold_pct),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setLimits((prev) => [data, ...prev]);
      setCreateOpen(false);
      setForm({ name: "", agent_id: "", monthly_token_limit: "", alert_threshold_pct: "80" });
    }
  }

  async function deleteLimit(id: string) {
    await fetch(`/api/token-limits/${id}`, { method: "DELETE" });
    setLimits((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/usage">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title="Token Limit" description="Atur batas penggunaan token per workspace atau agent">
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Limit
          </Button>
        </PageHeader>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : limits.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Belum ada token limit"
          description="Buat limit untuk mengontrol penggunaan token workspace atau per agent"
        >
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Limit
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {limits.map((l) => {
            const pct = l.monthly_token_limit > 0
              ? Math.min((l.current_tokens_used / l.monthly_token_limit) * 100, 100)
              : 0;
            const isWarning = pct >= l.alert_threshold_pct;
            return (
              <Card key={l.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{l.name || "Token Limit"}</p>
                        {isWarning && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {l.agents?.name || "Semua Agent"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            l.is_active
                              ? "text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "text-[10px]"
                          }
                        >
                          {l.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteLimit(l.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {fmt(l.current_tokens_used)} terpakai
                      </span>
                      <span className="font-medium font-mono text-xs">
                        {fmt(l.monthly_token_limit)} limit
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2 ${isWarning ? "[&>div]:bg-amber-500" : ""}`}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {pct.toFixed(0)}% terpakai · Peringatan di {l.alert_threshold_pct}%
                      {isWarning && (
                        <span className="text-amber-500 ml-1">— Mendekati limit!</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Token Limit</DialogTitle>
            <DialogDescription>
              Atur batas token bulanan untuk workspace atau agent tertentu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                placeholder="cth. Limit Bulanan Workspace"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Agent (opsional)</Label>
              <Select
                value={form.agent_id}
                onValueChange={(v) => setForm((f) => ({ ...f, agent_id: v === "all" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua agent (workspace)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua agent</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limit Token Bulanan</Label>
              <NumberInput
                placeholder="1000000"
                value={form.monthly_token_limit}
                onChange={(e) => setForm((f) => ({ ...f, monthly_token_limit: e.target.value }))}
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LIMITS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, monthly_token_limit: String(p.value) }))
                    }
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      form.monthly_token_limit === String(p.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/50 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Peringatan di (%)</Label>
              <NumberInput
                min="1"
                max="100"
                value={form.alert_threshold_pct}
                onChange={(e) =>
                  setForm((f) => ({ ...f, alert_threshold_pct: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              variant="ghost"
              className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
              onClick={createLimit}
              disabled={!form.name || !form.monthly_token_limit}
            >
              Buat Limit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
