"use client";

import { useState, useEffect } from "react";
import { Pencil, Save, X, Building, Key, Store, Eye, EyeOff, Trash2, CheckCircle, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/page-header";
import { useBusiness } from "@/contexts/business-context";
import { cn } from "@/lib/utils";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, any>;
  business_type: string | null;
  target_market: string | null;
  channels: string[] | null;
  tone: string | null;
}

interface ApiKeyStatus {
  openai_configured: boolean;
  openai_key_hint: string | null;
}

type EditSection = 'info' | 'model' | 'profile' | 'channels' | 'tone' | null;

export default function SettingsPage() {
  const { business, businesses, deleteBusiness } = useBusiness();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode state
  const [editingSection, setEditingSection] = useState<EditSection>(null);

  // General form state
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [defaultModel, setDefaultModel] = useState('gpt-4o');
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalMsg, setGeneralMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Business profile form state
  const [businessType, setBusinessType] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [tone, setTone] = useState('');
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessMsg, setBusinessMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API Key form state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [removingApiKey, setRemovingApiKey] = useState(false);
  const [apiKeyMsg, setApiKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete business state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Snapshot for cancel
  const [snapshot, setSnapshot] = useState<{
    workspaceName: string;
    workspaceSlug: string;
    defaultModel: string;
    businessType: string;
    targetMarket: string;
    channels: string[];
    tone: string;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [workspaceRes, apiKeyRes] = await Promise.all([
          fetch('/api/settings/workspace'),
          fetch('/api/settings/api-keys'),
        ]);
        const [w, a] = await Promise.all([workspaceRes.json(), apiKeyRes.json()]);
        setWorkspace(w);
        setApiKeyStatus(a);
        setWorkspaceName(w.name || '');
        setWorkspaceSlug(w.slug || '');
        setDefaultModel(w.settings?.default_model || 'gpt-4o');
        setBusinessType(w.business_type || '');
        setTargetMarket(w.target_market || '');
        setChannels(w.channels || []);
        setTone(w.tone || '');
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function startEdit(section: EditSection) {
    setSnapshot({ workspaceName, workspaceSlug, defaultModel, businessType, targetMarket, channels, tone });
    setEditingSection(section);
    setGeneralMsg(null);
    setBusinessMsg(null);
  }

  function cancelEdit() {
    if (snapshot) {
      setWorkspaceName(snapshot.workspaceName);
      setWorkspaceSlug(snapshot.workspaceSlug);
      setDefaultModel(snapshot.defaultModel);
      setBusinessType(snapshot.businessType);
      setTargetMarket(snapshot.targetMarket);
      setChannels(snapshot.channels);
      setTone(snapshot.tone);
    }
    setEditingSection(null);
    setGeneralMsg(null);
    setBusinessMsg(null);
  }

  async function saveInfo() {
    setSavingGeneral(true);
    setGeneralMsg(null);
    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName, slug: workspaceSlug }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setGeneralMsg({ type: 'success', text: 'Informasi bisnis tersimpan.' });
      setEditingSection(null);
    } catch (e: any) {
      setGeneralMsg({ type: 'error', text: e.message });
    } finally {
      setSavingGeneral(false);
    }
  }

  async function saveModel() {
    setSavingGeneral(true);
    setGeneralMsg(null);
    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_model: defaultModel }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setGeneralMsg({ type: 'success', text: 'Model AI tersimpan.' });
      setEditingSection(null);
    } catch (e: any) {
      setGeneralMsg({ type: 'error', text: e.message });
    } finally {
      setSavingGeneral(false);
    }
  }

  async function saveProfile() {
    setSavingBusiness(true);
    setBusinessMsg(null);
    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_type: businessType, target_market: targetMarket }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setBusinessMsg({ type: 'success', text: 'Profil bisnis tersimpan.' });
      setEditingSection(null);
    } catch (e: any) {
      setBusinessMsg({ type: 'error', text: e.message });
    } finally {
      setSavingBusiness(false);
    }
  }

  async function saveChannels() {
    setSavingBusiness(true);
    setBusinessMsg(null);
    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setBusinessMsg({ type: 'success', text: 'Channel penjualan tersimpan.' });
      setEditingSection(null);
    } catch (e: any) {
      setBusinessMsg({ type: 'error', text: e.message });
    } finally {
      setSavingBusiness(false);
    }
  }

  async function saveTone() {
    setSavingBusiness(true);
    setBusinessMsg(null);
    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setBusinessMsg({ type: 'success', text: 'Gaya komunikasi tersimpan.' });
      setEditingSection(null);
    } catch (e: any) {
      setBusinessMsg({ type: 'error', text: e.message });
    } finally {
      setSavingBusiness(false);
    }
  }

  const CHANNEL_OPTIONS = ['Website', 'WhatsApp', 'Instagram', 'Shopee', 'Tokopedia', 'TikTok Shop', 'Lazada', 'Offline'];

  function toggleChannel(ch: string) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }

  async function saveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSavingApiKey(true);
    setApiKeyMsg(null);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openai_api_key: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApiKeyStatus({ openai_configured: true, openai_key_hint: data.hint });
      setApiKeyInput('');
      setApiKeyMsg({ type: 'success', text: 'API key tersimpan dan tervalidasi.' });
    } catch (e: any) {
      setApiKeyMsg({ type: 'error', text: e.message });
    } finally {
      setSavingApiKey(false);
    }
  }

  async function removeApiKey() {
    setRemovingApiKey(true);
    setApiKeyMsg(null);
    try {
      const res = await fetch('/api/settings/api-keys', { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setApiKeyStatus({ openai_configured: false, openai_key_hint: null });
      setApiKeyMsg({ type: 'success', text: 'API key dihapus.' });
    } catch (e: any) {
      setApiKeyMsg({ type: 'error', text: e.message });
    } finally {
      setRemovingApiKey(false);
    }
  }

  async function handleDeleteBusiness() {
    if (!workspace) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBusiness(workspace.id);
    } catch (e: any) {
      setDeleteError(e.message);
      setDeleting(false);
    }
  }

  const isOnlyBusiness = businesses.length <= 1;

  function StatusMessage({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
    if (!msg) return null;
    return (
      <div className={`flex items-center gap-2 text-sm ${msg.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
        {msg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        {msg.text}
      </div>
    );
  }

  function EditButton({ section }: { section: EditSection }) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={() => startEdit(section)}>
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
    );
  }

  function SaveCancelFooter({ onSave, saving }: { onSave: () => void; saving: boolean }) {
    return (
      <CardFooter className="flex justify-end gap-2 pt-0">
        <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Batal
        </Button>
        <Button variant="ghost" size="sm" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          Simpan
        </Button>
      </CardFooter>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pengaturan Bisnis" description="Kelola konfigurasi bisnis aktif" />
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan Bisnis" description="Kelola konfigurasi bisnis aktif" />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general"><Building className="mr-2 h-4 w-4" /> Umum</TabsTrigger>
          <TabsTrigger value="business"><Store className="mr-2 h-4 w-4" /> Profil Bisnis</TabsTrigger>
          <TabsTrigger value="api"><Key className="mr-2 h-4 w-4" /> API Key</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          {/* Informasi Bisnis Card */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Informasi Bisnis</CardTitle>
                <CardDescription className="font-light">Nama dan slug bisnis Anda</CardDescription>
              </div>
              {editingSection !== 'info' && <EditButton section="info" />}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-sm text-muted-foreground">Nama Bisnis</Label>
                  {editingSection === 'info' ? (
                    <Input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
                  ) : (
                    <p className="text-sm font-medium py-2">{workspaceName || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm text-muted-foreground">Slug</Label>
                  {editingSection === 'info' ? (
                    <Input value={workspaceSlug} onChange={e => setWorkspaceSlug(e.target.value)} />
                  ) : (
                    <p className="text-sm font-medium py-2">{workspaceSlug || '-'}</p>
                  )}
                </div>
              </div>
              <StatusMessage msg={editingSection === 'info' ? generalMsg : null} />
            </CardContent>
            {editingSection === 'info' && <SaveCancelFooter onSave={saveInfo} saving={savingGeneral} />}
          </Card>

          {/* Paket Langganan Card */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Paket Langganan</CardTitle>
              <CardDescription className="font-light">Paket aktif bisnis Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                {workspace?.plan || 'free'}
              </Badge>
            </CardContent>
          </Card>

          {/* Model AI Card */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Default Model AI</CardTitle>
                <CardDescription className="font-light">Model yang digunakan oleh agent Anda</CardDescription>
              </div>
              {editingSection !== 'model' && <EditButton section="model" />}
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSection === 'model' ? (
                <Select value={defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                    <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium py-2">
                  {{ 'gpt-4o': 'GPT-4o', 'gpt-4o-mini': 'GPT-4o Mini', 'gpt-4.1': 'GPT-4.1', 'gpt-4.1-mini': 'GPT-4.1 Mini' }[defaultModel] || defaultModel}
                </p>
              )}
              <StatusMessage msg={editingSection === 'model' ? generalMsg : null} />
            </CardContent>
            {editingSection === 'model' && <SaveCancelFooter onSave={saveModel} saving={savingGeneral} />}
          </Card>

          {/* General status messages (for non-edit saves) */}
          {editingSection !== 'info' && editingSection !== 'model' && <StatusMessage msg={generalMsg} />}

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-destructive">Zona Bahaya</CardTitle>
              <CardDescription className="font-light">Tindakan ini bersifat permanen dan tidak dapat dibatalkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <div>
                  <p className="text-sm font-medium">Hapus Bisnis</p>
                  <p className="text-xs text-muted-foreground">Semua data bisnis ini akan dihapus secara permanen.</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setShowDeleteDialog(true); setDeleteConfirmName(''); setDeleteError(null); }}
                  disabled={isOnlyBusiness}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Hapus Bisnis
                </Button>
              </div>
              {isOnlyBusiness && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tidak bisa menghapus bisnis terakhir Anda. Buat bisnis baru terlebih dahulu.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Profile Tab */}
        <TabsContent value="business" className="space-y-4">
          {/* Profil Bisnis Card */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Profil Bisnis</CardTitle>
                <CardDescription className="font-light">Informasi ini digunakan saat men-generate AI agent</CardDescription>
              </div>
              {editingSection !== 'profile' && <EditButton section="profile" />}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-sm text-muted-foreground">Jenis Bisnis</Label>
                  {editingSection === 'profile' ? (
                    <Input value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="Contoh: Toko Batik, Restoran, Jasa Laundry" />
                  ) : (
                    <p className="text-sm font-medium py-2">{businessType || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm text-muted-foreground">Target Pelanggan</Label>
                  {editingSection === 'profile' ? (
                    <Input value={targetMarket} onChange={e => setTargetMarket(e.target.value)} placeholder="Contoh: Ibu rumah tangga, Anak muda 18-30" />
                  ) : (
                    <p className="text-sm font-medium py-2">{targetMarket || '-'}</p>
                  )}
                </div>
              </div>
              <StatusMessage msg={editingSection === 'profile' ? businessMsg : null} />
            </CardContent>
            {editingSection === 'profile' && <SaveCancelFooter onSave={saveProfile} saving={savingBusiness} />}
          </Card>

          {/* Channel Penjualan Card */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Channel Penjualan</CardTitle>
                <CardDescription className="font-light">Platform dimana Anda menjual produk</CardDescription>
              </div>
              {editingSection !== 'channels' && <EditButton section="channels" />}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {editingSection === 'channels' ? (
                  CHANNEL_OPTIONS.map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        channels.includes(ch)
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted/30 text-muted-foreground border-border/50 hover:border-border"
                      )}
                    >
                      {ch}
                    </button>
                  ))
                ) : (
                  channels.length > 0 ? (
                    channels.map(ch => (
                      <Badge key={ch} variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {ch}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada channel dipilih</p>
                  )
                )}
              </div>
              <StatusMessage msg={editingSection === 'channels' ? businessMsg : null} />
            </CardContent>
            {editingSection === 'channels' && <SaveCancelFooter onSave={saveChannels} saving={savingBusiness} />}
          </Card>

          {/* Gaya Komunikasi Card */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Gaya Komunikasi</CardTitle>
                <CardDescription className="font-light">Tone yang digunakan agent saat berkomunikasi</CardDescription>
              </div>
              {editingSection !== 'tone' && <EditButton section="tone" />}
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSection === 'tone' ? (
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="w-[280px]"><SelectValue placeholder="Pilih gaya komunikasi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Profesional & Formal">Profesional & Formal</SelectItem>
                    <SelectItem value="Santai & Akrab">Santai & Akrab</SelectItem>
                    <SelectItem value="Semangat & Energik">Semangat & Energik</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium py-2">{tone || '-'}</p>
              )}
              <StatusMessage msg={editingSection === 'tone' ? businessMsg : null} />
            </CardContent>
            {editingSection === 'tone' && <SaveCancelFooter onSave={saveTone} saving={savingBusiness} />}
          </Card>

          {/* Business status messages (for non-edit saves) */}
          {!['profile', 'channels', 'tone'].includes(editingSection || '') && <StatusMessage msg={businessMsg} />}
        </TabsContent>

        {/* API Key Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">OpenAI API Key</CardTitle>
              <CardDescription className="font-light">
                API key digunakan untuk semua fitur AI. Disimpan secara aman dan tidak pernah diekspos ke browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeyStatus?.openai_configured ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div>
                    <p className="text-sm font-medium">OpenAI API Key</p>
                    <p className="text-xs text-muted-foreground font-mono">{apiKeyStatus.openai_key_hint}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">aktif</Badge>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={removeApiKey} disabled={removingApiKey}>
                      {removingApiKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-light">
                    Belum ada API key. Tambahkan OpenAI API key untuk mengaktifkan fitur AI.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label className="font-medium text-sm">
                  {apiKeyStatus?.openai_configured ? 'Perbarui API Key' : 'Tambah API Key'}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={saveApiKey} disabled={savingApiKey || !apiKeyInput.trim()}>
                    {savingApiKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                    {apiKeyStatus?.openai_configured ? 'Perbarui' : 'Simpan'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-light">
                  Key akan divalidasi ke OpenAI sebelum disimpan. Dapatkan key dari{' '}
                  <span className="font-medium">platform.openai.com/api-keys</span>
                </p>
              </div>

              <StatusMessage msg={apiKeyMsg} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Business Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Hapus Bisnis
            </DialogTitle>
            <DialogDescription>
              Tindakan ini bersifat permanen. Semua data bisnis termasuk agent, produk, dan pengaturan akan dihapus dan tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm">
                Ketik <span className="font-semibold">{workspaceName}</span> untuk mengkonfirmasi penghapusan.
              </p>
            </div>
            <Input
              placeholder="Ketik nama bisnis..."
              value={deleteConfirmName}
              onChange={e => setDeleteConfirmName(e.target.value)}
            />
            {deleteError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {deleteError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBusiness}
              disabled={deleteConfirmName !== workspaceName || deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Ya, Hapus Bisnis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
