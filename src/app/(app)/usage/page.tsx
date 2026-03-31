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
import { ErrorAlert } from "@/components/common/error-alert";
import { useApiError } from "@/hooks/use-api-error";
import { apiFetch } from "@/lib/api";
import { SegmentedTokenBar } from "@/components/dashboard/segmented-token-bar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const dailyChartConfig = {
  tokensPrompt: {
    label: "Prompt",
    color: "hsl(var(--chart-1))",
  },
  tokensCompletion: {
    label: "Completion",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

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
  const { error, handleError, clearError } = useApiError();

  useEffect(() => {
    const fetchData = () => {
      apiFetch<UsageData>(`/api/usage?days=${range}`)
        .then((d) => setData(d))
        .catch(handleError)
        .finally(() => setLoading(false));
    };
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [range, handleError]);

  const limitPct = useMemo(() => {
    if (!data?.workspaceLimit) return 0;
    const { limit, used } = data.workspaceLimit;
    return limit > 0 ? (used / limit) * 100 : 0;
  }, [data]);

  const limitStatus = useMemo(() => {
    if (!data?.workspaceLimit) return null;
    const alertPct = data.workspaceLimit.alertPct || 80;
    if (limitPct >= 100) return { label: "Limit tercapai!", color: "text-red-500", barColor: "[&>div]:bg-red-500" };
    if (limitPct >= alertPct) return { label: "Mendekati limit!", color: "text-amber-500", barColor: "[&>div]:bg-amber-500" };
    return { label: null, color: "", barColor: "" };
  }, [limitPct, data]);

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
        {error && <ErrorAlert error={error} onDismiss={clearError} className="mb-4" />}
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
              value={Math.min(limitPct, 100)}
              className={`h-2 ${limitStatus?.barColor || ""}`}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {limitPct >= 100
                ? `${limitPct.toFixed(0)}% — melebihi limit`
                : `${limitPct.toFixed(0)}% terpakai bulan ini`
              }
              {limitStatus?.label && (
                <span className={`${limitStatus.color} ml-2 font-medium`}>{limitStatus.label}</span>
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
            label: "Completion ",
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
            <ChartContainer config={dailyChartConfig} className="min-h-[220px] w-full">
              <AreaChart data={data.dailyData} accessibilityLayer>
                <defs>
                  <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-tokensPrompt)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-tokensPrompt)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-tokensCompletion)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-tokensCompletion)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={fmt}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={fmtDate}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="tokensPrompt"
                  stroke="var(--color-tokensPrompt)"
                  fill="url(#promptGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="tokensCompletion"
                  stroke="var(--color-tokensCompletion)"
                  fill="url(#completionGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
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
