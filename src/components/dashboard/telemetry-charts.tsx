"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

interface CostEntry {
  date: string;
  amount: number;
}

export function TelemetryCharts() {
  const [data, setData] = useState<{ date: string; cost: number; count: number; tokens: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/usage?days=7')
      .then(r => r.json())
      .then(d => {
        if (!d.error && Array.isArray(d.chartData)) setData(d.chartData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' });

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
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Token']} labelFormatter={formatDate} contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" fill="url(#costGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip formatter={(v: any) => [v, 'Calls']} labelFormatter={formatDate} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" opacity={0.7} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
