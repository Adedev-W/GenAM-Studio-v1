"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package, Clock, CheckCircle2, Banknote, Truck, XCircle,
  Search, Plus, MessageSquare, ArrowRight, Loader2, RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending:    { label: "Baru",          color: "text-yellow-500",  icon: Clock,         bg: "bg-yellow-500/10" },
  confirmed:  { label: "Dikonfirmasi",  color: "text-blue-500",    icon: CheckCircle2,  bg: "bg-blue-500/10" },
  paid:       { label: "Dibayar",       color: "text-emerald-500", icon: Banknote,      bg: "bg-emerald-500/10" },
  processing: { label: "Diproses",      color: "text-violet-500",  icon: Truck,         bg: "bg-violet-500/10" },
  completed:  { label: "Selesai",       color: "text-green-500",   icon: CheckCircle2,  bg: "bg-green-500/10" },
  cancelled:  { label: "Dibatalkan",    color: "text-red-500",     icon: XCircle,       bg: "bg-red-500/10" },
};

const TABS = ["all", "pending", "confirmed", "paid", "processing", "completed", "cancelled"];
const TAB_LABELS: Record<string, string> = {
  all: "Semua", pending: "Baru", confirmed: "Dikonfirmasi", paid: "Dibayar",
  processing: "Diproses", completed: "Selesai", cancelled: "Dibatalkan",
};

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`/api/orders?status=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { setLoading(true); fetchOrders(); }, [fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, supabase]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: `Status diperbarui ke "${STATUS_CONFIG[status]?.label}"` });
      fetchOrders();
    } else {
      toast({ title: "Gagal update status", variant: "destructive" });
    }
    setUpdating(null);
  };

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(s) ||
      o.contacts?.display_name?.toLowerCase().includes(s) ||
      o.contacts?.phone?.includes(s)
    );
  });

  const tabCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, { all: 0 });

  function getNextActions(status: string): Array<{ label: string; newStatus: string; variant: "default" | "destructive" | "outline" }> {
    switch (status) {
      case "pending": return [
        { label: "Konfirmasi", newStatus: "confirmed", variant: "default" },
        { label: "Tolak", newStatus: "cancelled", variant: "destructive" },
      ];
      case "confirmed": return [
        { label: "Konfirmasi Bayar", newStatus: "paid", variant: "default" },
      ];
      case "paid": return [
        { label: "Proses", newStatus: "processing", variant: "default" },
      ];
      case "processing": return [
        { label: "Selesai", newStatus: "completed", variant: "default" },
      ];
      default: return [];
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pesanan</h1>
          <p className="text-sm text-muted-foreground">Kelola pesanan dari pelanggan</p>
        </div>
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => router.push("/orders/new")}>
          <Plus className="mr-1.5 h-4 w-4" /> Buat Pesanan
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari order, nama, atau telepon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((t) => {
          const count = t === "all" ? orders.length : tabCounts[t] || 0;
          const isActive = tab === t;
          const cfg = STATUS_CONFIG[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }
              `}
            >
              {cfg && <cfg.icon className="h-3 w-3" />}
              {TAB_LABELS[t]}
              {count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-foreground"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? "Tidak ada pesanan yang cocok" : tab === "all" ? "Belum ada pesanan. Pesanan akan muncul otomatis saat pelanggan order via chat." : `Tidak ada pesanan dengan status "${TAB_LABELS[tab]}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const actions = getNextActions(order.status);
            const itemsSummary = (order.items || [])
              .map((i: any) => `${i.qty}x ${i.name}`)
              .join(", ");

            return (
              <Card
                key={order.id}
                className="border-border/50 hover:border-border transition-colors overflow-hidden"
              >
                <CardContent className="p-4">
                  {/* Top row: order number + status + time */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{order.order_number}</span>
                      <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border-0 text-[10px] px-1.5 py-0`}>
                        <cfg.icon className="h-2.5 w-2.5 mr-0.5" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(order.created_at)}</span>
                  </div>

                  {/* Customer info */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {(order.contacts?.display_name || "?")[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{order.contacts?.display_name || "—"}</span>
                    {order.contacts?.phone && (
                      <span className="text-xs text-muted-foreground">{order.contacts.phone}</span>
                    )}
                  </div>

                  {/* Items + total */}
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{itemsSummary}</p>
                  <p className="text-sm font-semibold mb-3">{formatRupiah(Number(order.subtotal || 0))}</p>

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div className="flex items-center gap-2">
                      {actions.map((a) => (
                        <Button
                          key={a.newStatus}
                          size="sm"
                          variant={a.variant}
                          className="text-xs h-7 px-3"
                          disabled={updating === order.id}
                          onClick={(e) => { e.stopPropagation(); updateStatus(order.id, a.newStatus); }}
                        >
                          {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : a.label}
                        </Button>
                      ))}
                      {order.conversation_id && (
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2 ml-auto" asChild>
                          <Link href={`/chat/${order.conversation_id}`}>
                            <MessageSquare className="h-3 w-3 mr-1" /> Chat
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2" asChild>
                        <Link href={`/orders/${order.id}`}>
                          Detail <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )}
                  {actions.length === 0 && (
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2" asChild>
                      <Link href={`/orders/${order.id}`}>
                        Lihat Detail <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
