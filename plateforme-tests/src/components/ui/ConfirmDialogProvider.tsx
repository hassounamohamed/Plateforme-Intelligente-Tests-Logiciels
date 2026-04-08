"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
}

type ConfirmDialogInput = string | ConfirmDialogOptions;
type ConfirmDialogFn = (input: ConfirmDialogInput) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmDialogFn | null>(null);

const DEFAULT_TITLE = "Confirmation";
const DEFAULT_CONFIRM_TEXT = "Confirmer";
const DEFAULT_CANCEL_TEXT = "Annuler";

function normalizeInput(input: ConfirmDialogInput): Required<ConfirmDialogOptions> {
  if (typeof input === "string") {
    return {
      title: DEFAULT_TITLE,
      description: input,
      confirmText: DEFAULT_CONFIRM_TEXT,
      cancelText: DEFAULT_CANCEL_TEXT,
      confirmVariant: "default",
    };
  }

  return {
    title: input.title || DEFAULT_TITLE,
    description: input.description,
    confirmText: input.confirmText || DEFAULT_CONFIRM_TEXT,
    cancelText: input.cancelText || DEFAULT_CANCEL_TEXT,
    confirmVariant: input.confirmVariant || "default",
  };
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const resolverRef = useRef<((result: boolean) => void) | null>(null);
  const [dialogOptions, setDialogOptions] = useState<Required<ConfirmDialogOptions> | null>(null);

  const closeDialog = useCallback((result: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialogOptions(null);
    resolver?.(result);
  }, []);

  const confirm = useCallback<ConfirmDialogFn>((input) => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }

    setDialogOptions(normalizeInput(input));

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <AlertDialog
        open={Boolean(dialogOptions)}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogOptions?.title || DEFAULT_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogOptions?.description || ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeDialog(false)}>
              {dialogOptions?.cancelText || DEFAULT_CANCEL_TEXT}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={dialogOptions?.confirmVariant || "default"}
              onClick={() => closeDialog(true)}
            >
              {dialogOptions?.confirmText || DEFAULT_CONFIRM_TEXT}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }

  return context;
}
