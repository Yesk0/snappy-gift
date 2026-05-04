import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { type Locale, translations } from "@/lib/i18n";

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translations["ru"];
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("snappy_locale") as Locale;
    return ["ru", "kz", "en"].includes(saved) ? saved : "ru";
  });

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("snappy_locale", l);
    setLocaleState(l);
  }, []);

  const t = translations[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
};
