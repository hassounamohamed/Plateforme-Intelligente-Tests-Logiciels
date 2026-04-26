"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import fr from "../locales/fr";
import en from "../locales/en";

type Language = "fr" | "en";
type Translations = typeof fr;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries = {
  fr,
  en,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem("platform_language") as Language;
    if (savedLanguage && (savedLanguage === "fr" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("platform_language", lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let current: any = dictionaries[language];
    
    for (const k of keys) {
      if (current[k] === undefined) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        return key; // Fallback to key
      }
      current = current[k];
    }
    
    return current as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
