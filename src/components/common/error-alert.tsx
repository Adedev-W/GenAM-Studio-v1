"use client";

import Link from "next/link";
import {
  KeyRound,
  LogIn,
  ShieldAlert,
  WifiOff,
  AlertTriangle,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppError, ErrorCode } from "@/lib/errors";

const iconMap: Record<ErrorCode, typeof AlertCircle> = {
  API_KEY_NOT_CONFIGURED: KeyRound,
  UNAUTHORIZED: LogIn,
  FORBIDDEN: ShieldAlert,
  NETWORK_ERROR: WifiOff,
  SERVER_ERROR: AlertTriangle,
  SERVICE_UNAVAILABLE: AlertTriangle,
  NOT_FOUND: AlertCircle,
  VALIDATION_ERROR: AlertCircle,
  UNKNOWN: AlertCircle,
};

interface ErrorAlertProps {
  error: AppError;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({ error, onDismiss, className }: ErrorAlertProps) {
  const Icon = iconMap[error.code] || AlertCircle;
  const variant = error.code === "SERVICE_UNAVAILABLE" ? "warning" : "destructive";

  return (
    <Alert variant={variant as any} className={cn("relative", className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{error.title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <span>{error.message}</span>
        {(error.action || error.code === "API_KEY_NOT_CONFIGURED") && (
          <div className="flex items-center gap-2 flex-wrap">
            {error.action?.href ? (
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href={error.action.href}>{error.action.label}</Link>
              </Button>
            ) : error.action?.onClick ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={error.action.onClick}
              >
                {error.action.label}
              </Button>
            ) : null}
            {error.code === "API_KEY_NOT_CONFIGURED" && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <a
                  href="https://platform.openai.com/settings/organization/billing/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Top Up OpenAI Billing
                </a>
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-0.5 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </Alert>
  );
}
