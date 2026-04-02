"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const ERROR_PATTERNS = [
  /erreur/i,
  /error/i,
  /failed/i,
  /invalid/i,
  /invalide/i,
  /ne correspondent pas/i,
  /veuillez/i,
];

const SUCCESS_PATTERNS = [
  /succ[èe]s/i,
  /r[ée]ussi/i,
  /cr[ée][ée]/i,
  /modifi[ée]/i,
  /supprim[ée]/i,
  /activ[ée]/i,
  /d[ée]sactiv[ée]/i,
  /sauvegard[ée]/i,
  /assign[ée]s?/i,
  /valid[ée]/i,
];

function asText(message?: unknown): string {
  if (typeof message === "string") {
    return message;
  }

  if (message instanceof Error) {
    return message.message;
  }

  if (message == null) {
    return "Notification";
  }

  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

function inferVariant(text: string): "success" | "error" | "default" {
  if (ERROR_PATTERNS.some((pattern) => pattern.test(text))) {
    return "error";
  }

  if (SUCCESS_PATTERNS.some((pattern) => pattern.test(text))) {
    return "success";
  }

  return "default";
}

export function AlertBridge() {
  useEffect(() => {
    const originalAlert = window.alert.bind(window);

    window.alert = (message?: unknown) => {
      const text = asText(message);
      const variant = inferVariant(text);

      if (variant === "error") {
        toast.error(text);
        return;
      }

      if (variant === "success") {
        toast.success(text);
        return;
      }

      toast(text);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return null;
}
