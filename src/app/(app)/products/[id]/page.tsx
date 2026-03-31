"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, Plus, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorAlert } from "@/components/common/error-alert";
import { useApiError } from "@/hooks/use-api-error";
import { apiFetch } from "@/lib/api";
import type { Product, ProductVariant, ProductOption } from "@/lib/types";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { error, handleError, clearError } = useApiError();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [discountNote, setDiscountNote] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [stockType, setStockType] = useState("unlimited");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState("5");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [tags, setTags] = useState("");

  useEffect(() => {
    apiFetch<Product>(`/api/products/${id}`)
      .then((data) => {
        setProduct(data);
        setName(data.name);
        setDescription(data.description || "");
        setCategory(data.category || "");
        setPrice(String(data.price));
        setPriceDisplay(data.price_display || "");
        setDiscountPct(String(data.discount_pct || 0));
        setDiscountNote(data.discount_note || "");
        setIsAvailable(data.is_available);
        setStockType(data.stock_type);
        setStockQuantity(data.stock_quantity != null ? String(data.stock_quantity) : "");
        setLowStockAlert(String(data.low_stock_alert));
        setVariants(data.variants || []);
        setOptions(data.options || []);
        setTags((data.tags || []).join(", "));
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [id, handleError]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await apiFetch<Product>(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description: description || null, category: category || null,
          price: parseInt(price) || 0, price_display: priceDisplay || null,
          discount_pct: parseInt(discountPct) || 0, discount_note: discountNote || null,
          is_available: isAvailable, stock_type: stockType,
          stock_quantity: stockType === "limited" ? (parseInt(stockQuantity) || 0) : null,
          low_stock_alert: parseInt(lowStockAlert) || 5,
          variants, options,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      setProduct(data);
    } catch (err) { handleError(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      router.push("/products");
    } catch (err) { handleError(err); }
  };

  const addVariant = () => setVariants([...variants, { name: "", options: [""], prices: [0] }]);
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, v: ProductVariant) => setVariants(variants.map((old, idx) => idx === i ? v : old));

  const addOption = () => setOptions([...options, { name: "", price: 0 }]);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!product) {
    return <div className="text-center py-12 text-muted-foreground">Produk tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{product.name}</h1>
          <p className="text-sm text-muted-foreground font-light">Edit detail produk</p>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive bg-destructive/5 hover:text-destructive hover:bg-destructive/20" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Hapus
        </Button>
      </div>

      {error && <ErrorAlert error={error} onDismiss={clearError} />}

      {/* Basic Info */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Informasi Dasar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nama Produk</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Deskripsi</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Kategori</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Makanan" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tags</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="bestseller, baru" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Harga & Diskon</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Harga (Rp)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tampilan Harga (opsional)</Label>
              <Input value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} placeholder="Mulai Rp 25.000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Diskon (%)</Label>
              <Input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Catatan Diskon</Label>
              <Input value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} placeholder="Promo Ramadan!" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Ketersediaan & Stok</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Tersedia</Label>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipe Stok</Label>
            <Select value={stockType} onValueChange={setStockType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">Tidak Terbatas</SelectItem>
                <SelectItem value="limited">Terbatas (Track Stok)</SelectItem>
                <SelectItem value="made_to_order">Made to Order</SelectItem>
                <SelectItem value="by_schedule">Sesuai Jadwal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {stockType === "limited" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jumlah Stok</Label>
                <Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Alert Stok Menipis</Label>
                <Input type="number" value={lowStockAlert} onChange={(e) => setLowStockAlert(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variants */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Varian</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addVariant}>
            <Plus className="mr-1 h-3 w-3" /> Tambah Varian
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {variants.length === 0 && <p className="text-sm text-muted-foreground font-light">Belum ada varian</p>}
          {variants.map((v, i) => (
            <div key={i} className="p-3 rounded-lg border border-border/50 space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder="Nama varian (Ukuran, Level Pedas)" value={v.name}
                  onChange={(e) => updateVariant(i, { ...v, name: e.target.value })} className="flex-1" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeVariant(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1">
                {v.options.map((opt, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Input placeholder="Opsi" value={opt} className="flex-1"
                      onChange={(e) => {
                        const newOpts = [...v.options]; newOpts[j] = e.target.value;
                        updateVariant(i, { ...v, options: newOpts });
                      }} />
                    <Input type="number" placeholder="Harga" value={v.prices[j] || 0} className="w-28"
                      onChange={(e) => {
                        const newPrices = [...v.prices]; newPrices[j] = parseInt(e.target.value) || 0;
                        updateVariant(i, { ...v, prices: newPrices });
                      }} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      const newOpts = v.options.filter((_, idx) => idx !== j);
                      const newPrices = v.prices.filter((_, idx) => idx !== j);
                      updateVariant(i, { ...v, options: newOpts, prices: newPrices });
                    }}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                  updateVariant(i, { ...v, options: [...v.options, ""], prices: [...v.prices, 0] });
                }}><Plus className="mr-1 h-3 w-3" /> Tambah Opsi</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Options/Addons */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Addon / Tambahan</CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addOption}>
            <Plus className="mr-1 h-3 w-3" /> Tambah Addon
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {options.length === 0 && <p className="text-sm text-muted-foreground font-light">Belum ada addon</p>}
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input placeholder="Nama addon" value={opt.name} className="flex-1"
                onChange={(e) => { const n = [...options]; n[i] = { ...opt, name: e.target.value }; setOptions(n); }} />
              <Input type="number" placeholder="Harga" value={opt.price} className="w-28"
                onChange={(e) => { const n = [...options]; n[i] = { ...opt, price: parseInt(e.target.value) || 0 }; setOptions(n); }} />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeOption(i)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild><Link href="/products">Batal</Link></Button>
        <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={handleSave} disabled={!name || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Perubahan
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Produk"
        description={`Yakin ingin menghapus "${product?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
