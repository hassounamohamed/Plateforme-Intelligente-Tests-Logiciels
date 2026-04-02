"use client";

import { ReactNode, useEffect } from "react";
import {
  ColorSchemeScript,
  MantineProvider,
  localStorageColorSchemeManager,
  useComputedColorScheme,
} from "@mantine/core";
import { AlertBridge } from "@/components/ui/AlertBridge";
import { Toaster } from "@/components/ui/sonner";

interface AppThemeProviderProps {
  children: ReactNode;
}

const colorSchemeManager = localStorageColorSchemeManager({
  key: "pilt-color-scheme",
});

function ThemeClassSync() {
  const computedColorScheme = useComputedColorScheme("dark", {
    getInitialValueInEffect: true,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", computedColorScheme === "dark");
    root.setAttribute("data-theme", computedColorScheme);
  }, [computedColorScheme]);

  return null;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <MantineProvider
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
      theme={{
        fontFamily: "Manrope, sans-serif",
        primaryColor: "blue",
      }}
    >
      <ThemeClassSync />
      <AlertBridge />
      <Toaster />
      {children}
    </MantineProvider>
  );
}

export function AppColorSchemeScript() {
  return (
    <ColorSchemeScript
      defaultColorScheme="auto"
      forceColorScheme={undefined}
    />
  );
}
