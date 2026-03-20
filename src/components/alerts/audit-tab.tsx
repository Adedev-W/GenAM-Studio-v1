"use client";

import { useState, useEffect } from "react";
import {
  Search, Download, FileClock, Loader2, Sparkles, Calendar, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/common/empty-state";
import { useToast } from "@/hooks/use-toast";

interface AuditEntry {
  id: string;
  created_at: string;
  actor_id: string;
  profiles?: { display_name: string | null; avatar_url: string | null };
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, any>;
  ip_address: string | null;
}

interface AuditReport {
  id: string;
  report_type: string;
  date_from: string;
  date_to: string;
  summary: string | null;
  details: Record<string, any>;
  created_at: string;
}

const actionColors: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  update: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delete: "bg-red-500/10 text-red-500 border-red-500/20",
  login: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  logout: "bg-muted/30 text-muted-foreground border-border/30",
};

function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function AuditTab() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Report generation
  const [generating, setGenerating] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    Promise.all([
      fetch('/api/audit?limit=100').then(r => r.json()),
      fetch('/api/audit/report?limit=10').then(r => r.json()),
    ]).then(([logs, reps]) => {
      setEntries(Array.isArray(logs) ? logs : []);
      setReports(Array.isArray(reps) ? reps : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => {
    const matchesSearch = !search ||
      e.resource_type?.toLowerCase().includes(search.toLowerCase()) ||
      e.action?.toLowerCase().includes(search.toLowerCase()) ||
      e.profiles?.display_name?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || e.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      const res = await fetch('/api/audit/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_from: new Date(dateFrom).toISOString(),
          date_to: new Date(dateTo + 'T23:59:59').toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal generate report');
      }
      const report = await res.json();
      setReports(prev => [report, ...prev]);
      toast({ title: "Laporan audit berhasil dibuat!" });
    } catch (err: any) {
      toast({ title: "Gagal generate", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Reports section */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Laporan Audit
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Generate Laporan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Laporan Audit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dari</Label>
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sampai</Label>
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI akan menganalisis log aktivitas dan penggunaan token dalam rentang ini, lalu membuat ringkasan laporan audit.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Batal</Button>
                </DialogClose>
                <Button size="sm" onClick={handleGenerateReport} disabled={generating}>
                  {generating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                  {generating ? "Menganalisis..." : "Generate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada laporan. Klik &quot;Generate Laporan&quot; untuk membuat.</p>
          ) : (
            <div className="space-y-2">
              {reports.map(report => (
                <div key={report.id} className="rounded-lg border border-border/30 p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20">
                          <Calendar className="h-2.5 w-2.5 mr-0.5" />
                          {fmtDate(report.date_from)} — {fmtDate(report.date_to)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{fmtDate(report.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {report.summary || "Ringkasan tidak tersedia"}
                      </p>
                      {report.details && (
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          {report.details.total_logs !== undefined && <span>{report.details.total_logs} log</span>}
                          {report.details.total_tokens !== undefined && <span>{report.details.total_tokens.toLocaleString()} token</span>}
                          {report.details.total_cost_usd !== undefined && <span>${report.details.total_cost_usd}</span>}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-7 text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      onClick={() => window.open(`/api/audit/report/${report.id}/download`, '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" /> CSV
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit log table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileClock className="h-4 w-4 text-muted-foreground" />
            Log Aktivitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari aktor, aksi, atau resource..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua aksi</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={FileClock} title="Tidak ada log" description="Aktivitas akan tercatat di sini saat user berinteraksi dengan sistem" />
          ) : (
            <div className="space-y-1.5">
              {filtered.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px]">{getInitials(entry.profiles?.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{entry.profiles?.display_name || 'Unknown'}</span>
                      <Badge variant="outline" className={`text-[10px] capitalize ${actionColors[entry.action] || 'bg-muted/30 text-muted-foreground'}`}>
                        {entry.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.resource_type}
                      {entry.metadata?.description && ` — ${entry.metadata.description}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString("id-ID")}</p>
                    {entry.ip_address && <p className="text-[10px] font-mono text-muted-foreground">{entry.ip_address}</p>}
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
