"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Search, MoreHorizontal, Trash2, ExternalLink, Copy, Globe, Lock, Users, User, Loader2, CheckCircle, Settings } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorAlert } from "@/components/common/error-alert";
import { useApiError } from "@/hooks/use-api-error";
import { apiFetch } from "@/lib/api";

export default function ChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', agent_id: '', workflow_id: '', welcome_message: 'Hello! How can I help you today?',
    is_public: true, require_email: false, allow_multi_user: false,
  });
  const { error, handleError, clearError } = useApiError();

  useEffect(() => {
    Promise.all([
      apiFetch('/api/chat-sessions'),
      apiFetch('/api/agents'),
    ]).then(([s, a]) => {
      setSessions(Array.isArray(s) ? s : []);
      setAgents(Array.isArray(a) ? a : []);
    }).catch(handleError).finally(() => setLoading(false));
  }, [handleError]);

  async function createSession() {
    try {
      const data = await apiFetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agent_id: form.agent_id || null }),
      });
      setSessions(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ name: '', description: '', agent_id: '', workflow_id: '', welcome_message: 'Hello! How can I help you today?', is_public: true, require_email: false, allow_multi_user: false });
    } catch (err) {
      handleError(err);
    }
  }

  async function deleteSession() {
    if (!deleteId) return;
    try {
      await apiFetch(`/api/chat-sessions/${deleteId}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      handleError(err);
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/c/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = sessions.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Chat Sessions" description="Create shareable AI chat links for your agents">
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Session</Button>
      </PageHeader>

      {error && <ErrorAlert error={error} onDismiss={clearError} className="mb-4" />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: sessions.length },
          { label: "Active", value: sessions.filter(s => s.is_active).length },
          { label: "Public", value: sessions.filter(s => s.is_public).length },
          { label: "Messages", value: sessions.reduce((sum: number, s: any) => sum + (s.message_count || 0), 0) },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-thin">{s.value}</p>
              <p className="text-xs text-muted-foreground font-light">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search sessions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No chat sessions yet" description="Create a chat session to share your agent with others">
          <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Session</Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="border-border/50 hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10"><MessageSquare className="h-4 w-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{s.name}</p>
                      {s.agents?.name && <p className="text-xs text-muted-foreground font-light">{s.agents.name}</p>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link href={`/chat/${s.id}`}><Settings className="mr-2 h-3.5 w-3.5" /> Manage</Link></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <Badge variant="outline" className={`text-xs ${s.is_public ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted/30 text-muted-foreground'}`}>
                    {s.is_public ? <><Globe className="mr-1 h-2.5 w-2.5" />Public</> : <><Lock className="mr-1 h-2.5 w-2.5" />Private</>}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {s.allow_multi_user ? <><Users className="mr-1 h-2.5 w-2.5" />Multi</> : <><User className="mr-1 h-2.5 w-2.5" />Single</>}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{s.message_count || 0} msgs</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => copyLink(s.share_token)}>
                    {copied === s.share_token ? <CheckCircle className="mr-1.5 h-3 w-3 text-emerald-500" /> : <Copy className="mr-1.5 h-3 w-3" />}
                    {copied === s.share_token ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" asChild>
                    <Link href={`/chat/${s.id}`}><ExternalLink className="mr-1.5 h-3 w-3" /> Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Chat Session</DialogTitle>
            <DialogDescription>Create a shareable chat link for an agent</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g. Customer Support Chat" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Agent</Label>
              <Select value={form.agent_id} onValueChange={v => setForm(f => ({ ...f, agent_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No agent</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <Input value={form.welcome_message} onChange={e => setForm(f => ({ ...f, welcome_message: e.target.value }))} />
            </div>
            <div className="space-y-3 rounded-lg border border-border/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access Settings</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Public Access</p>
                  <p className="text-xs text-muted-foreground font-light">Anyone with the link can chat</p>
                </div>
                <Switch checked={form.is_public} onCheckedChange={v => setForm(f => ({ ...f, is_public: v }))} />
              </div>
              {!form.is_public && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Require Email</p>
                    <p className="text-xs text-muted-foreground font-light">Visitors must enter email to chat</p>
                  </div>
                  <Switch checked={form.require_email} onCheckedChange={v => setForm(f => ({ ...f, require_email: v }))} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Multi-User Session</p>
                  <p className="text-xs text-muted-foreground font-light">All visitors share one conversation thread</p>
                </div>
                <Switch checked={form.allow_multi_user} onCheckedChange={v => setForm(f => ({ ...f, allow_multi_user: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={createSession} disabled={!form.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}
        title="Delete Session" description="This will delete the chat session and all its messages. This cannot be undone."
        confirmLabel="Delete" variant="destructive" onConfirm={deleteSession} />
    </div>
  );
}
