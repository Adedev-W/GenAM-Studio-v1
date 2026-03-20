"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Wand2,
  Bot,
  Save,
  Sparkles,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  ImagePlus,
  X,
  RefreshCw,
  Layout,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const BUSINESS_TYPES = [
  "Toko Online",
  "Restoran/Kuliner",
  "Jasa/Servis",
  "Salon & Kecantikan",
  "Travel & Wisata",
  "Kesehatan & Apotek",
  "Pendidikan & Kursus",
  "Properti",
  "Lainnya",
];

const TONE_OPTIONS = [
  { value: "Profesional & Formal", label: "Profesional & Formal" },
  { value: "Santai & Akrab", label: "Santai & Akrab" },
  { value: "Semangat & Energik", label: "Semangat & Energik" },
];

const CHANNEL_OPTIONS = ["WhatsApp", "Instagram", "Tokopedia", "Website"];

const WIDGET_LABELS: Record<string, string> = {
  stat: "Statistik",
  table: "Tabel",
  list: "Daftar",
  bar_chart: "Bar Chart",
  line_chart: "Line Chart",
  pie_chart: "Pie Chart",
  badge: "Badge",
  alert: "Alert",
  code: "Kode",
  card: "Kartu Produk",
};

const GUARDRAIL_OPTIONS = [
  { value: "default" as const, label: "Default", description: "Filter dasar — sopan, aman, dan membantu", color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "medium" as const, label: "Medium", description: "Hanya bahas topik relevan dengan bisnis", color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "hard" as const, label: "Hard", description: "Tolak semua off-topic, format respons ketat", color: "text-red-500", bg: "bg-red-500/10" },
];

export default function AgentBuilderPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { toast } = useToast();

  // Agent data
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [suggestedWidgets, setSuggestedWidgets] = useState<string[]>([]);
  const [existingMeta, setExistingMeta] = useState<Record<string, any>>({});

  // Business form
  const [businessType, setBusinessType] = useState("");
  const [products, setProducts] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [tone, setTone] = useState("Profesional & Formal");

  // Product images
  const [productImages, setProductImages] = useState<Array<{ url: string; path: string; name: string; description: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagesChangedAfterGenerate, setImagesChangedAfterGenerate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guardrails
  const [guardrailLevel, setGuardrailLevel] = useState<"default" | "medium" | "hard">("default");

  // Canvas equipment
  const [canvasLayouts, setCanvasLayouts] = useState<any[]>([]);
  const [selectedCanvasIds, setSelectedCanvasIds] = useState<string[]>([]);

  // UI state
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatedOnce, setGeneratedOnce] = useState(false);

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      if (!res.ok) return;
      const data = await res.json();
      setAgentName(data.name || "");
      setAgentDescription(data.description || "");
      setSystemPrompt(data.system_prompt || "");
      const meta = data.metadata || {};
      setExistingMeta(meta);
      if (meta.suggested_widgets) setSuggestedWidgets(meta.suggested_widgets);
      if (meta.business_type) setBusinessType(meta.business_type);
      if (meta.products) setProducts(meta.products);
      if (meta.target_market) setTargetMarket(meta.target_market);
      if (meta.channels) setChannels(meta.channels);
      if (meta.tone) setTone(meta.tone);
      if (meta.product_images) setProductImages(meta.product_images);
      if (meta.canvas_ids) setSelectedCanvasIds(meta.canvas_ids);
      if (meta.guardrail_level) setGuardrailLevel(meta.guardrail_level);
      if (data.system_prompt) setGeneratedOnce(true);
    } catch {
      /* silent */
    } finally {
      setAgentLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
    fetch("/api/canvas").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCanvasLayouts(d);
    }).catch(() => {});
  }, [fetchAgent]);

  function toggleChannel(channel: string) {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  }

  async function uploadImage(file: File) {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/agents/${agentId}/media`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal upload");
      }
      const { url, path } = await res.json();
      const name = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
      setProductImages((prev) => [...prev, { url, path, name, description: "" }]);
      setImagesChangedAfterGenerate(true);
    } catch (err: any) {
      toast({ title: "Gagal upload foto", description: err.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeImage(index: number) {
    const img = productImages[index];
    try {
      await fetch(`/api/agents/${agentId}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: img.path }),
      });
    } catch {
      /* ignore storage error, remove from state anyway */
    }
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setImagesChangedAfterGenerate(true);
  }

  async function handleGenerate() {
    if (!businessType || !products.trim()) {
      toast({
        title: "Lengkapi form terlebih dahulu",
        description: "Jenis bisnis dan produk/jasa wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_type: businessType,
          products,
          target_market: targetMarket,
          channels,
          tone,
          product_images: productImages.map(({ url, name, description }) => ({ url, name, description })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal generate");
      }

      const result = await res.json();
      setAgentName(result.name);
      setAgentDescription(result.description);
      setSystemPrompt(result.system_prompt);
      setSuggestedWidgets(result.suggested_widgets || []);
      setGeneratedOnce(true);
      setImagesChangedAfterGenerate(false);

      toast({
        title: "Berhasil di-generate!",
        description: "System prompt agent sudah siap. Kamu bisa mengeditnya sebelum menyimpan.",
      });
    } catch (err: any) {
      toast({
        title: "Gagal generate",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!agentName.trim()) {
      toast({
        title: "Nama agent wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentName,
          description: agentDescription,
          system_prompt: systemPrompt,
          metadata: {
            ...existingMeta,
            business_type: businessType,
            products,
            target_market: targetMarket,
            channels,
            tone,
            suggested_widgets: suggestedWidgets,
            product_images: productImages,
            canvas_ids: selectedCanvasIds,
            guardrail_level: guardrailLevel,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }

      setSaved(true);
      toast({
        title: "Agent berhasil disimpan!",
        description: `${agentName} telah diperbarui.`,
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast({
        title: "Gagal menyimpan",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (agentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/agents">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {agentName || "Agent Builder"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-light mt-0.5">
            Buat dan konfigurasi agent AI untuk bisnis kamu
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleSave}
          disabled={saving || !generatedOnce}
          size="sm"
          className="shrink-0 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Agent"}
        </Button>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">
            <Wand2 className="mr-2 h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="test">
            <MessageSquare className="mr-2 h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        {/* ============ BUILDER TAB ============ */}
        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section A: Business Info Form */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Informasi Bisnis
                </CardTitle>
                <CardDescription className="text-xs">
                  Isi detail bisnis kamu dan biarkan AI membuatkan agent yang sempurna
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Business Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Jenis Bisnis <span className="text-red-500">*</span>
                  </Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis bisnis..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Products */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Produk atau Jasa <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={products}
                    onChange={(e) => setProducts(e.target.value)}
                    placeholder="Contoh: Baju batik wanita, harga 150rb-500rb, tersedia berbagai motif"
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Target Market */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Target Pelanggan</Label>
                  <Input
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                    placeholder="Contoh: Wanita usia 25-45 tahun, ibu rumah tangga"
                    className="text-sm"
                  />
                </div>

                {/* Channels */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Channel Penjualan</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CHANNEL_OPTIONS.map((ch) => (
                      <div key={ch} className="flex items-center gap-2">
                        <Checkbox
                          id={`ch-${ch}`}
                          checked={channels.includes(ch)}
                          onCheckedChange={() => toggleChannel(ch)}
                        />
                        <label
                          htmlFor={`ch-${ch}`}
                          className="text-sm font-light cursor-pointer"
                        >
                          {ch}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Gaya Komunikasi</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Images */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Foto Produk <span className="text-muted-foreground font-normal text-xs">(Opsional)</span></Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                      Tambah Foto
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        e.target.value = '';
                        for (const file of files) await uploadImage(file);
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-light -mt-1">
                    Upload foto produk agar agent bisa menampilkannya saat chat (max 5MB, JPEG/PNG/WebP)
                  </p>

                  {productImages.length > 0 && (
                    <div className="space-y-2">
                      {imagesChangedAfterGenerate && generatedOnce && (
                        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
                          <RefreshCw className="h-3 w-3 shrink-0" />
                          Foto diperbarui — generate ulang agent agar gambar masuk ke sistem prompt
                        </div>
                      )}
                      {productImages.map((img, i) => (
                        <div key={img.url} className="flex items-start gap-3 rounded-lg border border-border/50 p-2.5">
                          <img src={img.url} alt={img.name} className="w-14 h-14 object-cover rounded-md shrink-0 border border-border/30" />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <Input
                              value={img.name}
                              onChange={(e) => setProductImages(prev => prev.map((p, pi) => pi === i ? { ...p, name: e.target.value } : p))}
                              placeholder="Nama produk"
                              className="h-7 text-xs"
                            />
                            <Input
                              value={img.description}
                              onChange={(e) => setProductImages(prev => prev.map((p, pi) => pi === i ? { ...p, description: e.target.value } : p))}
                              placeholder="Harga / deskripsi singkat"
                              className="h-7 text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Generate Button */}
                <Button
                  variant="ghost"
                  onClick={handleGenerate}
                  disabled={generating || !businessType || !products.trim()}
                  className="w-full bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sedang membuat agent...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      ✨ Generate dengan AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Section B: Generated Config */}
            <Card className={`border-border/50 transition-opacity ${generatedOnce ? "opacity-100" : "opacity-50"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Konfigurasi Agent
                  {!generatedOnce && (
                    <Badge variant="outline" className="text-xs ml-auto font-normal">
                      Tunggu hasil generate
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Hasil generate bisa diedit sesuai kebutuhan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nama Agent</Label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Nama agent..."
                    disabled={!generatedOnce}
                    className="text-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Deskripsi</Label>
                  <Input
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="Deskripsi singkat agent..."
                    disabled={!generatedOnce}
                    className="text-sm"
                  />
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    System Prompt{" "}
                    <span className="text-muted-foreground font-normal">(bisa diedit)</span>
                  </Label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="System prompt akan muncul setelah generate..."
                    rows={10}
                    disabled={!generatedOnce}
                    className="text-sm font-mono leading-relaxed resize-none"
                  />
                </div>

                {/* Guardrails */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Guardrails
                  </Label>
                  <p className="text-xs text-muted-foreground font-light -mt-0.5">
                    Atur seberapa ketat agent merespons pertanyaan di luar topik bisnis
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {GUARDRAIL_OPTIONS.map((opt) => {
                      const isSelected = guardrailLevel === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={!generatedOnce}
                          onClick={() => setGuardrailLevel(opt.value)}
                          className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                            isSelected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 hover:border-border/80"
                          } ${!generatedOnce ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className={`p-1.5 rounded-md ${isSelected ? "bg-primary/15" : opt.bg}`}>
                            <Shield className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : opt.color}`} />
                          </div>
                          <span className="text-xs font-medium">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{opt.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Suggested Widgets */}
                {suggestedWidgets.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Widget yang Disarankan</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedWidgets.map((w) => (
                        <Badge key={w} variant="secondary" className="text-xs">
                          {WIDGET_LABELS[w] || w}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-light">
                      Widget ini akan otomatis ditampilkan agent saat relevan
                    </p>
                  </div>
                )}

                {/* Canvas Equipment */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layout className="h-4 w-4 text-primary" />
                    Canvas
                    <span className="text-muted-foreground font-normal text-xs">(Opsional)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground font-light -mt-1">
                    Pilih canvas yang bisa ditampilkan agent di chat. Agent otomatis tahu kapan harus menampilkannya.
                  </p>
                  {canvasLayouts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
                      <p className="text-xs text-muted-foreground">Belum ada canvas.</p>
                      <Link href="/canvas">
                        <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-1">
                          Buat canvas baru
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {canvasLayouts.map((c) => {
                        const isSelected = selectedCanvasIds.includes(c.id);
                        const elCount = (c.layout_json?.elements || []).length;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setSelectedCanvasIds((prev) =>
                                isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                              )
                            }
                            className={`w-full flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                              isSelected
                                ? "border-primary/50 bg-primary/5"
                                : "border-border/50 hover:border-border/80"
                            }`}
                          >
                            <div className={`p-1.5 rounded-md shrink-0 ${isSelected ? "bg-primary/15" : "bg-muted/50"}`}>
                              <Layout className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{c.name}</p>
                              {c.description && (
                                <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">{elCount} widget{elCount !== 1 ? "s" : ""}</span>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {selectedCanvasIds.length > 0 && (
                    <p className="text-xs text-primary font-medium">
                      {selectedCanvasIds.length} canvas terpilih
                    </p>
                  )}
                </div>

                {generatedOnce && (
                  <>
                    <Separator />
                    <Button variant="ghost" onClick={handleSave} disabled={saving} className="w-full bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : saved ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Tersimpan!
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Agent
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ TEST TAB ============ */}
        <TabsContent value="test">
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base">Assign Agent ke Chat Session</h3>
                <p className="text-sm text-muted-foreground font-light max-w-sm">
                  Deploy agent ke Chat Session untuk mulai testing. Buat session baru dan pilih
                  agent ini untuk mendapatkan link chat publik.
                </p>
              </div>
              <div className="flex gap-2 flex-col sm:flex-row">
                <Link href="/chat">
                  <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Buat Chat Session
                  </Button>
                </Link>
                <Link href="/agents">
                  <Button variant="outline" size="sm">
                    Kembali ke Agents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
