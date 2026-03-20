"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, CheckCircle2, Banknote, Truck, XCircle,
  MessageSquare, Loader2, User, Link2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending:    { label: "Pesanan Baru",    color: "text-yellow-500",  icon: Clock,        bg: "bg-yellow-500/10" },
  confirmed:  { label: "Dikonfirmasi",    color: "text-blue-500",    icon: CheckCircle2, bg: "bg-blue-500/10" },
  paid:       { label: "Sudah Dibayar",   color: "text-emerald-500", icon: Banknote,     bg: "bg-emerald-500/10" },
  processing: { label: "Sedang Diproses", color: "text-violet-500",  icon: Truck,        bg: "bg-violet-500/10" },
  completed:  { label: "Selesai",         color: "text-green-500",   icon: CheckCircle2, bg: "bg-green-500/10" },
  cancelled:  { label: "Dibatalkan",      color: "text-red-500",     icon: XCircle,      bg: "bg-red-500/10" },
};

const PAYMENT_METHODS = [
  { value: "transfer_bank", label: "Transfer Bank" },
  { value: "cod", label: "COD" },
  { value: "cash", label: "Cash" },
  { value: "ewallet", label: "E-Wallet" },
];

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setInternalNotes(data.internal_notes || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string, extra?: Record<string, any>) => {
    setUpdating(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder((prev: any) => ({ ...prev, ...updated }));
      // Re-fetch for timeline
      const detail = await fetch(`/api/orders/${id}`).then((r) => r.json());
      setOrder(detail);
      toast({ title: `Status diperbarui ke "${STATUS_CONFIG[status]?.label}"` });
    } else {
      toast({ title: "Gagal update", variant: "destructive" });
    }
    setUpdating(false);
  };

  const saveNotes = async () => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internal_notes: internalNotes }),
    });
    if (res.ok) toast({ title: "Catatan disimpan" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/orders")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{order.order_number}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm">{order.contacts?.display_name || "—"}</span>
            {order.contacts?.phone && (
              <span className="text-xs text-muted-foreground">{order.contacts.phone}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border-0 text-xs px-2 py-0.5`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {cfg.label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              const url = `${window.location.origin}/order/${order.order_number}`;
              navigator.clipboard.writeText(url);
              toast({ title: "Link tracking disalin!" });
            }}
          >
            <Link2 className="h-3 w-3 mr-1" /> Copy Link Tracking
          </Button>
        </div>
      </div>

      {/* Items */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Item Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(order.items || []).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div>
                  <span className="text-sm">{item.qty}x {item.name}</span>
                  {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                </div>
                <span className="text-sm font-medium">{formatRupiah(item.qty * item.price)}</span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-base font-bold">{formatRupiah(Number(order.subtotal || 0))}</span>
          </div>
        </CardContent>
      </Card>

      {/* Customer notes */}
      {order.notes && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Catatan pelanggan:</p>
            <p className="text-sm">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {order.status === "pending" && (
        <Card className="border-border/50">
          <CardContent className="p-4 flex gap-2">
            <Button variant="ghost" className="flex-1 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" disabled={updating} onClick={() => updateStatus("confirmed")}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Konfirmasi Pesanan</>}
            </Button>
            <Button variant="destructive" disabled={updating} onClick={() => updateStatus("cancelled")}>
              <XCircle className="mr-1.5 h-4 w-4" /> Tolak
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === "confirmed" && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Konfirmasi Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    paymentMethod === pm.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border/50 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
              disabled={!paymentMethod || updating}
              onClick={() => updateStatus("paid", { payment_method: paymentMethod })}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Banknote className="mr-1.5 h-4 w-4" /> Konfirmasi Pembayaran</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === "paid" && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Button variant="ghost" className="w-full bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" disabled={updating} onClick={() => updateStatus("processing")}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Truck className="mr-1.5 h-4 w-4" /> Proses Pesanan</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === "processing" && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Button variant="ghost" className="w-full bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" disabled={updating} onClick={() => updateStatus("completed")}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Tandai Selesai</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment info */}
      {order.paid_at && (
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pembayaran</p>
              <p className="text-sm font-medium">
                {PAYMENT_METHODS.find((p) => p.value === order.payment_method)?.label || order.payment_method}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(order.paid_at).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.timeline.map((log: any, i: number) => {
                const logCfg = STATUS_CONFIG[log.to_status];
                const LogIcon = logCfg?.icon || Clock;
                return (
                  <div key={log.id || i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${logCfg?.bg || "bg-muted"}`}>
                      <LogIcon className={`h-3 w-3 ${logCfg?.color || "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{logCfg?.label || log.to_status}</p>
                      {log.note && <p className="text-xs text-muted-foreground">{log.note}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal notes */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Catatan Internal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Tambah catatan internal (hanya terlihat oleh kamu)..."
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={2}
          />
          <Button size="sm" variant="outline" onClick={saveNotes}>Simpan Catatan</Button>
        </CardContent>
      </Card>

      {/* Link to conversation */}
      {order.conversation_id && (
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/chat/${order.conversation_id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Buka Percakapan
          </Link>
        </Button>
      )}
    </div>
  );
}
