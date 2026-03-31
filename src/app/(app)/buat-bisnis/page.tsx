"use client";

import { useState, useEffect } from "react";
import { Loader2, Building2, ArrowLeft, Key } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { useApiError } from "@/hooks/use-api-error";
import { ErrorAlert } from "@/components/common/error-alert";

const BUSINESS_TYPES = [
  "Restoran/Kuliner", "Toko Online", "Jasa/Servis", "Salon & Kecantikan",
  "Pendidikan/Kursus", "Retail/Toko Fisik", "Lainnya",
];

interface ApiKeyInfo {
  has_key: boolean;
  business_id?: string;
  business_name?: string;
  hint?: string;
}

export default function BuatBisnisPage() {
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("Restoran/Kuliner");
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();

  // API key reuse
  const [keyInfo, setKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [newBusinessId, setNewBusinessId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  // Check if any existing business has an API key
  useEffect(() => {
    apiFetch<ApiKeyInfo>("/api/businesses/api-key-check")
      .then(setKeyInfo)
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    clearError();

    try {
      const biz = await apiFetch<{ id: string }>("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, business_type: businessType }),
      });

      setNewBusinessId(biz.id);

      // If existing business has API key, offer to copy
      if (keyInfo?.has_key && keyInfo.business_id) {
        setShowCopyModal(true);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      handleError(err);
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!keyInfo?.business_id || !newBusinessId) return;
    setCopying(true);
    try {
      await apiFetch("/api/businesses/copy-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_business_id: keyInfo.business_id,
          target_business_id: newBusinessId,
        }),
      });
    } catch {
      // Non-critical — user can configure manually later
    }
    window.location.href = "/dashboard";
  };

  const handleSkipCopy = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg border-border/50">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Buat Bisnis Baru</h2>
              <p className="text-sm text-muted-foreground font-light">Tambah bisnis baru ke akun kamu</p>
            </div>
          </div>

          {error && <ErrorAlert error={error} onDismiss={clearError} />}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Nama Bisnis</Label>
            <Input
              placeholder="Contoh: Warung Pak Budi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Jenis Bisnis</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {keyInfo?.has_key && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <Key className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                API key dari <span className="font-medium text-foreground">{keyInfo.business_name}</span> ({keyInfo.hint}) bisa digunakan untuk bisnis ini
              </p>
            </div>
          )}

          <Button
            className="w-full"
            variant="ghost"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
            {loading ? "Membuat bisnis..." : "Buat Bisnis"}
          </Button>
        </CardContent>
      </Card>

      {/* API Key Copy Modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Gunakan API Key yang Sama?</DialogTitle>
            <DialogDescription>
              Bisnis <span className="font-medium text-foreground">{keyInfo?.business_name}</span> sudah
              punya API key OpenAI ({keyInfo?.hint}). Mau gunakan key yang sama untuk{" "}
              <span className="font-medium text-foreground">{name}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleSkipCopy} disabled={copying}>
              Tidak, Nanti
            </Button>
            <Button onClick={handleCopyKey} disabled={copying}>
              {copying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
              Ya, Gunakan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
