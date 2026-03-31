"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBusiness } from "@/contexts/business-context";

export default function PilihBisnisPage() {
  const router = useRouter();
  const { businesses, switchBusiness, loading } = useBusiness();

  // Auto-select if only 1 business
  useEffect(() => {
    if (!loading && businesses.length === 1) {
      switchBusiness(businesses[0].id);
    }
  }, [loading, businesses, switchBusiness]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Pilih Bisnis</h1>
          <p className="text-sm text-muted-foreground font-light">Pilih bisnis yang ingin kamu kelola</p>
        </div>

        <div className="space-y-3">
          {businesses.map((b) => (
            <Card
              key={b.id}
              className="border-border/50 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors"
              onClick={() => switchBusiness(b.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{b.name}</p>
                  {b.business_type && (
                    <p className="text-xs text-muted-foreground">{b.business_type}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{b.plan || "free"}</Badge>
              </CardContent>
            </Card>
          ))}

          <Card
            className="border-dashed border-border/50 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors"
            onClick={() => router.push("/buat-bisnis")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Buat Bisnis Baru</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
