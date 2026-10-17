"use client";

import React, { createContext, useContext } from "react";

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Dashboard is English-only; language switching has been disabled.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return (
    <LanguageContext.Provider
      value={{
        language: "en",
        setLanguage: () => {},
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
