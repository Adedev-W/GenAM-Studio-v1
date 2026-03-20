"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationContextType {
  pendingCount: number;
}

const NotificationContext = createContext<NotificationContextType>({ pendingCount: 0 });

export function useNotifications() {
  return useContext(NotificationContext);
}

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

export function RealtimeNotificationProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const [pendingCount, setPendingCount] = useState(0);
  const { toast } = useToast();
  const supabase = createClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch initial pending count
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/stats");
      if (res.ok) {
        const stats = await res.json();
        setPendingCount(stats.pending || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Create audio element for notification sound
  useEffect(() => {
    // Simple notification beep using Web Audio API
    audioRef.current = null; // Will use Web Audio API instead
  }, []);

  const playSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  // Subscribe to orders realtime
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`orders-notify-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const order = payload.new as any;
          setPendingCount((prev) => prev + 1);
          playSound();
          toast({
            title: "Pesanan Baru!",
            description: `${order.order_number || "Order"} — ${formatRupiah(Number(order.subtotal || 0))}`,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Re-fetch count on any update
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, supabase, toast, playSound, fetchPendingCount]);

  return (
    <NotificationContext.Provider value={{ pendingCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
