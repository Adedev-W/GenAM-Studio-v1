"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Search, Layout, MoreHorizontal, Pencil, Trash2, Eye,
  MousePointer2, BarChart3, Loader2, Sparkles, LayoutTemplate,
  LayoutGrid, List, Filter, ShoppingBag, UtensilsCrossed, Receipt,
  Building2, HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { useToast } from "@/hooks/use-toast";

const CANVAS_TEMPLATES = [
  {
    name: "Katalog Produk",
    description: "Tampilkan daftar produk dengan harga dan gambar",
    icon: ShoppingBag,
    elements: [
      { id: "el_1", type: "heading", label: "Judul", props: { content: "Katalog Produk Kami", level: "h2" } },
      { id: "el_2", type: "separator", label: "", props: {} },
      { id: "el_3", type: "card", label: "Produk 1", props: { title: "Nama Produk", subtitle: "Kategori", body: "Deskripsi produk dan harga\nRp 50.000" } },
      { id: "el_4", type: "card", label: "Produk 2", props: { title: "Nama Produk 2", subtitle: "Kategori", body: "Deskripsi produk dan harga\nRp 75.000" } },
      { id: "el_5", type: "button", label: "CTA", props: { text: "Pesan Sekarang", variant: "default", size: "lg" } },
    ],
  },
  {
    name: "Menu Restoran",
    description: "Daftar menu dengan kategori dan harga",
    icon: UtensilsCrossed,
    elements: [
      { id: "el_1", type: "heading", label: "Header", props: { content: "Menu Kami", level: "h2" } },
      { id: "el_2", type: "badge", label: "Promo", props: { text: "Promo Hari Ini!", color: "amber" } },
      { id: "el_3", type: "list", label: "Makanan", props: { items: "Nasi Goreng Spesial — Rp 25.000\nMie Ayam Bakso — Rp 20.000\nSoto Ayam — Rp 18.000", numbered: true } },
      { id: "el_4", type: "list", label: "Minuman", props: { items: "Es Teh Manis — Rp 5.000\nJus Alpukat — Rp 12.000\nKopi Susu — Rp 15.000", numbered: true } },
      { id: "el_5", type: "alert", label: "Info", props: { title: "Gratis Ongkir", message: "Untuk pemesanan di atas Rp 50.000", type: "success" } },
    ],
  },
  {
    name: "Price List",
    description: "Tabel harga layanan atau paket",
    icon: Receipt,
    elements: [
      { id: "el_1", type: "heading", label: "Header", props: { content: "Daftar Harga", level: "h2" } },
      { id: "el_2", type: "table", label: "Harga", props: { columns: "Layanan,Durasi,Harga", rows: "Potong Rambut,30 menit,Rp 35.000\nCreambath,60 menit,Rp 75.000\nSmooting,120 menit,Rp 200.000" } },
      { id: "el_3", type: "stat", label: "Promo", props: { label: "Diskon Member", value: "20%", delta: "Hemat hingga Rp 40.000", trend: "up" } },
      { id: "el_4", type: "button", label: "CTA", props: { text: "Booking Sekarang", variant: "default" } },
    ],
  },
  {
    name: "Profil Bisnis",
    description: "Informasi lengkap tentang bisnis kamu",
    icon: Building2,
    elements: [
      { id: "el_1", type: "heading", label: "Nama", props: { content: "Nama Bisnis Anda", level: "h1" } },
      { id: "el_2", type: "text", label: "Tagline", props: { content: "Tagline bisnis anda di sini", size: "lg", weight: "light", color: "muted" } },
      { id: "el_3", type: "separator", label: "", props: {} },
      { id: "el_4", type: "text", label: "Deskripsi", props: { content: "Ceritakan tentang bisnis anda, sejarah, visi misi, dan keunggulan.", size: "sm" } },
      { id: "el_5", type: "stat", label: "Pengalaman", props: { label: "Tahun Berdiri", value: "2020", delta: "5+ tahun pengalaman", trend: "up" } },
      { id: "el_6", type: "alert", label: "Kontak", props: { title: "Hubungi Kami", message: "WhatsApp: 08xx-xxxx-xxxx\nEmail: info@bisnis.com", type: "info" } },
    ],
  },
  {
    name: "FAQ Interaktif",
    description: "Pertanyaan umum dengan jawaban",
    icon: HelpCircle,
    elements: [
      { id: "el_1", type: "heading", label: "Header", props: { content: "Pertanyaan Umum (FAQ)", level: "h2" } },
      { id: "el_2", type: "card", label: "Q1", props: { title: "Bagaimana cara memesan?", body: "Anda bisa memesan melalui WhatsApp atau langsung di toko kami. Pembayaran bisa transfer atau COD." } },
      { id: "el_3", type: "card", label: "Q2", props: { title: "Berapa lama pengiriman?", body: "Pengiriman dalam kota 1-2 hari kerja. Luar kota 3-5 hari kerja via ekspedisi." } },
      { id: "el_4", type: "card", label: "Q3", props: { title: "Apakah bisa retur?", body: "Bisa! Retur dalam 7 hari sejak barang diterima dengan kondisi barang masih utuh." } },
      { id: "el_5", type: "button", label: "CTA", props: { text: "Tanya Lainnya", variant: "outline" } },
    ],
  },
];

export default function CanvasPage() {
  const [layouts, setLayouts] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', agent_id: '' });
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generateAgentId, setGenerateAgentId] = useState("none");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/canvas').then(r => r.json()),
      fetch('/api/agents').then(r => r.json()),
    ]).then(([c, a]) => {
      setLayouts(Array.isArray(c) ? c : []);
      setAgents(Array.isArray(a) ? a : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function createLayout() {
    const res = await fetch('/api/canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, agent_id: form.agent_id || null, is_active: false, elements: [] }),
    });
    if (res.ok) {
      const data = await res.json();
      setLayouts(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ name: '', description: '', agent_id: '' });
    }
  }

  async function deleteLayout(id: string) {
    await fetch(`/api/canvas/${id}`, { method: 'DELETE' });
    setLayouts(prev => prev.filter(l => l.id !== id));
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/canvas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatePrompt, agent_id: generateAgentId === 'none' ? null : generateAgentId }),
      });
      if (!res.ok) {
        let msg = 'Gagal generate canvas';
        try { const err = await res.json(); msg = err.error || msg; } catch { msg = `Server error (${res.status})`; }
        throw new Error(msg);
      }
      const data = await res.json();
      window.location.href = `/canvas/${data.id}`;
    } catch (err: any) {
      toast({ title: "Gagal generate", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function createFromTemplate(template: typeof CANVAS_TEMPLATES[0]) {
    const res = await fetch('/api/canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        description: template.description,
        elements: template.elements,
        is_active: false,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/canvas/${data.id}`;
    }
  }

  const filtered = layouts.filter(l => {
    if (statusFilter === "active" && !l.is_active) return false;
    if (statusFilter === "draft" && l.is_active) return false;
    if (search && !l.name?.toLowerCase().includes(search.toLowerCase()) && !l.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const active = layouts.filter(l => l.is_active).length;
  const totalInteractions = layouts.reduce((s: number, l: any) => s + (l.interaction_count || 0), 0);

  function renderDropdown(l: any) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/canvas/${l.id}`}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => deleteLayout(l.id)}>
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Response Canvas" description="Desain layout interaktif yang bisa ditampilkan agent di chat" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: layouts.length },
          { label: "Active", value: active },
          { label: "Draft", value: layouts.length - active },
          { label: "Interactions", value: totalInteractions.toLocaleString() },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-thin">{s.value}</p>
              <p className="text-xs text-muted-foreground font-light">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Buat Baru
        </Button>
        <Button variant="outline" size="sm" onClick={() => setGenerateOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" /> Generate AI
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
          <LayoutTemplate className="mr-2 h-4 w-4" /> Template
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari canvas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 w-[180px] text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border/50 rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Layout className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Belum ada canvas</h3>
            <p className="text-sm text-muted-foreground mt-1">Buat layout interaktif yang bisa ditampilkan agent di chat</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Buat Kosong
            </Button>
            <Button variant="outline" onClick={() => setGenerateOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> Generate AI
            </Button>
            <Button variant="outline" onClick={() => setTemplateOpen(true)}>
              <LayoutTemplate className="mr-2 h-4 w-4" /> Dari Template
            </Button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="border border-border/50 rounded-lg divide-y divide-border/50">
          {filtered.map(l => (
            <Link key={l.id} href={`/canvas/${l.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                  <Layout className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{l.name}</p>
                  {l.description && <p className="text-xs text-muted-foreground truncate">{l.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-muted-foreground hidden sm:inline">{(l.layout_json?.elements || []).length} elements</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">{(l.interaction_count || 0).toLocaleString()} views</span>
                <Badge variant="outline" className={l.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs" : "text-xs"}>
                  {l.is_active ? 'active' : 'draft'}
                </Badge>
                <div onClick={e => e.preventDefault()}>
                  {renderDropdown(l)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(l => (
            <Card key={l.id} className="border-border/50 hover:border-primary/30 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layout className="h-4 w-4 text-primary" />
                  </div>
                  {renderDropdown(l)}
                </div>

                <h3 className="text-sm font-semibold">{l.name}</h3>
                {l.description && <p className="text-xs text-muted-foreground font-light mt-1 line-clamp-2">{l.description}</p>}

                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MousePointer2 className="h-3 w-3" /> {(l.layout_json?.elements || []).length} elements</span>
                  <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {(l.interaction_count || 0).toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className={l.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs" : "text-xs"}>
                    {l.is_active ? 'active' : 'draft'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                    <Link href={`/canvas/${l.id}`}><Eye className="mr-1 h-3 w-3" /> Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Canvas Baru</DialogTitle>
            <DialogDescription>Buat layout canvas kosong untuk mulai mendesain</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input placeholder="Contoh: Katalog Produk" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea placeholder="Apa yang ditampilkan layout ini?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Agent (opsional)</Label>
              <Select value={form.agent_id} onValueChange={v => setForm(f => ({ ...f, agent_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Tidak ada agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada agent</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={createLayout} disabled={!form.name}>Buat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate AI Dialog */}
      <Dialog open={generateOpen} onOpenChange={o => { setGenerateOpen(o); if (!o) { setGeneratePrompt(""); setGenerateAgentId("none"); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Generate Canvas dengan AI
            </DialogTitle>
            <DialogDescription>Deskripsikan layout yang kamu inginkan dan AI akan membuatnya otomatis.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Deskripsi Canvas</Label>
              <Textarea
                placeholder="Contoh: Buat katalog produk dengan 3 item makanan, harga, dan tombol pesan"
                value={generatePrompt}
                onChange={e => setGeneratePrompt(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Katalog produk dengan harga", "Menu restoran", "Price list jasa", "FAQ interaktif", "Profil bisnis"].map(s => (
                <button
                  key={s}
                  onClick={() => setGeneratePrompt(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Agent (opsional)</Label>
              <Select value={generateAgentId} onValueChange={setGenerateAgentId}>
                <SelectTrigger><SelectValue placeholder="Tidak ada agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada agent</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Batal</Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={handleGenerate} disabled={!generatePrompt.trim() || generating}>
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pilih Template</DialogTitle>
            <DialogDescription>Mulai dari template siap pakai, lalu sesuaikan di editor.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {CANVAS_TEMPLATES.map(t => (
              <button
                key={t.name}
                onClick={() => createFromTemplate(t)}
                className="text-left p-4 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <t.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold">{t.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.elements.length} widgets</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
