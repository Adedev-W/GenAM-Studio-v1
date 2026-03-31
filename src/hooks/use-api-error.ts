"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  parseApiError,
  parseNetworkError,
  type AppError,
  type ErrorCode,
} from "@/lib/errors";

const INLINE_CODES: Set<ErrorCode> = new Set([
  "API_KEY_NOT_CONFIGURED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "SERVICE_UNAVAILABLE",
  "NETWORK_ERROR",
]);

export function useApiError() {
  const { toast } = useToast();
  const [error, setError] = useState<AppError | null>(null);

  const handleError = useCallback(
    async (err: unknown) => {
      let appError: AppError;

      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        "title" in err &&
        "message" in err
      ) {
        appError = err as AppError;
      } else if (err instanceof Response) {
        let body: any = {};
        try {
          body = await err.json();
        } catch {}
        appError = parseApiError(err.status, body);
      } else if (
        err instanceof TypeError ||
        (err instanceof Error && err.message.toLowerCase().includes("fetch"))
      ) {
        appError = parseNetworkError();
      } else if (err instanceof Error) {
        appError = {
          code: "UNKNOWN",
          title: "Terjadi Kesalahan",
          message: err.message,
        };
      } else {
        appError = {
          code: "UNKNOWN",
          title: "Terjadi Kesalahan",
          message: String(err),
        };
      }

      if (INLINE_CODES.has(appError.code)) {
        setError(appError);
      } else {
        toast({
          title: appError.title,
          description: appError.message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const clearError = useCallback(() => setError(null), []);

  return { error, handleError, clearError };
}
