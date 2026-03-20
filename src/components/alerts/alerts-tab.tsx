"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, AlertOctagon, CheckCircle2, Eye, Filter, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";

interface Alert {
  id: string;
  rule_name: string;
  message: string;
  agent_id: string | null;
  agents?: { name: string };
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "acknowledged" | "resolved";
  triggered_at: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

const statusStyles: Record<string, string> = {
  active: "bg-red-500/10 text-red-500 border-red-500/20",
  acknowledged: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export function AlertsTab() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(data => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: status as Alert["status"] } : a));
  }

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.status === filter || a.severity === filter);

  const counts = {
    active: alerts.filter(a => a.status === "active").length,
    critical: alerts.filter(a => a.severity === "critical").length,
    acknowledged: alerts.filter(a => a.status === "acknowledged").length,
    resolved: alerts.filter(a => a.status === "resolved").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {[
            { label: "Aktif", value: counts.active, icon: Bell, color: "text-red-500", bg: "bg-red-500/10" },
            { label: "Kritis", value: counts.critical, icon: AlertOctagon, color: "text-orange-500", bg: "bg-orange-500/10" },
            { label: "Diakui", value: counts.acknowledged, icon: Eye, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Selesai", value: counts.resolved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-light">{s.label}</p>
                  <p className="text-xl font-thin">{s.value}</p>
                </div>
                <div className={`p-1.5 rounded-lg ${s.bg}`}><s.icon className={`h-3.5 w-3.5 ${s.color}`} /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px] h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua alert</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="acknowledged">Diakui</SelectItem>
                <SelectItem value="resolved">Selesai</SelectItem>
                <SelectItem value="critical">Kritis</SelectItem>
                <SelectItem value="high">Tinggi</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" asChild>
              <Link href="/alerts/rules"><Filter className="mr-2 h-3.5 w-3.5" /> Alert Rules</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Bell} title="Tidak ada alert" description="Belum ada alert yang cocok dengan filter" />
          ) : (
            <div className="space-y-2">
              {filtered.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors">
                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${severityColors[alert.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{alert.rule_name}</p>
                      <Badge variant="outline" className={`text-xs ${statusStyles[alert.status]}`}>{alert.status}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{alert.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-light mt-0.5">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {alert.agents?.name && <span>Agent: {alert.agents.name}</span>}
                      <span>{new Date(alert.triggered_at).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {alert.status === "active" && (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateStatus(alert.id, "acknowledged")}>
                        <Eye className="mr-1 h-3 w-3" /> Ack
                      </Button>
                    )}
                    {alert.status !== "resolved" && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-emerald-500" onClick={() => updateStatus(alert.id, "resolved")}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
