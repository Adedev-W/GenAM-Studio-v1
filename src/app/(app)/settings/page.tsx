"use client";

import { useState, useEffect } from "react";
import { Save, User, Building, Key, Bell, Eye, EyeOff, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";

interface Profile {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, any>;
}

interface ApiKeyStatus {
  openai_configured: boolean;
  openai_key_hint: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Workspace form state
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [defaultModel, setDefaultModel] = useState('gpt-4o');
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [workspaceMsg, setWorkspaceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API Key form state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [removingApiKey, setRemovingApiKey] = useState(false);
  const [apiKeyMsg, setApiKeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, workspaceRes, apiKeyRes] = await Promise.all([
          fetch('/api/settings/profile'),
          fetch('/api/settings/workspace'),
          fetch('/api/settings/api-keys'),
        ]);
        const [p, w, a] = await Promise.all([profileRes.json(), workspaceRes.json(), apiKeyRes.json()]);
        setProfile(p);
        setWorkspace(w);
        setApiKeyStatus(a);
        setDisplayName(p.display_name || '');
        setWorkspaceName(w.name || '');
        setWorkspaceSlug(w.slug || '');
        setDefaultModel(w.settings?.default_model || 'gpt-4o');
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setProfileMsg({ type: 'success', text: 'Profile saved.' });
    } catch (e: any) {
      setProfileMsg({ type: 'error', text: e.message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveWorkspace() {
    setSavingWorkspace(true);
    setWorkspaceMsg(null);
    try {
      const res = await fetch('/api/settings/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName, slug: workspaceSlug, default_model: defaultModel }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setWorkspaceMsg({ type: 'success', text: 'Workspace saved.' });
    } catch (e: any) {
      setWorkspaceMsg({ type: 'error', text: e.message });
    } finally {
      setSavingWorkspace(false);
    }
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
      setApiKeyMsg({ type: 'success', text: 'API key saved and validated.' });
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
      setApiKeyMsg({ type: 'success', text: 'API key removed.' });
    } catch (e: any) {
      setApiKeyMsg({ type: 'error', text: e.message });
    } finally {
      setRemovingApiKey(false);
    }
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.email?.[0] ?? 'U').toUpperCase();

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your workspace and account settings" />
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your workspace and account settings" />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="workspace"><Building className="mr-2 h-4 w-4" /> Workspace</TabsTrigger>
          <TabsTrigger value="api"><Key className="mr-2 h-4 w-4" /> API Keys</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Profile Information</CardTitle>
              <CardDescription className="font-light">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{profile?.display_name || 'No name set'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <Badge variant="outline" className="mt-1 text-xs capitalize">{profile?.role}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Display Name</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Email</Label>
                  <Input value={profile?.email || ''} type="email" disabled className="opacity-60" />
                </div>
              </div>
              {profileMsg && (
                <div className={`flex items-center gap-2 text-sm ${profileMsg.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                  {profileMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {profileMsg.text}
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Security</CardTitle>
              <CardDescription className="font-light">Manage your password via your email provider</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-light">
                Password management is handled by Supabase Auth. Use "Forgot Password" on the login page to reset your password.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspace Tab */}
        <TabsContent value="workspace" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Workspace Settings</CardTitle>
              <CardDescription className="font-light">Configure your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Workspace Name</Label>
                  <Input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Slug</Label>
                  <Input value={workspaceSlug} onChange={e => setWorkspaceSlug(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-sm">Plan</Label>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                    {workspace?.plan || 'free'}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="font-medium text-sm">Default Model</Label>
                <Select value={defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                    <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {workspaceMsg && (
                <div className={`flex items-center gap-2 text-sm ${workspaceMsg.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                  {workspaceMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {workspaceMsg.text}
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={saveWorkspace} disabled={savingWorkspace}>
                  {savingWorkspace ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">OpenAI API Key</CardTitle>
              <CardDescription className="font-light">
                Your OpenAI API key is used for all AI features. It is stored securely and never exposed to the browser.
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
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">active</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={removeApiKey}
                      disabled={removingApiKey}
                    >
                      {removingApiKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-light">
                    No API key configured. Add your OpenAI API key to enable AI features.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label className="font-medium text-sm">
                  {apiKeyStatus?.openai_configured ? 'Update API Key' : 'Add API Key'}
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
                    {apiKeyStatus?.openai_configured ? 'Update' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-light">
                  Your key will be validated against OpenAI before saving. Get your key from{' '}
                  <span className="font-medium">platform.openai.com/api-keys</span>
                </p>
              </div>

              {apiKeyMsg && (
                <div className={`flex items-center gap-2 text-sm ${apiKeyMsg.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                  {apiKeyMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {apiKeyMsg.text}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
              <CardDescription className="font-light">Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Alert notifications", desc: "Get notified when alerts are triggered" },
                { label: "Agent errors", desc: "Get notified when agents encounter errors" },
                { label: "Budget warnings", desc: "Get notified when spending approaches limits" },
                { label: "Team activity", desc: "Get notified about team member actions" },
                { label: "Evaluation results", desc: "Get notified when evaluations complete" },
              ].map(n => (
                <div key={n.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground font-light">{n.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
