"use client";

import { Star, AlertCircle, ChevronDown, Clock, Loader2, Sparkles, BarChart2, Code2 } from "lucide-react";

export interface WidgetAction {
  type: "button_click" | "select_change" | "toggle_change";
  label: string;
  value?: any;
}

function s(val: any): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return JSON.stringify(val);
}

export function WidgetPreview({ type, props: rawProps, onAction }: { type: string; props: Record<string, any>; onAction?: (action: WidgetAction) => void }) {
  const props: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawProps || {})) {
    props[k] = (typeof v === 'object' && v !== null && !Array.isArray(v)) ? JSON.stringify(v) : v;
  }
  switch (type) {
    case "text":
      return (
        <p className={`text-${props.size || "base"} font-${props.weight || "normal"} text-${props.color === "muted" ? "muted-foreground" : "foreground"} text-${props.align || "left"}`}>
          {props.content}
        </p>
      );
    case "heading": {
      const level = typeof props.level === 'string' && ['h1','h2','h3','h4'].includes(props.level) ? props.level : 'h2';
      const Tag = level as 'h1'|'h2'|'h3'|'h4';
      const sizeMap: Record<string, string> = { h1: "text-3xl font-bold", h2: "text-2xl font-semibold", h3: "text-xl font-semibold", h4: "text-lg font-medium" };
      return <Tag className={sizeMap[level] || "text-2xl font-semibold"}>{s(props.content)}</Tag>;
    }
    case "badge": {
      const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        red: "bg-red-500/10 text-red-500 border-red-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        default: "bg-muted/50 text-muted-foreground",
      };
      return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorMap[props.color] || colorMap.default}`}>{props.text}</span>;
    }
    case "separator":
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          {props.label && <span className="text-xs text-muted-foreground">{props.label}</span>}
          {props.label && <div className="flex-1 h-px bg-border" />}
        </div>
      );
    case "button": {
      const variantClass: Record<string, string> = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-transparent hover:bg-muted text-foreground",
        ghost: "bg-transparent hover:bg-muted text-foreground",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      };
      const sizeClass: Record<string, string> = { sm: "text-xs px-3 py-1.5", default: "text-sm px-4 py-2", lg: "text-base px-6 py-3" };
      return (
        <button
          onClick={() => onAction?.({ type: "button_click", label: props.text, value: props.value })}
          className={`inline-flex items-center gap-2 rounded-md font-medium transition-colors ${variantClass[props.variant] || variantClass.default} ${sizeClass[props.size] || sizeClass.default} ${onAction ? "cursor-pointer" : "cursor-default"}`}
        >
          {props.text}
        </button>
      );
    }
    case "toggle":
      return (
        <div
          onClick={() => onAction?.({ type: "toggle_change", label: props.label, value: !props.checked })}
          className={`flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 ${onAction ? "cursor-pointer" : ""}`}
        >
          <div>
            <p className="text-sm font-medium">{props.label}</p>
            {props.description && <p className="text-xs text-muted-foreground mt-0.5">{props.description}</p>}
          </div>
          <div className={`w-10 h-6 rounded-full relative transition-colors ${props.checked ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${props.checked ? "translate-x-5" : "translate-x-1"}`} />
          </div>
        </div>
      );
    case "input":
      return (
        <div className="space-y-1.5">
          {props.label && <label className="text-sm font-medium">{props.label}{props.required && <span className="text-red-500 ml-1">*</span>}</label>}
          <div className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-muted-foreground">{props.placeholder}</div>
        </div>
      );
    case "select":
      if (onAction) {
        return (
          <div className="space-y-1.5">
            {props.label && <label className="text-sm font-medium">{props.label}</label>}
            <select
              defaultValue=""
              onChange={(e) => onAction({ type: "select_change", label: props.label || "", value: e.target.value })}
              className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground"
            >
              <option value="" disabled>{props.placeholder || "Pilih..."}</option>
              {(props.options || []).map((o: any) => (
                <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
              ))}
            </select>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          {props.label && <label className="text-sm font-medium">{props.label}</label>}
          <div className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 py-2 text-sm text-muted-foreground">
            {props.placeholder || "Select..."}<ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </div>
      );
    case "card":
      return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {props.showImage && (
            <div className="h-36 bg-muted flex items-center justify-center text-xs text-muted-foreground">
              {props.imageUrl ? <img src={props.imageUrl} alt="" className="w-full h-full object-cover" /> : "Image placeholder"}
            </div>
          )}
          <div className="p-4">
            {props.title && <p className="text-sm font-semibold">{props.title}</p>}
            {props.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{props.subtitle}</p>}
            {props.body && <p className="text-sm mt-2 text-muted-foreground">{props.body}</p>}
          </div>
        </div>
      );
    case "alert": {
      const alertColors: Record<string, string> = {
        info: "border-blue-500/30 bg-blue-500/10 text-blue-500",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-500",
        error: "border-red-500/30 bg-red-500/10 text-red-500",
      };
      return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border ${alertColors[props.type] || alertColors.info}`}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            {props.title && <p className="text-sm font-semibold">{props.title}</p>}
            <p className="text-sm">{props.message}</p>
          </div>
        </div>
      );
    }
    case "stat": {
      const trendColor = props.trend === "up" ? "text-emerald-500" : props.trend === "down" ? "text-red-500" : "text-muted-foreground";
      return (
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{props.label}</p>
          <p className="text-3xl font-thin mt-1">{props.value}</p>
          {props.delta && <p className={`text-xs mt-1 ${trendColor}`}>{props.delta}</p>}
        </div>
      );
    }
    case "rating": {
      return (
        <div className="space-y-1">
          {props.label && <p className="text-sm font-medium">{props.label}</p>}
          <div className="flex gap-1">
            {Array.from({ length: props.max || 5 }, (_, i) => (
              <Star
                key={i}
                onClick={() => onAction?.({ type: "button_click", label: props.label || "Rating", value: i + 1 })}
                className={`h-5 w-5 ${i < props.value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"} ${onAction ? "cursor-pointer" : ""}`}
              />
            ))}
          </div>
        </div>
      );
    }
    case "table": {
      const cols = (props.columns || "").split(",").map((c: string) => c.trim()).filter(Boolean);
      const rows = (props.rows || "").split("\n").map((r: string) => r.split(",").map((c: string) => c.trim()));
      return (
        <div className="overflow-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            {cols.length > 0 && (
              <thead><tr className="border-b border-border bg-muted/30">{cols.map((c: string) => <th key={c} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{c}</th>)}</tr></thead>
            )}
            <tbody>
              {rows.filter((r: string[]) => r.some(c => c)).map((row: string[], i: number) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  {row.map((cell: string, j: number) => <td key={j} className="px-3 py-2 text-xs">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "list": {
      const items = (props.items || "").split("\n").filter(Boolean);
      return (
        <ul className={`space-y-1 ${props.numbered ? "list-decimal list-inside" : ""}`}>
          {items.map((item: string, i: number) => (
            <li key={i} className="text-sm flex items-start gap-2">
              {!props.numbered && <span className="text-muted-foreground mt-1.5 text-xs">•</span>}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "code":
      return (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
            <span className="text-xs text-muted-foreground font-mono">{props.language || "code"}</span>
          </div>
          <pre className="p-3 text-xs font-mono overflow-auto bg-muted/20 text-foreground leading-relaxed">{props.content}</pre>
        </div>
      );
    case "bar_chart": {
      const labels = (props.labels || "").split(",").map((l: string) => l.trim());
      const values = (props.values || "").split(",").map((v: string) => parseFloat(v.trim()) || 0);
      const max = Math.max(...values, 1);
      const colorMap: Record<string, string> = { blue: "bg-blue-500", emerald: "bg-emerald-500", amber: "bg-amber-500", purple: "bg-purple-500" };
      const barColor = colorMap[props.color] || "bg-primary";
      return (
        <div className="space-y-2">
          {props.title && <p className="text-sm font-semibold">{props.title}</p>}
          <div className="flex items-end gap-2 h-24">
            {values.map((v: number, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{v}</span>
                <div className={`w-full rounded-t ${barColor} opacity-80 transition-all`} style={{ height: `${(v / max) * 70}px` }} />
                <span className="text-xs text-muted-foreground truncate w-full text-center">{labels[i] || i}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "line_chart": {
      const labels = (props.labels || "").split(",").map((l: string) => l.trim());
      const values = (props.values || "").split(",").map((v: string) => parseFloat(v.trim()) || 0);
      const max = Math.max(...values, 1);
      const colorMap: Record<string, string> = { blue: "#3b82f6", emerald: "#10b981", amber: "#f59e0b", purple: "#a855f7" };
      const lineColor = colorMap[props.color] || "#3b82f6";
      const w = 300; const h = 80; const pad = 8;
      const points = values.map((v: number, i: number) => {
        const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
        const y = h - pad - ((v / max) * (h - pad * 2));
        return `${x},${y}`;
      }).join(" ");
      return (
        <div className="space-y-1">
          {props.title && <p className="text-sm font-semibold">{props.title}</p>}
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
            <polyline fill="none" stroke={lineColor} strokeWidth="2" points={points} strokeLinejoin="round" strokeLinecap="round" />
            {values.map((v: number, i: number) => {
              const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
              const y = h - pad - ((v / max) * (h - pad * 2));
              return <circle key={i} cx={x} cy={y} r="3" fill={lineColor} />;
            })}
          </svg>
          <div className="flex justify-between">
            {labels.map((l: string, i: number) => <span key={i} className="text-xs text-muted-foreground">{l}</span>)}
          </div>
        </div>
      );
    }
    case "pie_chart": {
      const labels = (props.labels || "").split(",").map((l: string) => l.trim());
      const values = (props.values || "").split(",").map((v: string) => parseFloat(v.trim()) || 0);
      const total = values.reduce((s: number, v: number) => s + v, 0) || 1;
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4"];
      let cumulative = 0;
      const slices = values.map((v: number, i: number) => {
        const start = (cumulative / total) * 360;
        cumulative += v;
        const end = (cumulative / total) * 360;
        const r = 45; const cx = 60; const cy = 60;
        const startRad = ((start - 90) * Math.PI) / 180;
        const endRad = ((end - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad); const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad); const y2 = cy + r * Math.sin(endRad);
        const largeArc = end - start > 180 ? 1 : 0;
        return { path: `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`, color: colors[i % colors.length], label: labels[i], pct: Math.round((v / total) * 100) };
      });
      return (
        <div className="flex items-center gap-4">
          {props.title && <p className="text-sm font-semibold mb-1">{props.title}</p>}
          <svg viewBox="0 0 120 120" className="w-24 h-24 shrink-0">
            {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.85" />)}
          </svg>
          <div className="space-y-1">
            {slices.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium ml-auto">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "chat_bubble":
      return (
        <div className={`flex items-start gap-2.5 ${props.role === "user" ? "flex-row-reverse" : ""}`}>
          {props.showAvatar && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${props.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {props.role === "user" ? "U" : "AI"}
            </div>
          )}
          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${props.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
            {props.content}
          </div>
        </div>
      );
    case "thinking": {
      const steps = (props.steps || "").split("\n").filter(Boolean);
      return (
        <div className="space-y-2">
          {steps.map((step: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i < steps.length - 1 ? "border-primary bg-primary/20" : "border-primary/50"}`}>
                {i < steps.length - 1 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <span className={i < steps.length - 1 ? "line-through opacity-50" : ""}>{step}</span>
              {i === steps.length - 1 && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />}
            </div>
          ))}
        </div>
      );
    }
    case "timestamp":
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {props.label && <span>{props.label}:</span>}
          <span>{new Date().toLocaleString()}</span>
        </div>
      );
    case "image":
      return (
        <div className="space-y-1.5">
          {props.url && (
            <div className="rounded-lg overflow-hidden border border-border/50">
              <img
                src={props.url}
                alt={props.alt || "Produk"}
                className="w-full object-cover max-h-48"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          {props.caption && <p className="text-sm font-medium text-foreground">{props.caption}</p>}
        </div>
      );
    default:
      return <div className="text-xs text-muted-foreground italic">Unknown widget: {type}</div>;
  }
}
