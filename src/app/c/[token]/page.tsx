"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Bot, Send, Loader2, Lock, Mail, PackageCheck, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WidgetPreview, type WidgetAction } from "@/components/widgets/widget-preview";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Widget {
  type: string;
  label?: string;
  props: Record<string, any>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  widgets?: Widget[];
  streaming?: boolean;
}

interface SessionInfo {
  id: string;
  name: string;
  description?: string;
  welcome_message?: string;
  is_public: boolean;
  require_email: boolean;
  allow_multi_user: boolean;
  agents?: { name: string; model_id: string };
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, onWidgetAction }: { message: ChatMessage; onWidgetAction?: (action: WidgetAction) => void }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isWidgetAction = isUser && message.content.startsWith("[Pengguna");

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
          style={{
            background: "hsl(var(--primary) / 0.08)",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary) / 0.15)",
          }}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          {message.content}
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className={`max-w-[78%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed ${isWidgetAction ? "italic opacity-70" : ""}`}
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-4">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "hsl(var(--muted))" }}
      >
        <Bot className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Message content or typing dots */}
        <div
          className="inline-block max-w-full px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed break-words"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          {message.streaming && !message.content ? (
            <TypingDots />
          ) : (
            <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
          )}
          {message.streaming && message.content && (
            <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
          )}
        </div>

        {/* Widgets */}
        {!message.streaming && message.widgets && message.widgets.length > 0 && (
          <div className="space-y-2 w-full max-w-lg">
            {message.widgets.map((widget, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid hsl(var(--border))" }}
              >
                {widget.label && (
                  <div
                    className="px-3 py-1.5 text-xs font-medium"
                    style={{
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--muted-foreground))",
                      borderBottom: "1px solid hsl(var(--border))",
                    }}
                  >
                    {widget.label}
                  </div>
                )}
                <div className="p-3">
                  <WidgetPreview type={widget.type} props={widget.props} onAction={onWidgetAction} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Email Gate ───────────────────────────────────────────────────────────────

function EmailGate({
  sessionName,
  onSubmit,
}: {
  sessionName: string;
  onSubmit: (email: string) => void;
}) {
  const [emailInput, setEmailInput] = useState("");

  function handleSubmit() {
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    onSubmit(trimmed);
  }

  return (
    <div
      className="flex items-center justify-center min-h-dvh p-4"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "hsl(var(--primary) / 0.1)" }}
          >
            <Bot className="h-7 w-7" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            {sessionName}
          </h1>
          <p className="text-sm font-light" style={{ color: "hsl(var(--muted-foreground))" }}>
            Masukkan email kamu untuk mulai chat
          </p>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <input
              type="email"
              placeholder="kamu@email.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: "hsl(var(--input))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!emailInput.trim() || !emailInput.includes("@")}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            Mulai Chat
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Chat UI ─────────────────────────────────────────────────────────────

function ChatUI({
  token,
  session,
  userIdentifier,
  email,
}: {
  token: string;
  session: SessionInfo;
  userIdentifier: string;
  email: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const welcomeMsg: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: session.welcome_message || "",
    widgets: [],
  };

  // Load history or show welcome
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function loadHistory() {
      try {
        // Try localStorage first
        let storedConvId = localStorage.getItem(`chat_conv_${token}`);

        // Fallback: resolve by user_identifier
        if (!storedConvId) {
          const resolveRes = await fetch(`/api/c/${token}/resolve?uid=${encodeURIComponent(userIdentifier)}`);
          if (resolveRes.ok) {
            const resolved = await resolveRes.json();
            if (resolved.conversationId) {
              storedConvId = resolved.conversationId;
              localStorage.setItem(`chat_conv_${token}`, storedConvId!);
            }
          }
        }

        if (storedConvId) {
          const historyRes = await fetch(`/api/c/${token}/messages?conversationId=${storedConvId}`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            if (Array.isArray(historyData) && historyData.length > 0) {
              const restored: ChatMessage[] = historyData.map((m: any) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content || "",
                widgets: m.widgets || [],
              }));
              setConversationId(storedConvId);
              setMessages(session.welcome_message ? [welcomeMsg, ...restored] : restored);
              setHistoryLoading(false);
              return;
            }
          }
          // Stored conv_id is invalid, clear it
          localStorage.removeItem(`chat_conv_${token}`);
        }
      } catch {}

      // No history — show welcome
      if (session.welcome_message) {
        setMessages([welcomeMsg]);
      }
      setHistoryLoading(false);
    }

    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewChat = useCallback(() => {
    localStorage.removeItem(`chat_conv_${token}`);
    setConversationId(null);
    setMessages(session.welcome_message ? [welcomeMsg] : []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, session.welcome_message]);

  // Subscribe to order status broadcast
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on("broadcast", { event: "order_status" }, (payload) => {
        const data = payload.payload as { order_number: string; status: string; message: string };
        if (data?.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: `status-${Date.now()}`,
              role: "system",
              content: data.message,
            },
          ]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Subscribe to automation messages via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${session.id}`)
      .on("broadcast", { event: "automation_message" }, (payload) => {
        const msg = payload.payload as { id: string; role: string; content: string; widgets: any[] };
        if (msg?.content) {
          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              role: "assistant" as const,
              content: msg.content,
              widgets: msg.widgets || [],
            },
          ]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (overrideContent?: string | unknown) => {
    const raw = typeof overrideContent === 'string' ? overrideContent : input;
    const trimmed = raw.trim();
    if (!trimmed || isStreaming) return;

    if (typeof overrideContent !== 'string') setInput("");
    setIsStreaming(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const streamingId = crypto.randomUUID();
    const streamingMsg: ChatMessage = {
      id: streamingId,
      role: "assistant",
      content: "",
      streaming: true,
      widgets: [],
    };

    setMessages((prev) => [...prev, userMsg, streamingMsg]);

    try {
      const res = await fetch(`/api/c/${token}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          conversationId,
          userIdentifier,
          email,
          displayName: email || userIdentifier,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Gagal mengirim pesan");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: any;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (event.delta !== undefined) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingId
                  ? { ...m, content: m.content + event.delta }
                  : m
              )
            );
          } else if (event.done) {
            if (event.conversationId) {
              setConversationId(event.conversationId);
              localStorage.setItem(`chat_conv_${token}`, event.conversationId);
            }
            const finalMsg = event.message;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingId
                  ? {
                      ...m,
                      id: finalMsg?.id || streamingId,
                      content: finalMsg?.content ?? m.content,
                      widgets: finalMsg?.widgets || [],
                      streaming: false,
                    }
                  : m
              )
            );
          } else if (event.error) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingId
                  ? {
                      ...m,
                      content: "Maaf, terjadi kesalahan. Coba lagi ya.",
                      streaming: false,
                    }
                  : m
              )
            );
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? {
                ...m,
                content: "Maaf, koneksi terputus. Silakan coba lagi.",
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, isStreaming, token, conversationId, userIdentifier, email]);

  const handleWidgetAction = useCallback((action: WidgetAction) => {
    if (isStreaming) return;
    const msg = action.type === "button_click"
      ? `[Pengguna mengklik: ${action.label}]`
      : action.type === "select_change"
        ? `[Pengguna memilih: ${action.label} = ${action.value}]`
        : `[Pengguna mengubah toggle: ${action.label} = ${action.value ? "aktif" : "nonaktif"}]`;
    sendMessage(msg);
  }, [isStreaming, sendMessage]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: "hsl(var(--background))" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          borderBottom: "1px solid hsl(var(--border))",
          background: "hsl(var(--card))",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <Bot className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>
            {session.name}
          </p>
          <p className="text-xs font-light" style={{ color: "hsl(var(--muted-foreground))" }}>
            Powered by AI
          </p>
        </div>
        {conversationId && (
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors"
            style={{
              color: "hsl(var(--muted-foreground))",
              border: "1px solid hsl(var(--border))",
            }}
            title="Chat Baru"
          >
            <RotateCcw className="w-3 h-3" />
            Baru
          </button>
        )}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: "hsl(142 76% 36% / 0.1)",
            color: "hsl(142 76% 36%)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Online
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {historyLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
        )}
        {!historyLoading && messages.length === 0 && (
          <div
            className="flex flex-col items-center justify-center h-full gap-3 text-center py-16"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <Bot className="w-10 h-10 opacity-30" />
            <p className="text-sm font-light">Mulai percakapan dengan mengirim pesan</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onWidgetAction={isStreaming ? undefined : handleWidgetAction} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="shrink-0 px-4 py-3"
        style={{
          borderTop: "1px solid hsl(var(--border))",
          background: "hsl(var(--card))",
        }}
      >
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2"
          style={{
            background: "hsl(var(--muted) / 0.5)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm outline-none placeholder:font-light disabled:opacity-50"
            style={{ color: "hsl(var(--foreground))" }}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p
          className="text-center text-xs mt-2 font-light"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          AI dapat membuat kesalahan. Verifikasi informasi penting.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicChatPage() {
  const params = useParams();
  const token = params.token as string;

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [userIdentifier, setUserIdentifier] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Persist user identity across visits
    let uid = localStorage.getItem(`chat_uid_${token}`);
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem(`chat_uid_${token}`, uid);
    }
    setUserIdentifier(uid);

    const storedEmail = localStorage.getItem(`chat_email_${token}`);
    if (storedEmail) setEmail(storedEmail);

    fetch(`/api/c/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setSession(data);
        if (!data.require_email || storedEmail) {
          setReady(true);
        }
      })
      .catch(() => setError("Gagal memuat chat. Periksa koneksi kamu."))
      .finally(() => setLoading(false));
  }, [token]);

  function handleEmailSubmit(submittedEmail: string) {
    localStorage.setItem(`chat_email_${token}`, submittedEmail);
    setEmail(submittedEmail);
    setReady(true);
  }

  // Loading
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-dvh"
        style={{ background: "hsl(var(--background))" }}
      >
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    );
  }

  // Error
  if (error || !session) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-dvh gap-4 text-center p-6"
        style={{ background: "hsl(var(--background))" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(var(--muted))" }}
        >
          <Lock className="h-7 w-7" style={{ color: "hsl(var(--muted-foreground))" }} />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Chat Tidak Tersedia
          </p>
          <p className="text-sm font-light" style={{ color: "hsl(var(--muted-foreground))" }}>
            {error || "Link chat ini tidak valid atau sudah tidak aktif."}
          </p>
        </div>
      </div>
    );
  }

  // Email gate
  if (session.require_email && !ready) {
    return <EmailGate sessionName={session.name} onSubmit={handleEmailSubmit} />;
  }

  // Main chat
  if (!ready || !userIdentifier) {
    return (
      <div
        className="flex items-center justify-center min-h-dvh"
        style={{ background: "hsl(var(--background))" }}
      >
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    );
  }

  return (
    <ChatUI
      token={token}
      session={session}
      userIdentifier={userIdentifier}
      email={email}
    />
  );
}
