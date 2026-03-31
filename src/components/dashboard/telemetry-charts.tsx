"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const tokenChartConfig = {
  tokens: {
    label: "Token",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const requestChartConfig = {
  count: {
    label: "Request",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function TelemetryCharts() {
  const [data, setData] = useState<{ date: string; cost: number; count: number; tokens: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = () => {
      apiFetch<any>('/api/usage?days=7')
        .then(d => {
          if (Array.isArray(d.chartData)) setData(d.chartData);
        })
        .catch((err) => {
          if (err && typeof err === 'object' && 'title' in err) {
            toast({ title: err.title, description: err.message, variant: "destructive" });
          }
        })
        .finally(() => setLoading(false));
    };
    fetchData();
    const interval = setInterval(fetchData, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [toast]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Token (7 hari)</CardTitle>
          <CardDescription className="font-light text-xs">Penggunaan token harian</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 bg-muted/20 rounded animate-pulse" />
          ) : data.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Belum ada data" description="Data token akan muncul setelah agent memproses pesan" />
          ) : (
            <ChartContainer config={tokenChartConfig} className="min-h-[160px] w-full">
              <AreaChart data={data} accessibilityLayer>
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-tokens)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-tokens)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelFormatter={formatDate}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="var(--color-tokens)"
                  fill="url(#tokenGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Request (7 hari)</CardTitle>
          <CardDescription className="font-light text-xs">Volume request harian</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 bg-muted/20 rounded animate-pulse" />
          ) : data.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Belum ada data" description="Metrik request akan muncul setelah agent aktif" />
          ) : (
            <ChartContainer config={requestChartConfig} className="min-h-[160px] w-full">
              <BarChart data={data} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={formatDate}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
