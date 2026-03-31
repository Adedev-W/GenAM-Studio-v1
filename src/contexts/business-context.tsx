"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface BusinessInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  business_type: string | null;
  target_market: string | null;
  channels: string[] | null;
  tone: string | null;
}

interface BusinessContextValue {
  business: BusinessInfo | null;
  businesses: BusinessInfo[];
  loading: boolean;
  switchBusiness: (id: string) => Promise<void>;
  deleteBusiness: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue>({
  business: null,
  businesses: [],
  loading: true,
  switchBusiness: async () => {},
  deleteBusiness: async () => {},
  refresh: async () => {},
});

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrent = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/workspace");
      if (!res.ok) return;
      const data = await res.json();
      setBusiness(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/businesses");
      if (!res.ok) return;
      const data = await res.json();
      setBusinesses(Array.isArray(data) ? data : []);
    } catch {
      // ignore — endpoint may not exist yet
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchCurrent(), fetchAll()]);
  }, [fetchCurrent, fetchAll]);

  useEffect(() => {
    Promise.all([fetchCurrent(), fetchAll()]).finally(() => setLoading(false));
  }, [fetchCurrent, fetchAll]);

  const switchBusiness = useCallback(async (id: string) => {
    try {
      // Optimistically update local state
      const target = businesses.find(b => b.id === id);
      if (target) setBusiness(target);

      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_business_id: id }),
      });
      if (res.ok) {
        // Full reload to refresh all server-side data
        window.location.href = "/dashboard";
      } else {
        // Revert on failure
        await fetchCurrent();
      }
    } catch {
      await fetchCurrent();
    }
  }, [businesses, fetchCurrent]);

  const deleteBusiness = useCallback(async (id: string) => {
    const res = await fetch(`/api/businesses/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus bisnis");
    // Refresh and redirect
    await Promise.all([fetchCurrent(), fetchAll()]);
    window.location.href = "/dashboard";
  }, [fetchCurrent, fetchAll]);

  return (
    <BusinessContext.Provider value={{ business, businesses, loading, switchBusiness, deleteBusiness, refresh }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
