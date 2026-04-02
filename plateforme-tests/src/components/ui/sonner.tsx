"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "!border !border-border !bg-surface !text-foreground",
          description: "!text-muted",
        },
      }}
      {...props}
    />
  );
}
