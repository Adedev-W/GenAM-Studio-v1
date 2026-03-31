"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2,
  Type, Image, MousePointer, Table, BarChart3, FileInput,
  LayoutGrid, List, ToggleLeft, AlertCircle, Minus, ChevronDown,
  Code2, Loader2, CheckCircle, Sparkles, Star, Hash, Bot,
  MessageSquare, Clock, Tag, BarChart2, PieChart, TrendingUp, Copy,
} from "lucide-react";
import { WidgetPreview } from "@/components/widgets/widget-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { ErrorAlert } from "@/components/common/error-alert";
import { apiFetch } from "@/lib/api";

// ─── Widget Registry ───────────────────────────────────────────────
const WIDGET_GROUPS = [
  {
    label: "Konten",
    items: [
      { type: "text", label: "Teks", icon: Type, defaultProps: { content: "Tulis teks di sini", size: "base", weight: "normal", color: "default", align: "left" } },
      { type: "heading", label: "Judul", icon: Hash, defaultProps: { content: "Judul Section", level: "h2", color: "default" } },
      { type: "badge", label: "Badge", icon: Tag, defaultProps: { text: "Status", color: "blue" } },
      { type: "separator", label: "Divider", icon: Minus, defaultProps: { label: "" } },
    ],
  },
  {
    label: "Aksi",
    items: [
      { type: "button", label: "Tombol", icon: MousePointer, defaultProps: { text: "Klik di sini", variant: "default", size: "default", action: { type: "message", payload: "" } } },
      { type: "toggle", label: "Toggle", icon: ToggleLeft, defaultProps: { label: "Aktifkan fitur", checked: false, description: "" } },
      { type: "input", label: "Input", icon: FileInput, defaultProps: { placeholder: "Masukkan nilai...", label: "Field", type: "text", required: false } },
      { type: "select", label: "Pilihan", icon: ChevronDown, defaultProps: { label: "Pilih opsi", options: "Opsi 1\nOpsi 2\nOpsi 3", placeholder: "Pilih..." } },
    ],
  },
  {
    label: "Tampilan",
    items: [
      { type: "card", label: "Kartu", icon: LayoutGrid, defaultProps: { title: "Judul Kartu", subtitle: "Teks pendukung", body: "", showImage: false, imageUrl: "" } },
      { type: "alert", label: "Alert", icon: AlertCircle, defaultProps: { message: "Pesan penting di sini.", type: "info", title: "" } },
      { type: "stat", label: "Statistik", icon: BarChart2, defaultProps: { label: "Total Pengguna", value: "1.234", delta: "+12%", trend: "up" } },
      { type: "rating", label: "Rating", icon: Star, defaultProps: { value: 4, max: 5, label: "Beri nilai" } },
    ],
  },
  {
    label: "Data",
    items: [
      { type: "table", label: "Tabel", icon: Table, defaultProps: { columns: "Nama,Harga,Stok", rows: "Produk A,Rp 50.000,Ada\nProduk B,Rp 75.000,Habis" } },
      { type: "list", label: "Daftar", icon: List, defaultProps: { items: "Item pertama\nItem kedua\nItem ketiga", numbered: false } },
      { type: "code", label: "Kode", icon: Code2, defaultProps: { content: "// Kode di sini\nconsole.log('Hello');", language: "javascript" } },
    ],
  },
  {
    label: "Grafik",
    items: [
      { type: "bar_chart", label: "Bar Chart", icon: BarChart3, defaultProps: { title: "Penjualan", labels: "Jan,Feb,Mar,Apr", values: "40,65,30,80", color: "blue" } },
      { type: "line_chart", label: "Line Chart", icon: TrendingUp, defaultProps: { title: "Tren", labels: "Jan,Feb,Mar,Apr", values: "20,45,35,70", color: "emerald" } },
      { type: "pie_chart", label: "Pie Chart", icon: PieChart, defaultProps: { title: "Distribusi", labels: "A,B,C,D", values: "30,25,25,20" } },
    ],
  },
  {
    label: "Media",
    items: [
      { type: "image", label: "Gambar", icon: Image, defaultProps: { url: "", alt: "Gambar produk", caption: "" } },
    ],
  },
  {
    label: "AI",
    items: [
      { type: "chat_bubble", label: "Chat", icon: MessageSquare, defaultProps: { role: "assistant", content: "Halo! Ada yang bisa dibantu?", showAvatar: true } },
      { type: "thinking", label: "Thinking", icon: Sparkles, defaultProps: { steps: "Menganalisis permintaan\nMencari informasi\nMembuat respons" } },
      { type: "timestamp", label: "Waktu", icon: Clock, defaultProps: { format: "relative", label: "Terakhir diperbarui" } },
    ],
  },
];

const ALL_WIDGETS = WIDGET_GROUPS.flatMap(g => g.items);

// ─── Props Editor ──────────────────────────────────────────────────
function PropsEditor({ element, onChange }: { element: any; onChange: (props: Record<string, any>) => void }) {
  const update = (key: string, value: any) => onChange({ ...element.props, [key]: value });

  const field = (label: string, key: string, type: "text" | "textarea" | "select" | "boolean" | "number" = "text", opts?: string[]) => (
    <div className="space-y-1.5" key={key}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {type === "textarea" ? (
        <Textarea value={element.props[key] ?? ""} onChange={e => update(key, e.target.value)} rows={3} className="text-xs font-mono resize-none" />
      ) : type === "boolean" ? (
        <div className="flex items-center gap-2">
          <Switch checked={!!element.props[key]} onCheckedChange={v => update(key, v)} />
          <span className="text-xs text-muted-foreground">{element.props[key] ? "Ya" : "Tidak"}</span>
        </div>
      ) : type === "select" && opts ? (
        <Select value={String(element.props[key] ?? opts[0])} onValueChange={v => update(key, v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{opts.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
        </Select>
      ) : type === "number" ? (
        <NumberInput value={element.props[key] ?? 0} onChange={e => update(key, parseFloat(e.target.value))} className="h-8 text-xs" />
      ) : (
        <Input value={element.props[key] ?? ""} onChange={e => update(key, e.target.value)} className="h-8 text-xs" />
      )}
    </div>
  );

  switch (element.type) {
    case "text": return <div className="space-y-3">{field("Konten", "content", "textarea")}{field("Ukuran", "size", "select", ["xs", "sm", "base", "lg", "xl", "2xl"])}{field("Tebal", "weight", "select", ["light", "normal", "medium", "semibold", "bold"])}{field("Warna", "color", "select", ["default", "muted"])}{field("Rata", "align", "select", ["left", "center", "right"])}</div>;
    case "heading": return <div className="space-y-3">{field("Teks", "content")}{field("Level", "level", "select", ["h1", "h2", "h3", "h4"])}</div>;
    case "badge": return <div className="space-y-3">{field("Teks", "text")}{field("Warna", "color", "select", ["default", "blue", "green", "amber", "red", "purple"])}</div>;
    case "separator": return <div className="space-y-3">{field("Label (opsional)", "label")}</div>;
    case "button": {
      const action = element.props.action || { type: "message", payload: "" };
      const updateAction = (key: string, value: string) => {
        onChange({ ...element.props, action: { ...action, [key]: value } });
      };
      const actionLabels: Record<string, string> = { message: "Kirim Pesan", order: "Mulai Pesanan", link: "Buka Link", contact: "WhatsApp" };
      const payloadLabels: Record<string, string> = { message: "Teks pesan yang dikirim", order: "", link: "URL (https://...)", contact: "Nomor WA (628xxx)" };
      return (
        <div className="space-y-3">
          {field("Teks", "text")}
          {field("Varian", "variant", "select", ["default", "outline", "ghost", "destructive", "secondary"])}
          {field("Ukuran", "size", "select", ["sm", "default", "lg"])}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Aksi Tombol</label>
            <select
              value={action.type || "message"}
              onChange={e => updateAction("type", e.target.value)}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
            >
              {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {action.type !== "order" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{payloadLabels[action.type] || "Payload"}</label>
              <input
                value={action.payload || ""}
                onChange={e => updateAction("payload", e.target.value)}
                placeholder={payloadLabels[action.type] || ""}
                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
              />
            </div>
          )}
        </div>
      );
    }
    case "toggle": return <div className="space-y-3">{field("Label", "label")}{field("Deskripsi", "description")}{field("Status awal", "checked", "boolean")}</div>;
    case "input": return <div className="space-y-3">{field("Label", "label")}{field("Placeholder", "placeholder")}{field("Tipe", "type", "select", ["text", "email", "number", "password", "url"])}{field("Wajib diisi", "required", "boolean")}</div>;
    case "select": return <div className="space-y-3">{field("Label", "label")}{field("Placeholder", "placeholder")}{field("Opsi (satu per baris)", "options", "textarea")}</div>;
    case "card": return <div className="space-y-3">{field("Judul", "title")}{field("Subjudul", "subtitle")}{field("Isi", "body", "textarea")}{field("Tampilkan gambar", "showImage", "boolean")}{element.props.showImage && field("URL Gambar", "imageUrl")}</div>;
    case "alert": return <div className="space-y-3">{field("Judul (opsional)", "title")}{field("Pesan", "message", "textarea")}{field("Tipe", "type", "select", ["info", "success", "warning", "error"])}</div>;
    case "stat": return <div className="space-y-3">{field("Label", "label")}{field("Nilai", "value")}{field("Perubahan (mis. +12%)", "delta")}{field("Tren", "trend", "select", ["up", "down", "neutral"])}</div>;
    case "rating": return <div className="space-y-3">{field("Label", "label")}{field("Nilai", "value", "number")}{field("Maksimum", "max", "number")}</div>;
    case "table": return <div className="space-y-3"><p className="text-xs text-muted-foreground">Kolom: header dipisah koma</p>{field("Kolom", "columns")}<p className="text-xs text-muted-foreground">Baris: satu baris per line, nilai dipisah koma</p>{field("Baris", "rows", "textarea")}</div>;
    case "list": return <div className="space-y-3"><p className="text-xs text-muted-foreground">Satu item per baris</p>{field("Item", "items", "textarea")}{field("Bernomor", "numbered", "boolean")}</div>;
    case "code": return <div className="space-y-3">{field("Bahasa", "language", "select", ["javascript", "typescript", "python", "json", "bash", "sql", "css", "html"])}{field("Kode", "content", "textarea")}</div>;
    case "bar_chart": return <div className="space-y-3">{field("Judul", "title")}{field("Label (pisah koma)", "labels")}{field("Nilai (pisah koma)", "values")}{field("Warna", "color", "select", ["blue", "emerald", "amber", "purple"])}</div>;
    case "line_chart": return <div className="space-y-3">{field("Judul", "title")}{field("Label (pisah koma)", "labels")}{field("Nilai (pisah koma)", "values")}{field("Warna", "color", "select", ["blue", "emerald", "amber", "purple"])}</div>;
    case "pie_chart": return <div className="space-y-3">{field("Judul", "title")}{field("Label (pisah koma)", "labels")}{field("Nilai (pisah koma)", "values")}</div>;
    case "image": return <div className="space-y-3">{field("URL Gambar", "url")}{field("Alt text", "alt")}{field("Caption", "caption")}</div>;
    case "chat_bubble": return <div className="space-y-3">{field("Role", "role", "select", ["assistant", "user"])}{field("Konten", "content", "textarea")}{field("Tampilkan avatar", "showAvatar", "boolean")}</div>;
    case "thinking": return <div className="space-y-3"><p className="text-xs text-muted-foreground">Satu langkah per baris. Langkah terakhir = sedang proses.</p>{field("Langkah", "steps", "textarea")}</div>;
    case "timestamp": return <div className="space-y-3">{field("Label", "label")}{field("Format", "format", "select", ["relative", "absolute", "time", "date"])}</div>;
    default: return <p className="text-xs text-muted-foreground">Tidak ada properti untuk widget ini.</p>;
  }
}

// ─── Main Editor ───────────────────────────────────────────────────
export default function CanvasEditorPage() {
  const params = useParams();
  const layoutId = params.layoutId as string;
  const { toast } = useToast();
  const { error: apiError, handleError, clearError } = useApiError();

  const [layout, setLayout] = useState<any>(null);
  const [canvasName, setCanvasName] = useState("");
  const [canvasDescription, setCanvasDescription] = useState("");
  const [elements, setElements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Inspector state
  const [inspectorTab, setInspectorTab] = useState("preview");
  const [schemaText, setSchemaText] = useState("");
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const schemaEditingRef = useRef(false);
  const [mobilePanel, setMobilePanel] = useState<'palette' | 'inspector' | null>(null);

  const selected = elements.find(e => e.id === selectedId);

  // Load canvas
  useEffect(() => {
    apiFetch(`/api/canvas/${layoutId}`)
      .then(data => {
        setLayout(data);
        setCanvasName(data.name || "");
        setCanvasDescription(data.description || "");
        const raw = Array.isArray(data.layout_json?.elements) ? data.layout_json.elements : [];
        const els = raw.map((el: any) => ({
          ...el,
          label: typeof el.label === 'string' ? el.label : (el.label != null ? JSON.stringify(el.label) : ''),
          props: Object.fromEntries(
            Object.entries(el.props || {}).map(([k, v]) => [k, typeof v === 'object' && v !== null ? JSON.stringify(v) : v])
          ),
        }));
        setElements(els);
        setSchemaText(JSON.stringify(els, null, 2));
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [layoutId, handleError]);

  // Sync elements → schemaText (only when elements change from non-schema source)
  useEffect(() => {
    if (schemaEditingRef.current) {
      schemaEditingRef.current = false;
      return;
    }
    setSchemaText(JSON.stringify(elements, null, 2));
  }, [elements]);

  const handleSchemaEdit = useCallback((text: string) => {
    setSchemaText(text);
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        schemaEditingRef.current = true;
        setElements(parsed);
        setSchemaError(null);
      } else {
        setSchemaError("Schema harus berupa array of elements");
      }
    } catch {
      setSchemaError("JSON tidak valid — periksa sintaks");
    }
  }, []);

  const addWidget = (type: string) => {
    const def = ALL_WIDGETS.find(w => w.type === type);
    const newEl = {
      id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: def?.label || type,
      props: { ...(def?.defaultProps || {}) },
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    setInspectorTab("props");
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateProps = (props: Record<string, any>) => {
    setElements(prev => prev.map(e => e.id === selectedId ? { ...e, props } : e));
  };

  const updateLabel = (label: string) => {
    setElements(prev => prev.map(e => e.id === selectedId ? { ...e, label } : e));
  };

  const moveElement = (id: string, dir: "up" | "down") => {
    const idx = elements.findIndex(e => e.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === elements.length - 1) return;
    const next = [...elements];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setElements(next);
  };

  const saveLayout = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/canvas/${layoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elements, name: canvasName, description: canvasDescription, is_active: true }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      handleError(err);
    }
    setSaving(false);
  };

  const copyCanvasId = () => {
    navigator.clipboard.writeText(layoutId);
    toast({ title: "Canvas ID disalin!" });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-2rem)] gap-0">
      {/* Top bar */}
      <div className="flex items-center gap-2 sm:gap-3 pb-3 border-b border-border/50 mb-4 shrink-0">
        <Link href="/canvas">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0 space-y-0.5">
          <Input
            value={canvasName}
            onChange={e => setCanvasName(e.target.value)}
            placeholder="Nama canvas..."
            className="h-7 text-sm font-semibold border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Input
            value={canvasDescription}
            onChange={e => setCanvasDescription(e.target.value)}
            placeholder="Deskripsi canvas..."
            className="h-6 text-xs text-muted-foreground font-light border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 hidden sm:block"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={copyCanvasId}>
          <Copy className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Salin ID</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={saveLayout} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{saved ? "Tersimpan!" : "Simpan"}</span>
        </Button>
      </div>

      {apiError && <ErrorAlert error={apiError} onDismiss={clearError} className="mb-4" />}

      {/* Mobile floating buttons */}
      <div className="flex gap-2 mb-3 lg:hidden shrink-0">
        <Sheet open={mobilePanel === 'palette'} onOpenChange={open => setMobilePanel(open ? 'palette' : null)}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 flex-1 gap-1.5">
              <Plus className="h-4 w-4" /> Tambah Widget
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-sm">Widget Palette</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              {WIDGET_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{group.label}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {group.items.map(item => (
                      <button
                        key={item.type}
                        onClick={() => { addWidget(item.type); setMobilePanel(null); }}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-colors text-center group"
                      >
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs text-muted-foreground group-hover:text-foreground leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <Sheet open={mobilePanel === 'inspector'} onOpenChange={open => setMobilePanel(open ? 'inspector' : null)}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 flex-1 gap-1.5">
              <Settings2 className="h-4 w-4" /> Inspector
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-sm">Inspector</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <Tabs value={inspectorTab} onValueChange={setInspectorTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="preview" className="flex-1 text-xs">Preview</TabsTrigger>
                  <TabsTrigger value="schema" className="flex-1 text-xs">Schema</TabsTrigger>
                  <TabsTrigger value="props" className="flex-1 text-xs">Properti</TabsTrigger>
                </TabsList>
                <TabsContent value="props" className="mt-3">
                  {selected ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Label Widget</Label>
                        <Input value={selected.label} onChange={e => updateLabel(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <Separator />
                      <PropsEditor element={selected} onChange={updateProps} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-center">
                      <p className="text-xs text-muted-foreground">Klik widget di canvas untuk edit</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="preview" className="mt-3">
                  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <div className="p-4 space-y-3">
                      {elements.length === 0 ? (
                        <p className="text-xs text-center text-muted-foreground py-8">Canvas kosong</p>
                      ) : elements.map(el => (
                        <div key={el.id}>
                          {el.label && <p className="text-xs text-muted-foreground/60 mb-1 font-medium">{el.label}</p>}
                          <WidgetPreview type={el.type} props={el.props} />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="schema" className="mt-3">
                  <Textarea
                    value={schemaText}
                    onChange={e => handleSchemaEdit(e.target.value)}
                    rows={12}
                    className="text-xs font-mono resize-none"
                    spellCheck={false}
                    placeholder="[]"
                  />
                  {schemaError ? (
                    <p className="text-xs text-red-500 mt-2">{schemaError}</p>
                  ) : (
                    <p className="text-xs text-emerald-600 mt-2">JSON valid — {elements.length} element{elements.length !== 1 ? "s" : ""}</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main layout: palette(2) | canvas(6) | inspector(4) */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 flex-1 overflow-hidden min-h-0">

        {/* Widget palette — hidden on mobile, use Sheet instead */}
        <div className="hidden lg:block lg:col-span-2 overflow-y-auto pr-1 space-y-4">
          {WIDGET_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{group.label}</p>
              <div className="grid grid-cols-2 gap-1">
                {group.items.map(item => (
                  <button
                    key={item.type}
                    onClick={() => addWidget(item.type)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-colors text-center group"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Canvas editor */}
        <div className="flex-1 lg:col-span-6 overflow-y-auto min-h-[200px]">
          <div className="min-h-full rounded-xl border border-dashed border-border/50 bg-muted/10 p-4">
            {elements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Canvas kosong</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Klik widget dari palette kiri untuk menambahkan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {elements.map((el, idx) => (
                  <div
                    key={el.id}
                    onClick={() => { setSelectedId(el.id); setInspectorTab("props"); }}
                    className={`group relative rounded-lg transition-all cursor-pointer ${
                      selectedId === el.id
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "ring-1 ring-transparent hover:ring-border/50"
                    }`}
                  >
                    {/* Element controls */}
                    <div className={`absolute -top-2.5 right-1 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === el.id ? "opacity-100" : ""}`}>
                      <button
                        onClick={e => { e.stopPropagation(); moveElement(el.id, "up"); }}
                        disabled={idx === 0}
                        className="h-5 w-5 rounded flex items-center justify-center bg-background border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                      >↑</button>
                      <button
                        onClick={e => { e.stopPropagation(); moveElement(el.id, "down"); }}
                        disabled={idx === elements.length - 1}
                        className="h-5 w-5 rounded flex items-center justify-center bg-background border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                      >↓</button>
                      <button
                        onClick={e => { e.stopPropagation(); removeElement(el.id); }}
                        className="h-5 w-5 rounded flex items-center justify-center bg-background border border-red-500/40 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    {/* Widget content */}
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <GripVertical className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground/60 font-mono">{el.type}</span>
                        <span className="text-xs text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground/60">{el.label}</span>
                      </div>
                      <WidgetPreview type={el.type} props={el.props} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inspector panel (tabbed) — hidden on mobile, use Sheet instead */}
        <div className="hidden lg:flex lg:col-span-4 overflow-y-auto flex-col gap-3">
          <Tabs value={inspectorTab} onValueChange={setInspectorTab} className="flex-1 flex flex-col">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="preview" className="flex-1 text-xs">Preview</TabsTrigger>
              <TabsTrigger value="schema" className="flex-1 text-xs">Schema</TabsTrigger>
              <TabsTrigger value="props" className="flex-1 text-xs">Properti</TabsTrigger>
            </TabsList>

            {/* Preview tab: full canvas render */}
            <TabsContent value="preview" className="mt-3 flex-1">
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                {/* Phone-style header */}
                <div className="px-4 py-2.5 border-b border-border/30 bg-muted/30 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400/60" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                  </div>
                  <span className="text-xs text-muted-foreground/60 flex-1 text-center truncate">{layout?.name}</span>
                </div>
                <div className="p-4 space-y-3">
                  {elements.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground py-8">Canvas kosong — tambahkan widget dari palette</p>
                  ) : (
                    elements.map(el => (
                      <div key={el.id}>
                        {el.label && (
                          <p className="text-xs text-muted-foreground/60 mb-1 font-medium">{el.label}</p>
                        )}
                        <WidgetPreview type={el.type} props={el.props} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Schema tab: editable JSON */}
            <TabsContent value="schema" className="mt-3 flex-1 flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Edit JSON schema langsung. Perubahan valid otomatis diterapkan ke canvas.
              </p>
              <Textarea
                value={schemaText}
                onChange={e => handleSchemaEdit(e.target.value)}
                rows={24}
                className="text-xs font-mono resize-none flex-1"
                spellCheck={false}
                placeholder="[]"
              />
              {schemaError ? (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {schemaError}
                </p>
              ) : (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  JSON valid — {elements.length} element{elements.length !== 1 ? "s" : ""}
                </p>
              )}
            </TabsContent>

            {/* Properti tab: element props editor */}
            <TabsContent value="props" className="mt-3 flex-1">
              {selected ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Label Widget</Label>
                    <Input value={selected.label} onChange={e => updateLabel(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <Separator />
                  <PropsEditor element={selected} onChange={updateProps} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <MousePointer className="h-6 w-6 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Klik widget di canvas untuk edit propertinya</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Agent integration info */}
          <div className="shrink-0 rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" /> Hubungkan ke Agent
            </p>
            <p className="text-xs text-muted-foreground/80 font-light">
              Buka halaman agent, lalu pilih canvas ini di bagian "Canvas". Agent otomatis menampilkan canvas saat relevan.
            </p>
            <Link href="/agents">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                Buka Agents
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
