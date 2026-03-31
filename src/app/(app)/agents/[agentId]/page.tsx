"use client";

import { useState, useEffect, useCallback } from "react";
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
  Layout,
  Shield,
  Plus,
  X,
  Type,
  Cpu,
  HelpCircle,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useApiError } from "@/hooks/use-api-error";
import { ErrorAlert } from "@/components/common/error-alert";
import { apiFetch } from "@/lib/api";
import { ProductSelector } from "./components/product-selector";

const TONE_OPTIONS = [
  { value: "Profesional & Formal", label: "Profesional & Formal" },
  { value: "Santai & Akrab", label: "Santai & Akrab" },
  { value: "Semangat & Energik", label: "Semangat & Energik" },
];

const CHANNEL_OPTIONS = ["WhatsApp", "Instagram", "Tokopedia", "Website"];

const GUARDRAIL_OPTIONS = [
  { value: "default" as const, label: "Default", description: "Filter dasar — sopan, aman, dan membantu", color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "medium" as const, label: "Medium", description: "Hanya bahas topik relevan dengan bisnis", color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "hard" as const, label: "Hard", description: "Tolak semua off-topic, format respons ketat", color: "text-red-500", bg: "bg-red-500/10" },
];

const MODEL_OPTIONS = [
  {
    value: "gpt-4.1",
    label: "GPT-4.1",
    badge: "Direkomendasikan",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    description: "Model terbaru, balance performa dan harga.",
    details: [
      "Tool calling sangat akurat",
      "Instruksi following terbaik",
      "Cocok untuk sales agent interaktif",
    ],
  },
  {
    value: "gpt-4o",
    label: "GPT-4o",
    badge: "Premium",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    description: "Model terpintar, performa tertinggi.",
    details: [
      "Decision-making paling akurat",
      "Percakapan kompleks multi-turn",
      "Biaya ~2x GPT-4o Mini",
    ],
  },
  {
    value: "gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    badge: "Sweet Spot",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "Versi hemat dari GPT-4.1.",
    details: [
      "Tool calling cukup baik",
      "Lebih murah dari GPT-4.1",
      "Balance harga vs performa",
    ],
  },
  {
    value: "gpt-4o-mini",
    label: "GPT-4o Mini",
    badge: "Hemat",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Cepat dan paling murah.",
    details: [
      "Cocok untuk chat sederhana (FAQ)",
      "Volume chat tinggi, budget terbatas",
      "Kurang akurat untuk tool calling",
    ],
  },
  {
    value: "o4-mini",
    label: "o4-mini",
    badge: "Reasoning",
    badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    description: "Reasoning model, sangat akurat.",
    details: [
      "Tool calling paling presisi",
      "Reasoning step-by-step sebelum jawab",
      "Cocok untuk decision-making kompleks",
    ],
  },
];

export default function AgentBuilderPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { toast } = useToast();
  const { error: apiError, handleError, clearError } = useApiError();

  // Agent data
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [existingMeta, setExistingMeta] = useState<Record<string, any>>({});

  // Product selector
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Tone & channels
  const [channels, setChannels] = useState<string[]>([]);
  const [tone, setTone] = useState("Profesional & Formal");

  // Guardrails
  const [guardrailLevel, setGuardrailLevel] = useState<"default" | "medium" | "hard">("default");

  // Model selection
  const [modelId, setModelId] = useState("gpt-4.1");

  // Canvas equipment
  const [canvasLayouts, setCanvasLayouts] = useState<any[]>([]);
  const [selectedCanvasIds, setSelectedCanvasIds] = useState<string[]>([]);
  const [showCanvasModal, setShowCanvasModal] = useState(false);

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
      if (meta.product_ids) setSelectedProductIds(meta.product_ids);
      if (meta.channels) setChannels(meta.channels);
      if (meta.tone) setTone(meta.tone);
      if (meta.canvas_ids) setSelectedCanvasIds(meta.canvas_ids);
      if (meta.guardrail_level) setGuardrailLevel(meta.guardrail_level);
      if (data.model_id) setModelId(data.model_id);
      if (data.system_prompt) setGeneratedOnce(true);
    } catch {
      /* silent */
    } finally {
      setAgentLoading(false);
    }
  }, [agentId]);

  // Fetch business profile for defaults
  useEffect(() => {
    fetch("/api/settings/workspace")
      .then((r) => r.json())
      .then((biz) => {
        if (biz?.channels && channels.length === 0) setChannels(biz.channels);
        if (biz?.tone && tone === "Profesional & Formal") setTone(biz.tone);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAgent();
    apiFetch("/api/canvas")
      .then((d) => {
        if (Array.isArray(d)) setCanvasLayouts(d);
      })
      .catch(handleError);
  }, [fetchAgent, handleError]);

  function toggleChannel(channel: string) {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  }

  async function handleGenerate() {
    if (selectedProductIds.length === 0) {
      toast({
        title: "Pilih minimal 1 produk",
        description: "Pilih produk dari database agar agent tahu apa yang dijual.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const result = await apiFetch(`/api/agents/${agentId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: selectedProductIds,
          channels,
          tone,
        }),
      });
      setAgentName(result.name);
      setAgentDescription(result.description);
      setSystemPrompt(result.system_prompt);
      setGeneratedOnce(true);

      toast({
        title: "Berhasil di-generate!",
        description: "System prompt agent sudah siap. Kamu bisa mengeditnya sebelum menyimpan.",
      });
    } catch (err: any) {
      handleError(err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!agentName.trim()) {
      toast({ title: "Nama agent wajib diisi", variant: "destructive" });
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      await apiFetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentName,
          description: agentDescription,
          system_prompt: systemPrompt,
          model_id: modelId,
          metadata: {
            ...existingMeta,
            product_ids: selectedProductIds,
            channels,
            tone,
            canvas_ids: selectedCanvasIds,
            guardrail_level: guardrailLevel,
          },
        }),
      });

      setSaved(true);
      toast({
        title: "Agent berhasil disimpan!",
        description: `${agentName} telah diperbarui.`,
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  }

  const selectedCanvases = canvasLayouts.filter((c) => selectedCanvasIds.includes(c.id));

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

      {apiError && <ErrorAlert error={apiError} onDismiss={clearError} className="mb-4" />}

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
            {/* Section A: Agent Config Form */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Konfigurasi Agent
                </CardTitle>
                <CardDescription className="text-xs">
                  Pilih produk dan atur preferensi, lalu generate dengan AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agent Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nama Agent</Label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Nama agent (akan diisi otomatis saat generate)"
                    className="text-sm"
                  />
                </div>

                {/* Product Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Produk <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground font-light -mt-0.5">
                    Pilih produk dari database yang akan diketahui agent
                  </p>
                  <ProductSelector
                    selectedIds={selectedProductIds}
                    onSelectionChange={setSelectedProductIds}
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
                        <label htmlFor={`ch-${ch}`} className="text-sm font-light cursor-pointer">
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

                <Separator />

                {/* Generate Button */}
                <Button
                  variant="ghost"
                  onClick={handleGenerate}
                  disabled={generating || selectedProductIds.length === 0}
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
                      Generate dengan AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Section B: Generated Result */}
            <Card className={`border-border/50 transition-opacity ${generatedOnce ? "opacity-100" : "opacity-50"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Hasil Generate
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

                {/* Model Selector with Tooltip */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    Model AI
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" side="left" align="start">
                        <div className="p-3 border-b border-border/50">
                          <p className="text-sm font-semibold">Panduan Pemilihan Model</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Model menentukan seberapa pintar agent dalam memahami permintaan dan memilih respons yang tepat.</p>
                        </div>
                        <div className="divide-y divide-border/30">
                          {MODEL_OPTIONS.map((m) => (
                            <div key={m.value} className="p-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{m.label}</span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${m.badgeColor}`}>
                                  {m.badge}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{m.description}</p>
                              <ul className="space-y-0.5">
                                {m.details.map((d, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="text-primary mt-0.5">&#8226;</span>
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </Label>
                  <p className="text-xs text-muted-foreground font-light -mt-1">
                    Model yang lebih pintar lebih akurat memilih kapan tampilkan menu vs jawab teks
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {MODEL_OPTIONS.map((m) => {
                      const isSelected = modelId === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          disabled={!generatedOnce}
                          onClick={() => setModelId(m.value)}
                          className={`flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors ${
                            isSelected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 hover:border-border/80"
                          } ${!generatedOnce ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="text-xs font-medium">{m.label}</span>
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ml-auto ${m.badgeColor}`}>
                              {m.badge}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground leading-tight">{m.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Response Mode — Agent Response Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layout className="h-4 w-4 text-primary" />
                    Mode Respons
                  </Label>
                  <p className="text-xs text-muted-foreground font-light -mt-1">
                    Agent selalu merespons dengan teks. Tambahkan canvas untuk tampilan visual.
                  </p>

                  <div className="space-y-2">
                    {/* Text mode — always active */}
                    <div className="flex items-center gap-3 rounded-lg border border-primary/50 bg-primary/5 p-3">
                      <div className="p-1.5 rounded-md bg-primary/15 shrink-0">
                        <Type className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Teks</p>
                        <p className="text-xs text-muted-foreground">Respons teks selalu aktif</p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">
                        Aktif
                      </Badge>
                    </div>

                    {/* Canvas warning — products exist but no canvas */}
                    {selectedProductIds.length > 0 && selectedCanvasIds.length === 0 && generatedOnce && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                        <div className="p-1 rounded-md bg-amber-500/10 shrink-0 mt-0.5">
                          <Layout className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-amber-700">Agent punya produk tapi belum ada canvas</p>
                          <p className="text-[11px] text-amber-600/80 mt-0.5 leading-relaxed">
                            Tanpa canvas, agent hanya bisa merespons dengan teks biasa.
                            Pilih canvas agar agent bisa tampilkan menu visual interaktif.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Canvas mode — optional */}
                    <div className={`rounded-lg border p-3 ${selectedCanvases.length > 0 ? "border-primary/50 bg-primary/5" : "border-border/50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md shrink-0 ${selectedCanvases.length > 0 ? "bg-primary/15" : "bg-muted/50"}`}>
                          <Layout className={`h-3.5 w-3.5 ${selectedCanvases.length > 0 ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Canvas</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedCanvases.length > 0
                              ? `${selectedCanvases.length} canvas dipilih`
                              : "Tampilan visual opsional"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!generatedOnce}
                          onClick={() => setShowCanvasModal(true)}
                          className="shrink-0 text-xs bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {selectedCanvases.length > 0 ? "Ubah" : "Pilih Canvas"}
                        </Button>
                      </div>

                      {/* Selected canvas chips */}
                      {selectedCanvases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pl-9">
                          {selectedCanvases.map((c) => (
                            <Badge
                              key={c.id}
                              variant="secondary"
                              className="text-xs gap-1 pr-1"
                            >
                              {c.name}
                              <button
                                type="button"
                                onClick={() => setSelectedCanvasIds((prev) => prev.filter((id) => id !== c.id))}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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

      {/* Canvas Selection Modal */}
      <Dialog open={showCanvasModal} onOpenChange={setShowCanvasModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              Pilih Canvas
            </DialogTitle>
            <DialogDescription>
              Pilih canvas yang bisa ditampilkan agent saat merespons di chat.
              Agent akan otomatis menampilkan canvas yang relevan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto py-2">
            {canvasLayouts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">Belum ada canvas.</p>
                <Link href="/canvas">
                  <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-1">
                    Buat canvas baru
                  </Button>
                </Link>
              </div>
            ) : (
              canvasLayouts.map((c) => {
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
                    className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
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
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCanvasModal(false)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
