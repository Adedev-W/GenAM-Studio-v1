"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, ShoppingBag, Loader2, Sparkles, Check, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorAlert } from "@/components/common/error-alert";
import { useApiError } from "@/hooks/use-api-error";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";

function fmtRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

const BUSINESS_TYPES = [
  "Restoran/Kuliner", "Toko Online", "Jasa/Servis", "Salon & Kecantikan",
  "Pendidikan/Kursus", "Retail/Toko Fisik", "Lainnya",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const { error, handleError, clearError } = useApiError();

  // Create form
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // AI Generate
  const [genType, setGenType] = useState("Restoran/Kuliner");
  const [genDesc, setGenDesc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genResults, setGenResults] = useState<any[]>([]);
  const [genSelected, setGenSelected] = useState<Set<number>>(new Set());

  const fetchProducts = useCallback(() => {
    apiFetch<Product[]>("/api/products")
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [handleError]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (availFilter === "available" && !p.is_available) return false;
    if (availFilter === "unavailable" && p.is_available) return false;
    return true;
  });

  const stats = {
    total: products.length,
    available: products.filter((p) => p.is_available).length,
    lowStock: products.filter((p) => p.stock_type === "limited" && p.stock_quantity !== null && p.stock_quantity <= p.low_stock_alert).length,
    unavailable: products.filter((p) => !p.is_available).length,
  };

  const handleCreate = async () => {
    if (!formName) return;
    setSaving(true);
    try {
      const data = await apiFetch<Product>("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName, description: formDesc || null,
          category: formCategory || null, price: parseInt(formPrice) || 0,
        }),
      });
      setProducts((prev) => [data, ...prev]);
      setCreateOpen(false);
      setFormName(""); setFormDesc(""); setFormCategory(""); setFormPrice("");
    } catch (err) { handleError(err); }
    finally { setSaving(false); }
  };

  const handleToggle = async (product: Product) => {
    try {
      const data = await apiFetch<Product>(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !product.is_available }),
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? data : p)));
    } catch (err) { handleError(err); }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      await apiFetch(`/api/products/${deleteProduct.id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
    } catch (err) { handleError(err); }
  };

  const handleGenerate = async () => {
    if (!genDesc) return;
    setGenerating(true);
    try {
      const data = await apiFetch<{ products: any[] }>("/api/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_type: genType, description: genDesc }),
      });
      const items = data.products || [];
      setGenResults(items);
      setGenSelected(new Set(items.map((_: any, i: number) => i)));
    } catch (err) { handleError(err); }
    finally { setGenerating(false); }
  };

  const handleSaveGenerated = async () => {
    const selected = genResults.filter((_, i) => genSelected.has(i));
    if (selected.length === 0) return;
    setSaving(true);
    try {
      const data = await apiFetch<Product[]>("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: selected }),
      });
      setProducts((prev) => [...(Array.isArray(data) ? data : []), ...prev]);
      setGenOpen(false); setGenResults([]); setGenSelected(new Set()); setGenDesc("");
    } catch (err) { handleError(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Produk" description="Kelola produk, layanan, dan menu bisnis kamu">
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" onClick={() => setGenOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" /> Generate AI
        </Button>
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Produk
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Produk", value: stats.total, color: "text-foreground" },
          { label: "Tersedia", value: stats.available, color: "text-emerald-500" },
          { label: "Stok Menipis", value: stats.lowStock, color: "text-amber-500" },
          { label: "Tidak Tersedia", value: stats.unavailable, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
              <p className={`text-3xl font-thin mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <ErrorAlert error={error} onDismiss={clearError} className="mb-4" />}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={availFilter} onValueChange={setAvailFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="available">Tersedia</SelectItem>
            <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Belum ada produk" description="Tambah produk pertama atau gunakan AI Generate untuk memulai">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" onClick={() => setGenOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" /> Generate AI
            </Button>
            <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary font-medium" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
          </div>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <Card key={product.id} className="group border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    </Link>
                    {product.category && (
                      <Badge variant="outline" className="text-xs mt-1">{product.category}</Badge>
                    )}
                    <p className="text-lg font-thin mt-2">
                      {product.price_display || fmtRupiah(product.price)}
                    </p>
                    {product.discount_pct > 0 && (
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs mt-1">
                        -{product.discount_pct}% {product.discount_note || ""}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Switch checked={product.is_available} onCheckedChange={() => handleToggle(product)} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>{product.is_available ? "Tersedia" : "Tidak tersedia"}</span>
                  {product.stock_type === "limited" && (
                    <span>| Stok: {product.stock_quantity ?? 0}</span>
                  )}
                  {product.variants.length > 0 && (
                    <span>| {product.variants.length} varian</span>
                  )}
                  {product.options.length > 0 && (
                    <span>| {product.options.length} addon</span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border/50">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/products/${product.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteProduct(product)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Product Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-semibold">Tambah Produk</DialogTitle>
            <DialogDescription className="font-light">Tambah produk baru ke katalog</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-sm">Nama Produk</Label>
              <Input placeholder="Nasi Goreng Spesial" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">Deskripsi</Label>
              <Textarea placeholder="Deskripsi singkat produk..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">Kategori</Label>
              <Input placeholder="Makanan, Minuman, dll" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">Harga (Rp)</Label>
              <Input type="number" placeholder="25000" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={handleCreate} disabled={!formName || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Generate Produk dengan AI
            </DialogTitle>
            <DialogDescription className="font-light">Ceritakan tentang bisnis kamu, AI akan membuat daftar produk otomatis</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium text-sm">Jenis Bisnis</Label>
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-sm">Ceritakan tentang bisnis kamu</Label>
              <Textarea
                placeholder="Warung nasi goreng di Bandung. Menu utama nasi goreng spesial 25rb, mie ayam bakso 20rb, soto ayam 18rb. Minuman es teh 5rb, es jeruk 7rb, kopi susu 15rb..."
                value={genDesc} onChange={(e) => setGenDesc(e.target.value)} rows={4}
              />
              <p className="text-xs text-muted-foreground">Tips: sebutkan nama produk, harga, kategori, dan opsi/varian jika ada</p>
            </div>
            {genResults.length === 0 && (
              <Button variant="ghost" className="w-full bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={handleGenerate} disabled={!genDesc || generating}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {generating ? "Menggenerate..." : "Generate"}
              </Button>
            )}
            {genResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ditemukan {genResults.length} produk:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {genResults.map((item, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${genSelected.has(i) ? "border-primary/50 bg-primary/5" : "border-border/50"}`}
                      onClick={() => {
                        const next = new Set(genSelected);
                        next.has(i) ? next.delete(i) : next.add(i);
                        setGenSelected(next);
                      }}
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded border ${genSelected.has(i) ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                        {genSelected.has(i) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <p className="text-sm font-light">{fmtRupiah(item.price || 0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {genResults.length > 0 && (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setGenResults([]); setGenSelected(new Set()); }}>Reset</Button>
              <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={handleSaveGenerated} disabled={genSelected.size === 0 || saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan {genSelected.size} Produk
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
        title="Hapus Produk"
        description={`Yakin ingin menghapus "${deleteProduct?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
