"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, Search, Plus, Tag, ShoppingBag, MessageSquare,
  Loader2, X, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const TAG_PRESETS = ["loyal", "wholesale", "baru", "vip", "reseller"];
const TAG_COLORS: Record<string, string> = {
  loyal: "bg-green-500/10 text-green-500",
  wholesale: "bg-blue-500/10 text-blue-500",
  baru: "bg-yellow-500/10 text-yellow-500",
  vip: "bg-violet-500/10 text-violet-500",
  reseller: "bg-amber-500/10 text-amber-500",
};

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "online";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}h lalu`;
  return `${Math.floor(days / 30)}bln lalu`;
}

export default function CustomersPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newContact, setNewContact] = useState({ display_name: "", email: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchContacts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterTag) params.set("tag", filterTag);
    const res = await fetch(`/api/contacts?${params}`);
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }, [search, filterTag]);

  useEffect(() => { setLoading(true); fetchContacts(); }, [fetchContacts]);

  const handleAdd = async () => {
    if (!newContact.display_name) return;
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newContact),
    });
    if (res.ok) {
      toast({ title: "Pelanggan ditambahkan" });
      setAddOpen(false);
      setNewContact({ display_name: "", email: "", phone: "", notes: "" });
      fetchContacts();
    } else {
      toast({ title: "Gagal menambahkan", variant: "destructive" });
    }
    setSaving(false);
  };

  // Collect all tags from contacts
  const allTags = [...new Set(contacts.flatMap((c) => c.tags || []))];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pelanggan</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} pelanggan tercatat</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary">
              <Plus className="mr-1.5 h-4 w-4" /> Tambah
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pelanggan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 space-x-2 pt-2 mb-2">
              <div className="space-y-1">
                <Label className="text-xs">Nama *</Label>
                <Input
                  placeholder="Nama pelanggan"
                  value={newContact.display_name}
                  onChange={(e) => setNewContact((p) => ({ ...p, display_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newContact.email}
                    onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telepon</Label>
                  <Input
                    placeholder="08123456789"
                    value={newContact.phone}
                    onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Catatan</Label>
                <Textarea
                  placeholder="Catatan tentang pelanggan ini..."
                  value={newContact.notes}
                  onChange={(e) => setNewContact((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                />
              </div>
              <Button variant="ghost" className="w-full bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" disabled={saving || !newContact.display_name} onClick={handleAdd}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tambah Pelanggan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama, email, atau telepon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {filterTag && (
            <button
              onClick={() => setFilterTag(null)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
            >
              {filterTag} <X className="h-3 w-3" />
            </button>
          )}
          {allTags.filter((t) => t !== filterTag).map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-2 py-1 rounded-full text-xs ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"} hover:opacity-80`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Contacts list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search || filterTag
              ? "Tidak ada pelanggan yang cocok"
              : "Pelanggan akan otomatis tercatat saat mereka chat dengan agent kamu."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <Link key={contact.id} href={`/customers/${contact.id}`} className="block">
              <Card className="border-border/50 hover:border-border hover:bg-muted/30 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {(contact.display_name || "?")[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{contact.display_name || "—"}</span>
                      {(contact.tags || []).map((tag: string) => (
                        <span key={tag} className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {contact.phone && <span>{contact.phone}</span>}
                      {contact.email && <span>{contact.email}</span>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{contact.total_orders || 0}</p>
                      <p>Order</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{formatRupiah(Number(contact.total_spent || 0))}</p>
                      <p>Total</p>
                    </div>
                    <div className="text-center">
                      <p>{timeAgo(contact.last_seen_at)}</p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
