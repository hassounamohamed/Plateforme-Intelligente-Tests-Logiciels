"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-(--surface-2)">
        <span className="material-symbols-outlined text-muted">language</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        className="flex items-center justify-center h-10 px-3 gap-2 rounded-lg transition-colors bg-(--surface-2) text-muted hover:text-foreground hover:bg-(--surface-3)"
        aria-label="Changer de langue"
      >
        <span className="material-symbols-outlined text-[20px]">language</span>
        <span className="text-sm font-medium uppercase">{language}</span>
      </button>

      <div className="absolute right-0 top-full mt-2 w-32 rounded-xl border border-border bg-(--surface) shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <button
          onClick={() => setLanguage("fr")}
          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-(--surface-2) transition-colors ${
            language === "fr" ? "font-bold text-primary" : "text-foreground"
          }`}
        >
          Français (FR)
        </button>
        <button
          onClick={() => setLanguage("en")}
          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-(--surface-2) transition-colors ${
            language === "en" ? "font-bold text-primary" : "text-foreground"
          }`}
        >
          English (EN)
        </button>
      </div>
    </div>
  );
}
