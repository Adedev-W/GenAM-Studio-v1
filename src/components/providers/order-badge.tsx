"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useOrderBadge() {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/stats");
      if (res.ok) {
        const stats = await res.json();
        setCount(stats.pending || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchCount();

    // Subscribe to order changes
    const channel = supabase
      .channel("order-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCount, supabase]);

  return count;
}
