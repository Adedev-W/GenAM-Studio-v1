"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Settings2, Globe, Lock, Users, User,
  Copy, CheckCircle, Loader2, ExternalLink, Save, Bot, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { WidgetPreview, type WidgetAction } from "@/components/widgets/widget-preview";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  widgets?: any[];
  streaming?: boolean;
}

function ChatPreview({ sessionId, welcomeMessage }: { sessionId: string; welcomeMessage?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (welcomeMessage) {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, [welcomeMessage]);

  // Subscribe to automation messages via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on('broadcast', { event: 'automation_message' }, (payload) => {
        const msg = payload.payload as { id: string; role: string; content: string; widgets: any[] };
        if (msg?.content) {
          setMessages(prev => [...prev, {
            id: msg.id,
            role: 'assistant',
            content: msg.content,
            widgets: msg.widgets || [],
          }]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(overrideContent?: string | unknown) {
    const raw = typeof overrideContent === 'string' ? overrideContent : input;
    const text = raw.trim();
    if (!text || sending) return;
    if (typeof overrideContent !== 'string') setInput('');
    setSending(true);

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, conversationId }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: `Error: ${err.error || 'Failed to send'}` };
          return next;
        });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.delta) {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = { ...last, content: last.content + parsed.delta, streaming: true };
                return next;
              });
            } else if (parsed.done) {
              if (parsed.conversationId) setConversationId(parsed.conversationId);
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  id: parsed.message?.id,
                  role: 'assistant',
                  content: parsed.message?.content || next[next.length - 1].content,
                  widgets: parsed.message?.widgets || [],
                  streaming: false,
                };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: `Error: ${err.message}` };
        return next;
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleWidgetAction(action: WidgetAction) {
    if (sending) return;
    const msg = action.type === "button_click"
      ? `[Pengguna mengklik: ${action.label}]`
      : action.type === "select_change"
        ? `[Pengguna memilih: ${action.label} = ${action.value}]`
        : `[Pengguna mengubah toggle: ${action.label} = ${action.value ? "aktif" : "nonaktif"}]`;
    sendMessage(msg);
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border/50 overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 shrink-0">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold">Preview Chat</p>
          <p className="text-xs text-muted-foreground/60">Test agent langsung di sini</p>
        </div>
        <button
          onClick={() => {
            setMessages(welcomeMessage ? [{ role: 'assistant', content: welcomeMessage }] : []);
            setConversationId(null);
          }}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground text-center">Kirim pesan untuk mulai test agent</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3 w-3 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted/50 text-foreground rounded-bl-sm'
                }`}
              >
                {msg.content || (msg.streaming ? (
                  <span className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                  </span>
                ) : '')}
                {msg.streaming && msg.content && <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse" />}
              </div>
              {!msg.streaming && msg.widgets && msg.widgets.length > 0 && (
                <div className="w-full space-y-2">
                  {msg.widgets.map((w, wi) => (
                    <WidgetPreview key={wi} type={w.type} props={w.props} onAction={sending ? undefined : handleWidgetAction} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Kirim pesan..."
            disabled={sending}
            className="text-sm h-9"
          />
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={sendMessage} disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/chat-sessions/${sessionId}`).then(r => r.json()),
      fetch('/api/agents').then(r => r.json()),
    ]).then(([s, a]) => {
      if (!s.error) {
        setSession(s);
        setSettings({
          name: s.name,
          description: s.description || '',
          welcome_message: s.welcome_message || '',
          agent_id: s.agent_id || '',
          is_public: s.is_public,
          require_email: s.require_email,
          allow_multi_user: s.allow_multi_user,
        });
      }
      setAgents(Array.isArray(a) ? a : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sessionId]);

  async function saveSettings() {
    setSavingSettings(true);
    const res = await fetch(`/api/chat-sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const data = await res.json();
      setSession(data);
      setSavedSettings(true);
      setPreviewKey(k => k + 1);
      setTimeout(() => setSavedSettings(false), 2000);
    }
    setSavingSettings(false);
  }

  function copyLink() {
    if (!session?.share_token) return;
    navigator.clipboard.writeText(`${window.location.origin}/c/${session.share_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${session?.share_token}`;
  const selectedAgent = agents.find(a => a.id === (settings.agent_id || session?.agent_id));

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/50 mb-4 shrink-0">
        <Link href="/chat">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{session?.name || 'Chat Session'}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {session?.is_public
              ? <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20 h-4 px-1.5"><Globe className="mr-1 h-2.5 w-2.5" />Public</Badge>
              : <Badge variant="outline" className="text-xs h-4 px-1.5"><Lock className="mr-1 h-2.5 w-2.5" />Private</Badge>}
            {session?.allow_multi_user
              ? <Badge variant="outline" className="text-xs h-4 px-1.5"><Users className="mr-1 h-2.5 w-2.5" />Multi-user</Badge>
              : <Badge variant="outline" className="text-xs h-4 px-1.5"><User className="mr-1 h-2.5 w-2.5" />Single-user</Badge>}
            {selectedAgent && (
              <Badge variant="outline" className="text-xs h-4 px-1.5 bg-primary/5 border-primary/20 text-primary">
                <Bot className="mr-1 h-2.5 w-2.5" />{selectedAgent.name}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8" onClick={copyLink}>
          {copied ? <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Share Link'}
        </Button>
        <Button variant="outline" size="sm" className="h-8" asChild>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Preview
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden min-h-0">
        {/* Custom chat preview */}
        <div className="col-span-8 overflow-hidden">
          {session?.agent_id ? (
            <ChatPreview
              key={previewKey}
              sessionId={sessionId}
              welcomeMessage={session?.welcome_message}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8 rounded-xl border border-border/50">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                <Bot className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Pilih Agent terlebih dahulu</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Pilih agent di panel kanan untuk mengaktifkan preview chat. Agent menentukan kepribadian dan kemampuan AI.
              </p>
            </div>
          )}
        </div>

        {/* Settings panel */}
        <div className="col-span-4 overflow-y-auto space-y-4">
          <Card className="border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5" /> Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nama Session</Label>
                <Input value={settings.name || ''} onChange={e => setSettings((s: any) => ({ ...s, name: e.target.value }))} className="h-8 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Pesan Sambutan</Label>
                <Textarea
                  value={settings.welcome_message || ''}
                  onChange={e => setSettings((s: any) => ({ ...s, welcome_message: e.target.value }))}
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Agent <span className="text-red-500">*</span></Label>
                <Select value={settings.agent_id || 'none'} onValueChange={v => setSettings((s: any) => ({ ...s, agent_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pilih agent..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih agent...</SelectItem>
                    {agents.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {agents.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    <Link href="/agents" className="text-primary hover:underline">Buat agent</Link> terlebih dahulu
                  </p>
                )}
              </div>

              <Separator />

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akses</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Public</p>
                    <p className="text-xs text-muted-foreground/70">Siapa saja dengan link</p>
                  </div>
                  <Switch checked={!!settings.is_public} onCheckedChange={v => setSettings((s: any) => ({ ...s, is_public: v }))} />
                </div>
                {settings.is_public && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">Wajib Email</p>
                      <p className="text-xs text-muted-foreground/70">Input email sebelum chat</p>
                    </div>
                    <Switch checked={!!settings.require_email} onCheckedChange={v => setSettings((s: any) => ({ ...s, require_email: v }))} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Multi-User</p>
                    <p className="text-xs text-muted-foreground/70">Thread bersama</p>
                  </div>
                  <Switch checked={!!settings.allow_multi_user} onCheckedChange={v => setSettings((s: any) => ({ ...s, allow_multi_user: v }))} />
                </div>
              </div>

              <Button variant="ghost" size="sm" className="w-full h-8 bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : savedSettings ? <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                {savedSettings ? 'Tersimpan!' : 'Simpan Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Share link */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Share Link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted/30 rounded px-2 py-1.5 truncate text-muted-foreground">{shareUrl}</code>
                <Button size="icon" variant="outline" className="h-7 w-7 shrink-0" onClick={copyLink}>
                  {copied ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
