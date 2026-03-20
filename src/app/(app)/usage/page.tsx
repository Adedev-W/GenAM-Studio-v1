"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity, Hash, Zap, MessageSquare, Bot, Loader2, Settings2,
  TrendingUp, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { SegmentedTokenBar } from "@/components/dashboard/segmented-token-bar";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

interface UsageData {
  dailyData: Array<{ date: string; tokensPrompt: number; tokensCompletion: number; requests: number }>;
  agentData: Array<{ id: string; name: string; tokensPrompt: number; tokensCompletion: number; total: number; requests: number }>;
  modelData: Array<{ model: string; tokensPrompt: number; tokensCompletion: number; total: number; requests: number }>;
  totalPrompt: number;
  totalCompletion: number;
  totalTokens: number;
  totalRequests: number;
  workspaceLimit: { id: string; name: string; limit: number; used: number; alertPct: number } | null;
}

const RANGES = [
  { value: "7", label: "7 Hari" },
  { value: "30", label: "30 Hari" },
  { value: "90", label: "90 Hari" },
];

export default function UsagePage() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/usage?days=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  const limitPct = useMemo(() => {
    if (!data?.workspaceLimit) return 0;
    const { limit, used } = data.workspaceLimit;
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.totalTokens === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Penggunaan Token" description="Pantau penggunaan token AI workspace kamu">
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" asChild>
            <Link href="/usage/limits"><Settings2 className="mr-2 h-4 w-4" /> Atur Limit</Link>
          </Button>
        </PageHeader>
        <EmptyState
          icon={Activity}
          title="Belum ada data penggunaan"
          description="Data token akan muncul setelah agent memproses pesan dari pelanggan"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Penggunaan Token" description="Pantau penggunaan token AI workspace kamu">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" asChild>
            <Link href="/usage/limits"><Settings2 className="mr-2 h-4 w-4" /> Limit</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Workspace limit bar */}
      {data.workspaceLimit && (
        <Card className="border-border/50 bg-gradient-to-r from-card to-card/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">{data.workspaceLimit.name || "Limit Workspace"}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {fmt(data.workspaceLimit.used)} / {fmt(data.workspaceLimit.limit)} token
              </span>
            </div>
            <Progress
              value={limitPct}
              className={`h-2 ${limitPct >= data.workspaceLimit.alertPct ? "[&>div]:bg-amber-500" : ""}`}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {limitPct.toFixed(0)}% terpakai bulan ini
              {limitPct >= data.workspaceLimit.alertPct && (
                <span className="text-amber-500 ml-2">Mendekati limit!</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Token",
            value: fmt(data.totalTokens),
            sub: `${range} hari terakhir`,
            icon: Hash,
            gradient: "from-blue-500/10 to-blue-600/5",
            iconColor: "text-blue-500",
          },
          {
            label: "Prompt",
            value: fmt(data.totalPrompt),
            sub: `${((data.totalPrompt / data.totalTokens) * 100).toFixed(0)}% dari total`,
            icon: ArrowUpRight,
            gradient: "from-violet-500/10 to-violet-600/5",
            iconColor: "text-violet-500",
          },
          {
            label: "Completion",
            value: fmt(data.totalCompletion),
            sub: `${((data.totalCompletion / data.totalTokens) * 100).toFixed(0)}% dari total`,
            icon: ArrowDownRight,
            gradient: "from-amber-500/10 to-amber-600/5",
            iconColor: "text-amber-500",
          },
          {
            label: "Request",
            value: fmt(data.totalRequests),
            sub: `~${fmt(Math.round(data.totalTokens / (data.totalRequests || 1)))} token/req`,
            icon: MessageSquare,
            gradient: "from-emerald-500/10 to-emerald-600/5",
            iconColor: "text-emerald-500",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/50 overflow-hidden">
            <CardContent className={`p-4 bg-gradient-to-br ${s.gradient}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-lg bg-background/60 ${s.iconColor}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily area chart - takes 2 cols */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Token Harian
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.dailyData}>
                <defs>
                  <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={fmt}
                />
                <Tooltip
                  formatter={(v: any, name: string) => [
                    fmt(Number(v)),
                    name === "tokensPrompt" ? "Prompt" : "Completion",
                  ]}
                  labelFormatter={fmtDate}
                  contentStyle={{
                    fontSize: 12,
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tokensPrompt"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#promptGrad)"
                  strokeWidth={2}
                  name="tokensPrompt"
                />
                <Area
                  type="monotone"
                  dataKey="tokensCompletion"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#completionGrad)"
                  strokeWidth={2}
                  name="tokensCompletion"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--chart-1))" }} />
                <span className="text-xs text-muted-foreground">Prompt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: "hsl(var(--chart-2))" }} />
                <span className="text-xs text-muted-foreground">Completion</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model breakdown */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Per Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.modelData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data</p>
            ) : (
              <div className="space-y-4">
                {data.modelData.map((m) => (
                  <div key={m.model} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{m.model}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {fmt(m.total)}
                      </Badge>
                    </div>
                    <SegmentedTokenBar prompt={m.tokensPrompt} completion={m.tokensCompletion} total={m.total} height="h-5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent breakdown */}
      {data.agentData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              Penggunaan per Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.agentData.map((a) => (
                <div key={a.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{a.name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{a.requests} req</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {fmt(a.total)} token
                      </Badge>
                    </div>
                  </div>
                  <SegmentedTokenBar prompt={a.tokensPrompt} completion={a.tokensCompletion} total={a.total} height="h-4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
