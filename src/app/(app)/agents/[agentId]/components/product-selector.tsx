"use client";

import { useState, useEffect } from "react";
import { Search, Check, ShoppingBag, Loader2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

interface ProductSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ProductSelector({ selectedIds, onSelectionChange }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (open) {
      setLocalSelected(selectedIds);
      setLoading(true);
      fetch("/api/products?available=true")
        .then((r) => r.json())
        .then((d) => setProducts(Array.isArray(d) ? d : []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, selectedIds]);

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  function toggleProduct(id: string) {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleConfirm() {
    onSelectionChange(localSelected);
    setOpen(false);
  }

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  return (
    <div className="space-y-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Package className="h-3.5 w-3.5" />
            Pilih Produk ({selectedIds.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Pilih Produk untuk Agent
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1.5">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {products.length === 0
                    ? "Belum ada produk. Tambah produk di halaman Produk."
                    : "Tidak ada produk yang cocok"}
                </p>
              </div>
            ) : (
              filtered.map((product) => {
                const isSelected = localSelected.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 hover:border-border/80"
                    }`}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded-md object-cover shrink-0 border border-border/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(product.price)}
                        {product.category && (
                          <span className="ml-2 text-muted-foreground/70">
                            {product.category}
                          </span>
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {localSelected.length} produk terpilih
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirm}
              className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
            >
              Konfirmasi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected product chips */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedProducts.map((p) => (
            <Badge
              key={p.id}
              variant="secondary"
              className="text-xs gap-1.5 pr-1"
            >
              {p.name} — {formatRupiah(p.price)}
              <button
                type="button"
                onClick={() =>
                  onSelectionChange(selectedIds.filter((id) => id !== p.id))
                }
                className="ml-0.5 rounded-full hover:bg-muted p-0.5"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
