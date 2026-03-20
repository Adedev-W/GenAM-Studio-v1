"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot, MessageSquare, Layout, Zap, Shield, BarChart3,
  ArrowRight, ChevronRight, Sparkles, Globe,
  Check, Play, Send, Eye,
} from "lucide-react";
import { AppLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/* ─── Workflow Animation ─── */
const WORKFLOW_STEPS = [
  {
    id: "build",
    icon: Bot,
    label: "Buat Agent",
    desc: "Konfigurasi persona, model AI, dan knowledge base agent kamu",
    color: "from-blue-500 to-blue-600",
    demo: {
      title: "Agent: CS Toko Risol",
      lines: [
        { k: "Model", v: "GPT-4o Mini" },
        { k: "Persona", v: "Ramah, bahasa Indonesia casual" },
        { k: "Knowledge", v: "Katalog produk, harga, stok" },
      ],
    },
  },
  {
    id: "equip",
    icon: Layout,
    label: "Pasang Canvas",
    desc: "Hubungkan UI visual interaktif — menu, katalog, price list",
    color: "from-violet-500 to-violet-600",
    demo: {
      title: "Canvas: Katalog Produk",
      lines: [
        { k: "Widget", v: "List, Image, Card, Table" },
        { k: "Data", v: "5 produk + foto + harga" },
        { k: "Status", v: "Aktif & terhubung ke agent" },
      ],
    },
  },
  {
    id: "deploy",
    icon: Globe,
    label: "Deploy & Bagikan",
    desc: "Dapatkan link chat publik, embed di website atau WhatsApp",
    color: "from-emerald-500 to-emerald-600",
    demo: {
      title: "Chat Link Aktif",
      lines: [
        { k: "URL", v: "studio.app/c/toko-risol" },
        { k: "Visitor", v: "127 hari ini" },
        { k: "Respons", v: "< 2 detik rata-rata" },
      ],
    },
  },
  {
    id: "monitor",
    icon: BarChart3,
    label: "Pantau & Optimasi",
    desc: "Lacak token usage, percakapan, dan performa real-time",
    color: "from-amber-500 to-amber-600",
    demo: {
      title: "Dashboard Usage",
      lines: [
        { k: "Token Hari Ini", v: "24.5K" },
        { k: "Request", v: "89 percakapan" },
        { k: "Satisfaction", v: "96% positif" },
      ],
    },
  },
];

function WorkflowAnimation() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const DURATION = 4000;
    const TICK = 50;
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += TICK;
      setProgress((elapsed / DURATION) * 100);
      if (elapsed >= DURATION) {
        elapsed = 0;
        setActive((prev) => (prev + 1) % WORKFLOW_STEPS.length);
        setProgress(0);
      }
    }, TICK);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const step = WORKFLOW_STEPS[active];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8 px-2">
        {WORKFLOW_STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setActive(i); setProgress(0); }}
            className="flex flex-col items-center gap-2 group flex-1"
          >
            <div className="relative flex items-center justify-center w-12 h-12">
              <div className={`
                absolute inset-0 rounded-2xl transition-all duration-500
                ${i === active
                  ? `bg-gradient-to-br ${s.color} shadow-lg`
                  : i < active
                    ? "bg-primary/20"
                    : "bg-muted"
                }
              `} />
              <s.icon className={`relative h-5 w-5 ${i === active ? "text-white" : i < active ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-xs font-medium transition-colors ${i === active ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {/* Progress bar under active step */}
            <div className="w-full h-0.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 bg-gradient-to-r ${s.color}`}
                style={{ width: i === active ? `${progress}%` : i < active ? "100%" : "0%" }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Active step content */}
      <div className="relative">
        <div
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
          style={{ height: 260 }}
        >
          {/* Header bar */}
          <div className={`px-5 py-3 bg-gradient-to-r ${step.color} flex items-center gap-3`}>
            <step.icon className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">{step.demo.title}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/60" />
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">{step.desc}</p>
            <div className="space-y-3">
              {step.demo.lines.map((line, li) => (
                <div
                  key={line.k}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                >
                  <span className="text-xs text-muted-foreground">{line.k}</span>
                  <span className="text-sm font-medium">{line.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Connector lines between steps (decorative) */}
        <div className="absolute -z-10 top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </div>
  );
}

/* ─── Chat Preview ─── */
function ChatPreview() {
  const [msgs, setMsgs] = useState<Array<{ role: string; text: string; widget?: boolean }>>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const DEMO_CONVERSATION = [
    { role: "user", text: "Hai, ada menu apa aja?" },
    { role: "assistant", text: "Ini dia produk kami! 👇", widget: true },
    { role: "user", text: "Risol mayo berapa?" },
    { role: "assistant", text: "Risol Mayo harganya Rp5.000/pcs. Beli 10 cuma Rp45.000 — hemat 10%! Mau pesan berapa?" },
  ];

  // Auto-scroll to bottom when messages or typing changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [msgs, typing]);

  useEffect(() => {
    let i = 0;
    const addMsg = () => {
      if (i >= DEMO_CONVERSATION.length) {
        setTimeout(() => { setMsgs([]); i = 0; addMsg(); }, 3000);
        return;
      }
      const msg = DEMO_CONVERSATION[i];
      if (msg.role === "assistant") setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMsgs((prev) => [...prev, msg]);
        i++;
        setTimeout(addMsg, msg.role === "user" ? 800 : 1500);
      }, msg.role === "assistant" ? 1200 : 300);
    };
    const t = setTimeout(addMsg, 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">CS Toko Risol</p>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="p-4 space-y-3 h-[300px] overflow-y-auto">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in`}>
            <div className={`
              max-w-[80%] px-3 py-2 rounded-2xl text-sm
              ${m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
              }
            `}>
              {m.text}
              {m.widget && (
                <div className="mt-2 p-2 rounded-lg bg-background/50 border border-border/50 space-y-1">
                  {["Risol Mayo — Rp5.000", "Risol Ayam — Rp6.000", "Risol Keju — Rp7.000"].map((item) => (
                    <div key={item} className="text-xs py-1 px-2 rounded bg-muted/50 flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start animate-in">
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border/50 flex items-center gap-2">
        <div className="flex-1 px-3 py-2 rounded-full bg-muted text-xs text-muted-foreground">Ketik pesan...</div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Send className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}

/* ─── Features Section ─── */
const FEATURES = [
  {
    icon: Bot,
    title: "Agent Builder",
    desc: "Buat AI agent dalam hitungan menit. Pilih model, set persona, hubungkan knowledge base.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Layout,
    title: "Canvas UI System",
    desc: "Widget visual interaktif — menu, katalog, price list — langsung di chat pelanggan.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: MessageSquare,
    title: "Multi-Channel Deploy",
    desc: "Satu klik deploy. Share link publik, embed di website, atau integrasikan ke WhatsApp.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Dashboard penggunaan token, performa agent, dan insight percakapan pelanggan.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "Token Limit Control",
    desc: "Set batas token per workspace atau per agent. Alert otomatis sebelum limit tercapai.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
];

/* ─── Stats ─── */
const STATS = [
  { value: "< 2 dtk", label: "Rata-rata respons" },
  { value: "24/7", label: "Layanan non-stop" },
  { value: "99.9%", label: "Uptime" },
  { value: "∞", label: "Skalabilitas" },
];

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <AppLogo className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">GenAM Studio</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="bg-primary/10 text-primary/100 hover:bg-primary/20 hover:text-primary animate-glow font-bold">
              <Link href="/register">Mulai Gratis <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-0 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 text-xs font-medium px-3 py-1 border-primary/30 text-primary">
              <Sparkles className="h-3 w-3 mr-1.5" /> Platform AI Agent untuk UMKM Indonesia
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
              Bangun AI Agent
              <br />
              <span className="bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
                yang Jualan untuk Kamu
              </span>
            </h1>
            <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
              Buat chatbot AI yang paham produk kamu, tampilkan katalog visual interaktif,
              dan layani pelanggan 24/7 — tanpa coding.
            </p>
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="ghost" size="lg" asChild className="h-11 px-6 bg-primary/10 text-primary/100 hover:bg-primary/20 hover:text-primary animate-glow font-bold">
                <Link href="/register">
                  Mulai Gratis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 px-6">
                <Link href="#demo">
                  <Play className="mr-2 h-4 w-4" /> Lihat Demo
                </Link>
              </Button>
            </div>
          </div>

          {/* Workflow Animation */}
          <WorkflowAnimation />
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-xs font-medium px-3 py-1">
                <Eye className="h-3 w-3 mr-1.5" /> Live Preview
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Agent yang Benar-benar<br />Paham Bisnis Kamu
              </h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-6">
                Lihat bagaimana AI agent merespons pelanggan dengan data produk yang akurat,
                menampilkan katalog visual, dan menangani transaksi — semua otomatis.
              </p>
              <div className="space-y-3">
                {[
                  "Respons natural dalam Bahasa Indonesia",
                  "Widget visual interaktif langsung di chat",
                  "Data produk selalu up-to-date dari Canvas",
                  "Handover ke manusia jika diperlukan",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-emerald-500" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <ChatPreview />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-t border-border/50 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Semua yang Kamu Butuhkan</h2>
            <p className="text-muted-foreground font-light max-w-md mx-auto">
              Platform lengkap untuk membangun, deploy, dan mengelola AI agent bisnis kamu.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors group">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works (compact) */}
      <section className="py-20 border-t border-border/50 bg-muted/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">3 Langkah Mulai</h2>
            <p className="text-muted-foreground font-light">Dari nol sampai live — kurang dari 10 menit.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Buat Agent",
                desc: "Pilih model AI, tulis persona agent, dan upload knowledge base produk kamu.",
                icon: Bot,
              },
              {
                step: "02",
                title: "Desain Canvas",
                desc: "Buat layout visual — katalog, menu, price list — yang ditampilkan agent ke pelanggan.",
                icon: Layout,
              },
              {
                step: "03",
                title: "Go Live",
                desc: "Dapatkan link chat publik. Share ke pelanggan lewat website, media sosial, atau WhatsApp.",
                icon: Zap,
              },
            ].map((s) => (
              <div key={s.step} className="relative p-6 rounded-2xl border border-border/50 bg-card/50">
                <span className="text-4xl font-bold text-muted/50 absolute top-4 right-5">{s.step}</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Siap Punya AI Agent<br />untuk Bisnis Kamu?
            </h2>
            <p className="text-muted-foreground font-light mb-8">
              Mulai gratis. Tanpa kartu kredit. Setup dalam hitungan menit.
            </p>
            <Button variant="ghost" size="lg" asChild className="h-12 px-8 text-base bg-primary/5 text-primary/70 hover:bg-primary/20 hover:text-primary animate-glow">
              <Link href="/register">
                Mulai Sekarang <ChevronRight className="ml-1.5 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <AppLogo className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">GenAM Studio</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Dibuat oleh <span className="font-medium text-foreground">Ade Saputra</span> · © {new Date().getFullYear()} GenAM Studio
          </p>
        </div>
      </footer>
    </div>
  );
}
