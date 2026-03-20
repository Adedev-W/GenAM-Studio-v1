"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Package, Check, Clock, Banknote, Truck, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STATUS_STEPS = [
  { key: "pending", label: "Pesanan Baru", icon: Clock },
  { key: "confirmed", label: "Dikonfirmasi", icon: Check },
  { key: "paid", label: "Dibayar", icon: Banknote },
  { key: "processing", label: "Diproses", icon: Truck },
  { key: "completed", label: "Selesai", icon: Package },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(45 93% 47%)",
  confirmed: "hsl(217 91% 60%)",
  paid: "hsl(160 84% 39%)",
  processing: "hsl(263 70% 50%)",
  completed: "hsl(142 76% 36%)",
  cancelled: "hsl(0 84% 60%)",
};

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

interface OrderData {
  order_number: string;
  status: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  notes: string | null;
  created_at: string;
  timeline: { from_status: string | null; to_status: string; note: string | null; created_at: string }[];
}

export default function OrderTrackingPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/order/${orderNumber}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOrder(data);
        }
      })
      .catch(() => setError("Gagal memuat pesanan"))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  // Realtime updates
  useEffect(() => {
    if (!orderNumber) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`order:${orderNumber}`)
      .on("broadcast", { event: "status_update" }, () => {
        // Re-fetch on status change
        fetch(`/api/order/${orderNumber}`)
          .then((r) => r.json())
          .then((data) => { if (!data.error) setOrder(data); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh" style={{ background: "hsl(var(--background))" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 text-center p-6" style={{ background: "hsl(var(--background))" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
          <Package className="h-7 w-7" style={{ color: "hsl(var(--muted-foreground))" }} />
        </div>
        <p className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Pesanan Tidak Ditemukan</p>
        <p className="text-sm font-light" style={{ color: "hsl(var(--muted-foreground))" }}>{error}</p>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

  return (
    <div className="min-h-dvh" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="px-4 py-6 text-center" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: `${statusColor}15` }}
        >
          <Package className="h-6 w-6" style={{ color: statusColor }} />
        </div>
        <h1 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>{order.order_number}</h1>
        <p className="text-xs font-light mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Status indicator */}
        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.15)" }}>
            <XCircle className="h-5 w-5 shrink-0" style={{ color: "hsl(0 84% 60%)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(0 84% 60%)" }}>Pesanan Dibatalkan</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Status Pesanan</p>
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div
                          className="flex-1 h-0.5 -mx-1"
                          style={{ background: isActive ? statusColor : "hsl(var(--border))" }}
                        />
                      )}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: isActive ? statusColor : "hsl(var(--muted))",
                          color: isActive ? "white" : "hsl(var(--muted-foreground))",
                          boxShadow: isCurrent ? `0 0 0 3px ${statusColor}30` : "none",
                        }}
                      >
                        <StepIcon className="w-3.5 h-3.5" />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className="flex-1 h-0.5 -mx-1"
                          style={{ background: i < currentStepIndex ? statusColor : "hsl(var(--border))" }}
                        />
                      )}
                    </div>
                    <span
                      className="text-[10px] text-center leading-tight"
                      style={{
                        color: isActive ? statusColor : "hsl(var(--muted-foreground))",
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Detail Pesanan</p>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
                style={{
                  borderBottom: i < order.items.length - 1 ? "1px solid hsl(var(--border))" : "none",
                  color: "hsl(var(--foreground))",
                }}
              >
                <span>{item.qty}x {item.name}</span>
                <span className="font-medium">{formatRupiah(item.qty * item.price)}</span>
              </div>
            ))}
            <div
              className="flex items-center justify-between px-4 py-3 text-sm font-bold"
              style={{
                borderTop: "1px solid hsl(var(--border))",
                background: "hsl(var(--muted) / 0.3)",
                color: "hsl(var(--foreground))",
              }}
            >
              <span>Total</span>
              <span>{formatRupiah(Number(order.subtotal))}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {order.timeline.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Riwayat</p>
            <div className="space-y-0">
              {order.timeline.map((entry, i) => (
                <div key={i} className="flex gap-3 pb-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: STATUS_COLORS[entry.to_status] || "hsl(var(--muted-foreground))" }}
                    />
                    {i < order.timeline.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: "hsl(var(--border))" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "hsl(var(--foreground))" }}>
                      {entry.note || entry.to_status}
                    </p>
                    <p className="text-[10px] font-light" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {timeAgo(entry.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs font-light pt-4" style={{ color: "hsl(var(--muted-foreground))" }}>
          Halaman ini akan otomatis diperbarui saat status berubah.
        </p>
      </div>
    </div>
  );
}
