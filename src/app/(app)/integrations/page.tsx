"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Plug, Database, Globe, Webhook, MoreHorizontal, Pencil, Trash2, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorAlert } from "@/components/common/error-alert";
import { useApiError } from "@/hooks/use-api-error";
import { apiFetch } from "@/lib/api";

const typeIcons: Record<string, any> = { api: Globe, database: Database, webhook: Webhook, plugin: Plug };

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  inactive: "bg-muted/30 text-muted-foreground border-border/30",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createWebhookOpen, setCreateWebhookOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'api', description: '', config: '' });
  const [webhookForm, setWebhookForm] = useState({ url: '', events: '' });
  const { error, handleError, clearError } = useApiError();

  useEffect(() => {
    Promise.all([
      apiFetch('/api/integrations'),
      apiFetch('/api/webhooks'),
    ]).then(([i, w]) => {
      setIntegrations(Array.isArray(i) ? i : []);
      setWebhooks(Array.isArray(w) ? w : []);
    }).catch(handleError).finally(() => setLoading(false));
  }, [handleError]);

  async function createIntegration() {
    let config = {};
    try { config = JSON.parse(form.config || '{}'); } catch { config = {}; }
    try {
      const data = await apiFetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, type: form.type, description: form.description, config, status: 'active' }),
      });
      setIntegrations(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ name: '', type: 'api', description: '', config: '' });
    } catch (err) {
      handleError(err);
    }
  }

  async function createWebhook() {
    const events = webhookForm.events.split(',').map(e => e.trim()).filter(Boolean);
    try {
      const data = await apiFetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookForm.url, events, is_active: true }),
      });
      setWebhooks(prev => [data, ...prev]);
      setCreateWebhookOpen(false);
      setWebhookForm({ url: '', events: '' });
    } catch (err) {
      handleError(err);
    }
  }

  async function deleteIntegration(id: string) {
    try {
      await apiFetch(`/api/integrations/${id}`, { method: 'DELETE' });
      setIntegrations(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      handleError(err);
    }
  }

  async function deleteWebhook(id: string) {
    try {
      await apiFetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      setWebhooks(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      handleError(err);
    }
  }

  const filtered = integrations.filter(i =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" description="Connect your agents to external services">
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Integration</Button>
      </PageHeader>

      {error && <ErrorAlert error={error} onDismiss={clearError} className="mb-4" />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: integrations.length, color: "text-foreground" },
          { label: "Active", value: integrations.filter(i => i.status === "active").length, color: "text-emerald-500" },
          { label: "Inactive", value: integrations.filter(i => i.status === "inactive").length, color: "text-muted-foreground" },
          { label: "Errors", value: integrations.filter(i => i.status === "error").length, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-thin ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-light">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="integrations">
        <TabsList>
          <TabsTrigger value="integrations"><Plug className="mr-2 h-4 w-4" /> Integrations</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="mr-2 h-4 w-4" /> Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Plug} title="No integrations yet" description="Add integrations to connect your agents to external services">
              <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Integration</Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map(i => {
                const Icon = typeIcons[i.type] || Plug;
                return (
                  <Card key={i.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-muted/30 mt-0.5"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                          <div>
                            <p className="text-sm font-semibold">{i.name}</p>
                            <p className="text-xs text-muted-foreground font-light">{i.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={`text-xs capitalize ${statusStyles[i.status] || ''}`}>{i.status}</Badge>
                              <Badge variant="outline" className="text-xs capitalize">{i.type}</Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteIntegration(i.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateWebhookOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Webhook</Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : webhooks.length === 0 ? (
            <EmptyState icon={Webhook} title="No webhooks yet" description="Add webhooks to receive real-time event notifications">
              <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={() => setCreateWebhookOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Webhook</Button>
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {webhooks.map(w => (
                <Card key={w.id} className="border-border/50">
                  <CardContent className="p-4 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate">{w.url}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(w.events || []).map((e: string) => (
                          <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={w.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs" : "text-xs"}>
                          {w.is_active ? 'active' : 'inactive'}
                        </Badge>
                        {w.last_triggered && <span className="text-xs text-muted-foreground">Last: {new Date(w.last_triggered).toLocaleString()}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteWebhook(w.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>Connect an external service to your workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g. Slack Notifications" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="plugin">Plugin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What does this integration do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Config (JSON)</Label>
              <Textarea placeholder='{"endpoint": "api.example.com"}' value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} rows={3} className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={createIntegration} disabled={!form.name}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createWebhookOpen} onOpenChange={setCreateWebhookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>Receive real-time event notifications</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <Input placeholder="https://your-server.com/webhook" value={webhookForm.url} onChange={e => setWebhookForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Events (comma-separated)</Label>
              <Input placeholder="alert.triggered, agent.error, conversation.completed" value={webhookForm.events} onChange={e => setWebhookForm(f => ({ ...f, events: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateWebhookOpen(false)}>Cancel</Button>
            <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={createWebhook} disabled={!webhookForm.url}>Add Webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
