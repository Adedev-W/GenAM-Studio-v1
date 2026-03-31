"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Check, Send } from "lucide-react";

const DEMO_CONVERSATION = [
  { role: "user", text: "Hai, ada menu apa aja?" },
  { role: "assistant", text: "Ini dia produk kami! \u{1F447}", widget: true },
  { role: "user", text: "Risol mayo berapa?" },
  { role: "assistant", text: "Risol Mayo harganya Rp5.000/pcs. Beli 10 cuma Rp45.000 \u2014 hemat 10%! Mau pesan berapa?" },
];

export function ChatPreview() {
  const [msgs, setMsgs] = useState<Array<{ role: string; text: string; widget?: boolean }>>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [msgs, typing]);

  useEffect(() => {
    let i = 0;
    const addMsg = () => {
      if (i >= DEMO_CONVERSATION.length) {
        setTimeout(() => { setMsgs([]); i = 0; addMsg(); }, 3000);
        return;
      }
      const msg = DEMO_CONVERSATION[i];
      if (msg.role === "assistant") setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMsgs((prev) => [...prev, msg]);
        i++;
        setTimeout(addMsg, msg.role === "user" ? 800 : 1500);
      }, msg.role === "assistant" ? 1200 : 300);
    };
    const t = setTimeout(addMsg, 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">CS Toko Risol</p>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="p-4 space-y-3 h-[300px] overflow-y-auto">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in`}>
            <div className={`
              max-w-[80%] px-3 py-2 rounded-2xl text-sm
              ${m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
              }
            `}>
              {m.text}
              {m.widget && (
                <div className="mt-2 p-2 rounded-lg bg-background/50 border border-border/50 space-y-1">
                  {["Risol Mayo \u2014 Rp5.000", "Risol Ayam \u2014 Rp6.000", "Risol Keju \u2014 Rp7.000"].map((item) => (
                    <div key={item} className="text-xs py-1 px-2 rounded bg-muted/50 flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start animate-in">
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border/50 flex items-center gap-2">
        <div className="flex-1 px-3 py-2 rounded-full bg-muted text-xs text-muted-foreground">Ketik pesan...</div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Send className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}
