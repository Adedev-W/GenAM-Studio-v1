"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Search, MoreHorizontal, Trash2, Loader2, Zap,
  ShoppingCart, MessageSquare, UserPlus, Clock, Gauge,
  ArrowRightLeft, Send, Bell, Bot, CheckCircle2, XCircle,
  Copy, Play, Sparkles, Heart, AlertTriangle, Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

const TRIGGER_TYPES = [
  { value: "order_created", label: "Pesanan Masuk", icon: ShoppingCart, desc: "Setiap ada pesanan baru", color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "order_status_changed", label: "Status Pesanan Berubah", icon: ArrowRightLeft, desc: "Saat status order berubah", color: "text-violet-500", bg: "bg-violet-500/10" },
  { value: "chat_keyword", label: "Keyword di Chat", icon: MessageSquare, desc: "Pelanggan mengetik kata tertentu", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { value: "new_customer", label: "Pelanggan Baru", icon: UserPlus, desc: "Pelanggan pertama kali terdaftar", color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "schedule", label: "Jadwal", icon: Clock, desc: "Berjalan otomatis sesuai jadwal", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { value: "token_limit", label: "Token Limit", icon: Gauge, desc: "Usage mendekati batas token", color: "text-red-500", bg: "bg-red-500/10" },
];

const ACTION_TYPES = [
  { value: "send_message", label: "Kirim Pesan", icon: Send, desc: "Kirim pesan ke pelanggan" },
  { value: "update_order_status", label: "Update Status Order", icon: ArrowRightLeft, desc: "Ubah status pesanan otomatis" },
  { value: "notify_webhook", label: "Notify Webhook", icon: Bell, desc: "Kirim notifikasi ke URL external" },
  { value: "auto_reply", label: "Balas Otomatis", icon: MessageSquare, desc: "Agent balas otomatis via chat" },
  { value: "assign_agent", label: "Assign Agent", icon: Bot, desc: "Assign ke agent tertentu" },
];

const TEMPLATES = [
  {
    name: "Auto-Konfirmasi Pesanan Kecil",
    description: "Konfirmasi otomatis pesanan dengan total di bawah Rp100.000",
    icon: ShoppingCart,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    trigger_type: "order_created",
    trigger_config: {},
    condition_field: "order.total",
    condition_operator: "<",
    condition_value: "100000",
    action_type: "update_order_status",
    action_config: { new_status: "confirmed" },
  },
  {
    name: "Eskalasi Komplain",
    description: "Notify owner via webhook saat pelanggan mengetik 'komplain'",
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    trigger_type: "chat_keyword",
    trigger_config: { keyword: "komplain", match_type: "contains" },
    condition_field: "",
    condition_operator: "",
    condition_value: "",
    action_type: "notify_webhook",
    action_config: { webhook_url: "" },
  },
  {
    name: "Ucapan Terima Kasih",
    description: "Kirim pesan terima kasih otomatis saat order selesai",
    icon: Heart,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    trigger_type: "order_status_changed",
    trigger_config: { to_status: "completed" },
    condition_field: "",
    condition_operator: "",
    condition_value: "",
    action_type: "send_message",
    action_config: { message: "Terima kasih sudah belanja! Semoga puas dengan pesanannya 😊 Jangan lupa order lagi ya!" },
  },
  {
    name: "Sapaan Pelanggan Baru",
    description: "Kirim pesan selamat datang saat pelanggan baru terdaftar",
    icon: UserPlus,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    trigger_type: "new_customer",
    trigger_config: {},
    condition_field: "",
    condition_operator: "",
    condition_value: "",
    action_type: "send_message",
    action_config: { message: "Hai! Selamat datang 👋 Ada yang bisa kami bantu?" },
  },
  {
    name: "Alert Stok Habis",
    description: "Balas otomatis saat pelanggan tanya soal stok yang habis",
    icon: Package,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    trigger_type: "chat_keyword",
    trigger_config: { keyword: "stok", match_type: "contains" },
    condition_field: "",
    condition_operator: "",
    condition_value: "",
    action_type: "auto_reply",
    action_config: { message: "Mohon maaf, untuk saat ini stok produk tersebut sedang habis. Kami akan kabari begitu tersedia kembali!" },
  },
  {
    name: "Peringatan Token Limit",
    description: "Notify saat penggunaan token mendekati 80% batas",
    icon: Gauge,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    trigger_type: "token_limit",
    trigger_config: { threshold_percent: 80 },
    condition_field: "",
    condition_operator: "",
    condition_value: "",
    action_type: "notify_webhook",
    action_config: { webhook_url: "" },
  },
];

function getTriggerMeta(type: string) {
  return TRIGGER_TYPES.find(t => t.value === type);
}

function timeAgo(date: string) {
  if (!date) return "-";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", agent_id: "",
    trigger_type: "", action_type: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/workflows").then(r => r.json()),
      fetch("/api/agents").then(r => r.json()),
    ]).then(([w, a]) => {
      setWorkflows(Array.isArray(w) ? w : []);
      setAgents(Array.isArray(a) ? a : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function createWorkflow() {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        agent_id: form.agent_id || null,
        trigger_type: form.trigger_type || null,
        action_type: form.action_type || null,
        status: "draft",
        is_active: false,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setWorkflows(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ name: "", description: "", agent_id: "", trigger_type: "", action_type: "" });
    }
  }

  async function toggleWorkflow(id: string) {
    const res = await fetch(`/api/workflows/${id}/toggle`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setWorkflows(prev => prev.map(w => w.id === id ? data : w));
    }
  }

  async function deleteWorkflow() {
    if (!deleteId) return;
    await fetch(`/api/workflows/${deleteId}`, { method: "DELETE" });
    setWorkflows(prev => prev.filter(w => w.id !== deleteId));
    setDeleteId(null);
  }

  async function useFromTemplate(tpl: typeof TEMPLATES[0]) {
    setCreatingTemplate(tpl.name);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tpl.name,
          description: tpl.description,
          trigger_type: tpl.trigger_type,
          trigger_config: tpl.trigger_config,
          condition_field: tpl.condition_field || null,
          condition_operator: tpl.condition_operator || null,
          condition_value: tpl.condition_value || null,
          action_type: tpl.action_type,
          action_config: tpl.action_config,
          status: "active",
          is_active: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(prev => [data, ...prev]);
      }
    } catch {}
    setCreatingTemplate(null);
  }

  const filtered = workflows.filter(w =>
    !search || w.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.is_active).length,
    todayRuns: workflows.reduce((s, w) => s + (w.trigger_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Automasi" description="Otomatiskan proses bisnis berdasarkan event">
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Buat Automasi
        </Button>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Aktif", value: stats.active, color: "text-emerald-500" },
          { label: "Dijalankan", value: stats.todayRuns, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-thin ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-light">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Template Populer</h3>
          <p className="text-xs text-muted-foreground font-light">— klik untuk langsung buat</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map(tpl => {
            const isCreating = creatingTemplate === tpl.name;
            const alreadyExists = workflows.some(w => w.name === tpl.name);
            return (
              <button
                key={tpl.name}
                onClick={() => !alreadyExists && !isCreating && useFromTemplate(tpl)}
                disabled={alreadyExists || isCreating}
                className={`
                  group relative text-left p-4 rounded-xl border transition-all
                  ${alreadyExists
                    ? "border-border/30 opacity-50 cursor-not-allowed"
                    : "border-border/50 hover:border-primary/30 hover:bg-primary/[0.02] cursor-pointer"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${tpl.bg} shrink-0 group-hover:scale-110 transition-transform`}>
                    <tpl.icon className={`h-4 w-4 ${tpl.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground font-light mt-0.5 line-clamp-2">{tpl.description}</p>
                  </div>
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                  {alreadyExists && (
                    <Badge variant="outline" className="text-[10px] shrink-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Dibuat</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari automasi..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Zap} title="Belum ada automasi" description="Buat automasi pertama untuk mengotomatiskan bisnis kamu">
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Buat Automasi
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {filtered.map(wf => {
            const trigger = getTriggerMeta(wf.trigger_type);
            const TriggerIcon = trigger?.icon || Zap;
            return (
              <Card key={wf.id} className="border-border/50 hover:border-border/80 transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`p-2.5 rounded-xl ${trigger?.bg || "bg-primary/10"} shrink-0`}>
                      <TriggerIcon className={`h-5 w-5 ${trigger?.color || "text-primary"}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link href={`/workflows/${wf.id}`} className="text-sm font-semibold hover:underline truncate">
                          {wf.name}
                        </Link>
                        {wf.is_active ? (
                          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Aktif</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-muted/30 text-muted-foreground border-border/30">Nonaktif</Badge>
                        )}
                      </div>
                      {wf.description && (
                        <p className="text-xs text-muted-foreground font-light truncate max-w-md">{wf.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-light">
                        {trigger && <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{trigger.label}</span>}
                        {wf.trigger_count > 0 && <span>Dijalankan {wf.trigger_count}x</span>}
                        {wf.last_triggered_at && <span>Terakhir: {timeAgo(wf.last_triggered_at)}</span>}
                      </div>
                    </div>

                    {/* Toggle + Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={wf.is_active}
                        onCheckedChange={() => toggleWorkflow(wf.id)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/workflows/${wf.id}`}><Play className="mr-2 h-3.5 w-3.5" /> Buka</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(wf.id)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Automasi Baru</DialogTitle>
            <DialogDescription>Otomatiskan proses bisnis berdasarkan trigger event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Automasi</Label>
              <Input placeholder="contoh: Auto-Konfirmasi Pesanan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi <span className="text-muted-foreground font-normal text-xs">(opsional)</span></Label>
              <Textarea placeholder="Jelaskan apa yang dilakukan automasi ini..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={form.trigger_type} onValueChange={v => setForm(f => ({ ...f, trigger_type: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih trigger..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih nanti</SelectItem>
                  {TRIGGER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aksi</Label>
              <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih aksi..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih nanti</SelectItem>
                  {ACTION_TYPES.map(a => (
                    <SelectItem key={a.value} value={a.value}>
                      <span className="flex items-center gap-2">{a.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agent <span className="text-muted-foreground font-normal text-xs">(opsional)</span></Label>
              <Select value={form.agent_id} onValueChange={v => setForm(f => ({ ...f, agent_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Tanpa agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa agent</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={createWorkflow} disabled={!form.name}>
              Buat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        title="Hapus Automasi"
        description="Automasi ini akan dihapus permanen. Semua log eksekusi juga akan hilang."
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={deleteWorkflow}
      />
    </div>
  );
}
