import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot, MessageSquare, Layout, Zap, Shield, BarChart3,
  ArrowRight, ChevronRight, Sparkles,
  Play, Eye,
} from "lucide-react";
import { AppLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkflowAnimation } from "./components/workflow-animation";
import { ChatPreview } from "./components/chat-preview";

export const metadata: Metadata = {
  title: "GenAM Studio — Platform AI Agent untuk UMKM Indonesia",
  description:
    "Buat chatbot AI yang paham produk kamu, tampilkan katalog visual interaktif, dan layani pelanggan 24/7 — tanpa coding. Platform AI agent untuk UMKM Indonesia.",
  alternates: {
    canonical: "https://genam.studio",
  },
};

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

const STATS = [
  { value: "< 2 dtk", label: "Rata-rata respons" },
  { value: "24/7", label: "Layanan non-stop" },
  { value: "99.9%", label: "Uptime" },
  { value: "\u221E", label: "Skalabilitas" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GenAM Studio",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Platform AI Agent untuk UMKM Indonesia — buat chatbot AI yang paham produk kamu, tampilkan katalog visual interaktif, dan layani pelanggan 24/7 tanpa coding.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
    description: "Mulai gratis, tanpa kartu kredit",
  },
  author: {
    "@type": "Person",
    name: "Ade Saputra",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
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
                      <svg className="h-3 w-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
            Dibuat oleh <span className="font-medium text-foreground">Ade Saputra</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
