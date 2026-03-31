"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Bot, Send, Loader2, User, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WidgetPreview } from "@/components/widgets/widget-preview";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  widgets?: any[];
  sender_type?: "customer" | "agent" | "owner";
  created_at?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pesanan Baru",    color: "bg-yellow-500/10 text-yellow-500" },
  confirmed:  { label: "Dikonfirmasi",    color: "bg-blue-500/10 text-blue-500" },
  paid:       { label: "Sudah Dibayar",   color: "bg-emerald-500/10 text-emerald-500" },
  processing: { label: "Diproses",        color: "bg-violet-500/10 text-violet-500" },
  completed:  { label: "Selesai",         color: "bg-green-500/10 text-green-500" },
  cancelled:  { label: "Dibatalkan",      color: "bg-red-500/10 text-red-500" },
};

export default function OrderChatPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load order + conversation messages
  useEffect(() => {
    async function load() {
      try {
        const orderRes = await fetch(`/api/orders/${id}`);
        if (!orderRes.ok) { setLoading(false); return; }
        const orderData = await orderRes.json();
        setOrder(orderData);

        if (orderData.conversation_id) {
          const msgRes = await fetch(`/api/chat-conversations/${orderData.conversation_id}/messages`);
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(Array.isArray(msgData) ? msgData : []);
          }
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [id]);

  // Subscribe to new messages via Realtime
  useEffect(() => {
    if (!order?.conversation_id) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`owner-chat:${order.conversation_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${order.conversation_id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Only add if not already in list (avoid duplicates from own sends)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, {
              id: newMsg.id,
              role: newMsg.role,
              content: newMsg.content,
              widgets: newMsg.widgets || [],
              sender_type: newMsg.sender_type,
              created_at: newMsg.created_at,
            }];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [order?.conversation_id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !order?.conversation_id) return;
    setInput("");
    setSending(true);

    // Optimistic add
    const tempId = crypto.randomUUID();
    setMessages((prev) => [...prev, {
      id: tempId,
      role: "assistant",
      content: text,
      sender_type: "owner",
    }]);

    try {
      const res = await fetch(`/api/chat-conversations/${order.conversation_id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const saved = await res.json();
        // Replace temp message with saved one
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: saved.id, created_at: saved.created_at } : m));
      } else {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, order?.conversation_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
        </Button>
      </div>
    );
  }

  if (!order.conversation_id) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Pesanan ini tidak memiliki percakapan chat</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={`/orders/${id}`}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Detail</Link>
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_LABELS[order.status] || STATUS_LABELS.pending;

  return (
    <div className="flex flex-col h-[calc(100dvh-2rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/50 mb-0 shrink-0">
        <Link href={`/orders/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate">{order.order_number}</h1>
            <Badge variant="outline" className={`text-xs h-4 px-1.5 border-0 ${statusCfg.color}`}>
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.contacts?.display_name || "Pelanggan"}{order.contacts?.phone ? ` · ${order.contacts.phone}` : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Belum ada pesan</p>
          </div>
        )}
        {messages.map((msg) => {
          const senderType = msg.sender_type || (msg.role === "user" ? "customer" : "agent");
          const isOwner = senderType === "owner";
          const isCustomer = senderType === "customer";
          const isAgent = senderType === "agent";

          return (
            <div key={msg.id} className={`flex gap-2 ${isOwner ? "justify-end" : "justify-start"}`}>
              {/* Avatar for non-owner */}
              {!isOwner && (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isAgent ? "bg-primary/10" : "bg-muted"
                }`}>
                  {isAgent ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              )}

              <div className={`max-w-[75%] space-y-1.5 flex flex-col ${isOwner ? "items-end" : "items-start"}`}>
                {/* Sender label */}
                <div className="flex items-center gap-1.5">
                  {isAgent && (
                    <span className="text-[10px] font-medium text-primary/70 flex items-center gap-0.5">
                      <Bot className="h-2.5 w-2.5" /> AI Agent
                    </span>
                  )}
                  {isCustomer && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {order.contacts?.display_name || "Pelanggan"}
                    </span>
                  )}
                  {isOwner && (
                    <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                      <ShieldCheck className="h-2.5 w-2.5" /> Kamu
                    </span>
                  )}
                  {msg.created_at && (
                    <span className="text-[10px] text-muted-foreground/50">
                      {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    isOwner
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : isAgent
                        ? "bg-primary/5 text-foreground rounded-bl-sm border border-primary/10"
                        : "bg-muted/50 text-foreground rounded-bl-sm"
                  }`}
                >
                  <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                </div>

                {/* Widgets */}
                {msg.widgets && msg.widgets.length > 0 && (
                  <div className="w-full space-y-2 max-w-sm">
                    {msg.widgets.map((w: any, wi: number) => (
                      <div key={wi} className="rounded-xl overflow-hidden border border-border/50">
                        {w.label && (
                          <div className="px-3 py-1.5 text-xs font-medium bg-muted/50 text-muted-foreground border-b border-border/50">
                            {w.label}
                          </div>
                        )}
                        <div className="p-3">
                          <WidgetPreview type={w.type} props={w.props} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Avatar for owner */}
              {isOwner && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-emerald-500/10">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-2 py-3 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Balas pesan pelanggan..."
            disabled={sending}
            className="text-sm h-11 sm:h-9"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 sm:h-9 sm:w-9 shrink-0 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-center text-[10px] mt-1.5 text-muted-foreground/50">
          Pesan akan dikirim langsung ke pelanggan sebagai balasan
        </p>
      </div>
    </div>
  );
}
