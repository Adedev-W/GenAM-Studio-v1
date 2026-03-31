"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ApiKeyBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't re-check if user already dismissed in this session
    if (sessionStorage.getItem("api-key-banner-dismissed")) return;

    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((data) => {
        if (!data.openai_configured) setShow(true);
      })
      .catch(() => {});
  }, []);

  if (!show || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("api-key-banner-dismissed", "1");
  }

  return (
    <div className="relative flex items-center gap-3 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 shrink-0">
        <KeyRound className="h-4 w-4" />
        <span className="font-medium">API Key belum dikonfigurasi</span>
      </div>
      <span className="text-amber-600/80 dark:text-amber-400/80 text-xs hidden sm:inline">
        Fitur AI (chat, generate agent, canvas) memerlukan OpenAI API key untuk berfungsi.
      </span>
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
          asChild
        >
          <a
            href="https://platform.openai.com/settings/organization/billing/overview"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-1.5 h-3 w-3" />
            Top Up OpenAI
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
          asChild
        >
          <Link href="/settings">
            <KeyRound className="mr-1.5 h-3 w-3" />
            Atur API Key
          </Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-sm text-amber-600/60 hover:text-amber-600 dark:text-amber-400/60 dark:hover:text-amber-400 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
