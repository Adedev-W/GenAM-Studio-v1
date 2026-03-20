"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ShoppingBag, MessageSquare, Tag, Loader2,
  Phone, Mail, Plus, X, Save, Clock, CheckCircle2, Banknote,
  Truck, XCircle, ChevronDown, ChevronUp, Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const TAG_PRESETS = ["loyal", "wholesale", "baru", "vip", "reseller"];
const TAG_COLORS: Record<string, string> = {
  loyal: "bg-green-500/10 text-green-500",
  wholesale: "bg-blue-500/10 text-blue-500",
  baru: "bg-yellow-500/10 text-yellow-500",
  vip: "bg-violet-500/10 text-violet-500",
  reseller: "bg-amber-500/10 text-amber-500",
};

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

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedConvId, setExpandedConvId] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [convLoading, setConvLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setContact(data);
        setNotes(data.notes || "");
        setTags(data.tags || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const save = async (updates: Record<string, any>) => {
    setSaving(true);
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setContact((prev: any) => ({ ...prev, ...updated }));
      toast({ title: "Tersimpan" });
    }
    setSaving(false);
  };

  const addTag = (tag: string) => {
    if (!tag || tags.includes(tag)) return;
    const newTags = [...tags, tag];
    setTags(newTags);
    setNewTag("");
    save({ tags: newTags });
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    save({ tags: newTags });
  };

  const toggleConversation = async (convId: string) => {
    if (expandedConvId === convId) {
      setExpandedConvId(null);
      return;
    }
    setExpandedConvId(convId);
    setConvLoading(true);
    try {
      const res = await fetch(`/api/chat-conversations/${convId}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setConvMessages(msgs);
      }
    } catch {}
    setConvLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contact || contact.error) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Pelanggan tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/customers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </div>
    );
  }

  const avgOrder = contact.total_orders > 0 ? Number(contact.total_spent) / contact.total_orders : 0;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/customers")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali
      </Button>

      {/* Profile */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
          {(contact.display_name || "?")[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{contact.display_name || "—"}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {contact.phone && (
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>
            )}
            {contact.email && (
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <span key={tag} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          {TAG_PRESETS.filter((t) => !tags.includes(t)).slice(0, 3).map((t) => (
            <button
              key={t}
              onClick={() => addTag(t)}
              className="px-2 py-1 rounded-full text-[10px] border border-dashed border-border hover:bg-muted/50 text-muted-foreground"
            >
              + {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{contact.total_orders || 0}</p>
            <p className="text-xs text-muted-foreground">Pesanan</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{formatRupiah(Number(contact.total_spent || 0))}</p>
            <p className="text-xs text-muted-foreground">Total Belanja</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{formatRupiah(Math.round(avgOrder))}</p>
            <p className="text-xs text-muted-foreground">Rata-rata</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: orders + conversations + notes */}
      <Tabs defaultValue="orders">
        <TabsList className="w-full">
          <TabsTrigger value="orders" className="flex-1">
            <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Pesanan ({(contact.orders || []).length})
          </TabsTrigger>
          <TabsTrigger value="chats" className="flex-1">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Chat ({(contact.conversations || []).length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex-1">Catatan</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-2 mt-4">
          {(contact.orders || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada pesanan</p>
          ) : (
            (contact.orders || []).map((order: any) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="border-border/50 hover:border-border transition-colors cursor-pointer">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{order.order_number}</span>
                        <p className="text-xs text-muted-foreground">
                          {(order.items || []).map((i: any) => `${i.qty}x ${i.name}`).join(", ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border-0 text-[10px]`}>
                          <StatusIcon className="h-2.5 w-2.5 mr-0.5" />{cfg.label}
                        </Badge>
                        <p className="text-sm font-semibold mt-0.5">{formatRupiah(Number(order.subtotal || 0))}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="chats" className="space-y-2 mt-4">
          {(contact.conversations || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada percakapan</p>
          ) : (
            (contact.conversations || []).map((conv: any) => {
              const isExpanded = expandedConvId === conv.id;
              const ToggleIcon = isExpanded ? ChevronUp : ChevronDown;
              return (
                <Card key={conv.id} className="border-border/50">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleConversation(conv.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{(conv.chat_sessions as any)?.name || "Chat Session"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.created_at).toLocaleDateString("id-ID")}
                        </span>
                        <ToggleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t px-3 py-2 max-h-80 overflow-y-auto space-y-2 bg-muted/10">
                        {convLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : convMessages.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">Tidak ada pesan</p>
                        ) : (
                          convMessages.map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                              <div className="flex items-start gap-1.5 max-w-[85%]">
                                {msg.role === "assistant" && (
                                  <Bot className="h-3.5 w-3.5 text-muted-foreground mt-1.5 shrink-0" />
                                )}
                                <div
                                  className={`px-3 py-1.5 rounded-lg text-xs leading-relaxed ${
                                    msg.role === "user"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-card border"
                                  }`}
                                >
                                  <span className="whitespace-pre-wrap">{msg.content}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-2">
          <Textarea
            placeholder="Catatan tentang pelanggan ini..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <Button size="sm" variant="outline" disabled={saving} onClick={() => save({ notes })}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1.5 h-4 w-4" /> Simpan</>}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
