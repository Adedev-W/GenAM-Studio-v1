"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MessageSquare, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function QuickActions() {
  const [firstSession, setFirstSession] = useState<{ id: string } | null>(null);

  useEffect(() => {
    apiFetch<{ id: string }[]>("/api/chat-sessions")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setFirstSession(data[0]);
      })
      .catch(() => {});
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Aksi Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 text-amber-500 hover:text-amber-500 hover:bg-black" asChild>
            <Link href="/orders">
              <Package className="h-5 w-5 text-amber-500" />
              <span className="text-xs">Lihat Pesanan</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 text-blue-500 hover:text-blue-500 hover:bg-black" asChild>
            <Link href={firstSession ? `/chat/${firstSession.id}` : "/chat"}>
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span className="text-xs">{firstSession ? "Buka Chat Test" : "Buat Chat"}</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2 text-primary hover:text-primary hover:bg-black" asChild>
            <Link href="/agents">
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-xs">Buat Agent</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
