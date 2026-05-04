import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Currency = "RUB" | "KZT" | "USD";

type CurrencyContextType = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (priceUsd: number) => string;
};

// Approximate conversion rates (base: USD)
const RATES: Record<Currency, number> = {
  USD: 1,
  RUB: 90,
  KZT: 450,
};

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  RUB: "₽",
  KZT: "₸",
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("snappy_currency") as Currency;
    return ["RUB", "KZT", "USD"].includes(saved) ? saved : "RUB";
  });

  const setCurrency = useCallback((c: Currency) => {
    localStorage.setItem("snappy_currency", c);
    setCurrencyState(c);
  }, []);

  const format = useCallback(
    (priceUsd: number): string => {
      const converted = Math.round(priceUsd * RATES[currency]);
      const symbol = SYMBOLS[currency];
      if (currency === "USD") return `${symbol}${converted.toLocaleString("en-US")}`;
      return `${symbol}${converted.toLocaleString("ru-RU")}`;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
