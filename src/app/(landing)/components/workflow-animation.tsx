"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Layout, Globe, BarChart3 } from "lucide-react";

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

export function WorkflowAnimation() {
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
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8 px-2">
        {WORKFLOW_STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setActive(i); setProgress(0); }}
            className="flex flex-col items-center gap-1.5 sm:gap-2 group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
              <div className={`
                absolute inset-0 rounded-xl sm:rounded-2xl transition-all duration-500
                ${i === active
                  ? `bg-gradient-to-br ${s.color} shadow-lg`
                  : i < active
                    ? "bg-primary/20"
                    : "bg-muted"
                }
              `} />
              <s.icon className={`relative h-4 w-4 sm:h-5 sm:w-5 ${i === active ? "text-white" : i < active ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className={`text-[10px] sm:text-xs font-medium transition-colors text-center leading-tight ${i === active ? "text-foreground" : "text-muted-foreground"}`}>
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
        >
          {/* Header bar */}
          <div className={`px-4 sm:px-5 py-3 bg-gradient-to-r ${step.color} flex items-center gap-2 sm:gap-3`}>
            <step.icon className="h-4 w-4 text-white shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-white truncate">{step.demo.title}</span>
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/60" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">{step.desc}</p>
            <div className="space-y-2 sm:space-y-3">
              {step.demo.lines.map((line) => (
                <div
                  key={line.k}
                  className="flex items-center justify-between py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg bg-muted/30 gap-2"
                >
                  <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{line.k}</span>
                  <span className="text-xs sm:text-sm font-medium text-right">{line.v}</span>
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
