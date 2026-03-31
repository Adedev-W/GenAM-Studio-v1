"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag, Clock, CheckCircle2, Banknote, Truck, XCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending:    { label: "Baru",         color: "text-yellow-500",  icon: Clock,        bg: "bg-yellow-500/10" },
  confirmed:  { label: "Dikonfirmasi", color: "text-blue-500",    icon: CheckCircle2, bg: "bg-blue-500/10" },
  paid:       { label: "Dibayar",      color: "text-emerald-500", icon: Banknote,     bg: "bg-emerald-500/10" },
  processing: { label: "Diproses",     color: "text-violet-500",  icon: Truck,        bg: "bg-violet-500/10" },
  completed:  { label: "Selesai",      color: "text-green-500",   icon: CheckCircle2, bg: "bg-green-500/10" },
  cancelled:  { label: "Dibatalkan",   color: "text-red-500",     icon: XCircle,      bg: "bg-red-500/10" },
};

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  created_at: string;
  contacts: { display_name: string; email: string; phone: string } | null;
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    apiFetch<Order[]>('/api/orders')
      .then(data => {
        if (Array.isArray(data)) setOrders(data.slice(0, 5));
      })
      .catch((err) => {
        if (err && typeof err === 'object' && 'title' in err) {
          toast({ title: err.title, description: err.message, variant: "destructive" });
        }
      })
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Pesanan Terbaru</CardTitle>
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
            Lihat semua <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Belum ada pesanan" description="Pesanan akan muncul di sini setelah pelanggan order melalui chat" />
        ) : (
          <div className="space-y-1">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const itemsSummary = (order.items || []).map(i => `${i.qty}x ${i.name}`).join(", ");

              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{order.order_number}</span>
                        <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border-0 text-[10px] px-1.5 py-0`}>
                          <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {order.contacts?.display_name || "—"} · {itemsSummary || "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatRupiah(Number(order.subtotal || 0))}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(order.created_at)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
