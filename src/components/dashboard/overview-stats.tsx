"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Users, ShoppingBag, Clock } from "lucide-react";

function fmtRupiah(n: number) {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}rb`;
  return `Rp${n.toLocaleString("id-ID")}`;
}

interface Stats {
  totalAgents: number;
  activeAgents: number;
  totalContacts: number;
  newContactsToday: number;
  todayOrderCount: number;
  todayRevenue: number;
  pendingOrders: number;
}

export function OverviewStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => { if (!data.error) setStats(data); })
      .catch(() => {});
  }, []);

  const items = [
    {
      label: "Total Agents",
      value: stats ? (stats.totalAgents ?? 0).toString() : "—",
      sub: stats ? `${stats.activeAgents ?? 0} aktif` : "loading...",
      icon: Bot,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Pelanggan",
      value: stats ? (stats.totalContacts ?? 0).toString() : "—",
      sub: stats ? `+${stats.newContactsToday ?? 0} hari ini` : "loading...",
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Pesanan Hari Ini",
      value: stats ? (stats.todayOrderCount ?? 0).toString() : "—",
      sub: stats ? fmtRupiah(stats.todayRevenue ?? 0) : "loading...",
      icon: ShoppingBag,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Pesanan Pending",
      value: stats ? (stats.pendingOrders ?? 0).toString() : "—",
      sub: stats?.pendingOrders ? "butuh tindakan" : "semua clear",
      icon: Clock,
      color: stats?.pendingOrders ? "text-red-500" : "text-muted-foreground",
      bg: stats?.pendingOrders ? "bg-red-500/10" : "bg-muted/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(item => (
        <Card key={item.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-light">{item.label}</p>
                <p className="text-2xl font-thin mt-1">{item.value}</p>
                <p className="text-xs text-muted-foreground font-light mt-1">{item.sub}</p>
              </div>
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
