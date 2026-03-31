"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Check, ArrowRight, ArrowLeft, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useApiError } from "@/hooks/use-api-error";
import { ErrorAlert } from "@/components/common/error-alert";

const BUSINESS_TYPES = [
  "Restoran/Kuliner", "Toko Online", "Jasa/Servis", "Salon & Kecantikan",
  "Pendidikan/Kursus", "Retail/Toko Fisik", "Lainnya",
];

const TONE_OPTIONS = [
  { value: "Profesional & Formal", label: "Profesional & Formal" },
  { value: "Santai & Akrab", label: "Santai & Akrab" },
  { value: "Semangat & Energik", label: "Semangat & Energik" },
];

function fmtRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { error: genError, handleError: handleGenError, clearError: clearGenError } = useApiError();

  // Step 1: Profil Toko
  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState("Restoran/Kuliner");
  const [businessDesc, setBusinessDesc] = useState("");

  // Step 2: Produk (AI Generate)
  const [generating, setGenerating] = useState(false);
  const [genResults, setGenResults] = useState<any[]>([]);
  const [genSelected, setGenSelected] = useState<Set<number>>(new Set());

  // Step 3: Tone
  const [tone, setTone] = useState("Santai & Akrab");

  const [businessReady, setBusinessReady] = useState(false);

  const ensureBusiness = async () => {
    if (businessReady) return true;
    try {
      // Check if user already has an active business (returning user re-entering onboarding)
      const current = await apiFetch<{ id?: string }>("/api/settings/workspace").catch(() => null);
      if (current?.id) {
        await apiFetch("/api/settings/workspace", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: shopName, business_type: businessType }),
        });
        setBusinessReady(true);
        return true;
      }

      // No active business — create one (new user flow)
      await apiFetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName, business_type: businessType, description: businessDesc }),
      });
      setBusinessReady(true);
      return true;
    } catch {
      return false;
    }
  };

  const handleGoToStep1 = async () => {
    setLoading(true);
    const ok = await ensureBusiness();
    setLoading(false);
    if (ok) setStep(1);
  };

  const handleGenerate = async () => {
    if (!businessDesc) return;
    setGenerating(true);
    try {
      const data = await apiFetch<{ products: any[] }>("/api/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_type: businessType, description: businessDesc }),
      });
      const items = data.products || [];
      setGenResults(items);
      setGenSelected(new Set(items.map((_: any, i: number) => i)));
    } catch (err) {
      handleGenError(err);
    }
    setGenerating(false);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // 1. Bulk create products
      const selectedProducts = genResults.filter((_, i) => genSelected.has(i));
      if (selectedProducts.length > 0) {
        await apiFetch("/api/products/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: selectedProducts }),
        });
      }

      // 2. Create agent
      const agentData = await apiFetch<{ id: string }>("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Asisten ${shopName}`,
          description: `Agent AI untuk ${shopName} — ${businessType}`,
          agent_type: "assistant",
          model_provider: "openai",
          model_id: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 4096,
          environment: "prod",
          status: "active",
          tools: [],
          metadata: { business_type: businessType },
        }),
      });

      // 3. Generate system prompt (includes product data from DB)
      try {
        const generated = await apiFetch<{ system_prompt: string }>(
          `/api/agents/${agentData.id}/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              business_type: businessType,
              products: businessDesc,
              target_market: "Umum",
              channels: ["Website"],
              tone,
            }),
          }
        );

        if (generated.system_prompt) {
          await apiFetch(`/api/agents/${agentData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_prompt: generated.system_prompt,
              metadata: {
                business_type: businessType,
              },
            }),
          });
        }
      } catch {
        // Agent prompt generation failed — non-critical, continue
      }

      // 4. Create chat session
      try {
        await apiFetch("/api/chat-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentData.id,
            title: `Chat Test — ${shopName}`,
          }),
        });
      } catch {
        // Non-critical
      }

      // 5. Update business tone
      try {
        await apiFetch("/api/settings/workspace", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tone }),
        });
      } catch {
        // Non-critical
      }

      // 6. Redirect to dashboard
      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg border-border/50">
        <CardContent className="p-6">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[0, 1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s < step ? "bg-primary text-primary-foreground" :
                  s === step ? "bg-primary/10 text-primary border-2 border-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {s < step ? <Check className="h-4 w-4" /> : s + 1}
                </div>
                {s < 2 && <div className={`w-8 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Profil Toko */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold">Profil Toko</h2>
                <p className="text-sm text-muted-foreground font-light">Ceritakan tentang bisnis kamu</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nama Toko / Bisnis</Label>
                <Input placeholder="Warung Nasi Goreng Pak Budi" value={shopName} onChange={(e) => setShopName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jenis Bisnis</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Deskripsi Produk / Layanan</Label>
                <Textarea
                  placeholder="Jual nasi goreng spesial 25rb, mie ayam bakso 20rb, soto ayam 18rb. Minuman es teh 5rb, es jeruk 7rb, kopi susu 15rb..."
                  value={businessDesc} onChange={(e) => setBusinessDesc(e.target.value)} rows={4}
                />
                <p className="text-xs text-muted-foreground">Sebutkan produk/layanan beserta harga untuk hasil terbaik</p>
              </div>
              <Button className="w-full" variant="ghost"
                disabled={!shopName || !businessDesc || loading}
                onClick={handleGoToStep1}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Lanjut <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Produk */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold">Produk & Layanan</h2>
                <p className="text-sm text-muted-foreground font-light">AI akan membuatkan daftar produk dari deskripsi kamu</p>
              </div>

              {genError && <ErrorAlert error={genError} onDismiss={clearGenError} className="mb-2" />}

              {genResults.length === 0 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground font-light">
                    &ldquo;{businessDesc.substring(0, 100)}{businessDesc.length > 100 ? "..." : ""}&rdquo;
                  </div>
                  <Button variant="ghost" className="w-full bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
                    onClick={handleGenerate} disabled={generating}>
                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {generating ? "Menggenerate..." : "Generate Produk"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Opsional — kamu bisa skip dan tambah produk nanti</p>
                </div>
              )}

              {genResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Ditemukan {genResults.length} produk:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {genResults.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          genSelected.has(i) ? "border-primary/50 bg-primary/5" : "border-border/50"
                        }`}
                        onClick={() => {
                          const next = new Set(genSelected);
                          next.has(i) ? next.delete(i) : next.add(i);
                          setGenSelected(next);
                        }}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                          genSelected.has(i) ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}>
                          {genSelected.has(i) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <p className="text-sm font-light">{fmtRupiah(item.price || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}
                  disabled={generating}>
                  Lanjut <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Tone & Finish */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold">Gaya Komunikasi</h2>
                <p className="text-sm text-muted-foreground font-light">Pilih gaya komunikasi agent AI kamu</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gaya Komunikasi</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Ringkasan:</p>
                <div className="text-sm text-muted-foreground font-light space-y-1">
                  <p>Toko: <span className="text-foreground">{shopName}</span></p>
                  <p>Jenis: <span className="text-foreground">{businessType}</span></p>
                  <p>Produk: <span className="text-foreground">{genSelected.size} item</span></p>
                  <p>Gaya: <span className="text-foreground">{tone}</span></p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button variant="ghost" className="flex-1 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
                  onClick={handleComplete} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                  {loading ? "Membuat toko..." : "Buat Toko Saya"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
