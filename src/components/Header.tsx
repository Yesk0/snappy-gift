import { Link, useNavigate } from "react-router-dom";
import { Gift, LogOut, User as UserIcon, Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { useCurrency, type Currency } from "@/contexts/CurrencyContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { type Locale, LOCALE_LABELS } from "@/lib/i18n";

const CURRENCIES: Currency[] = ["RUB", "KZT", "USD"];

export const Header = () => {
  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-warm shadow-warm">
            <Gift className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-brand text-xl font-semibold tracking-tight">Snappy Gift</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/catalog" className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground">
            {t.nav.catalog}
          </Link>
          <Link to="/corporate" className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground">
            {t.nav.corporate}
          </Link>
          {user && (
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground">
              {t.nav.myGifts}
            </Link>
          )}
        </nav>

        {/* Desktop controls */}
        <div className="hidden items-center gap-1 md:flex">
          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-xs font-medium">
                {LOCALE_LABELS[locale]}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
                <DropdownMenuItem key={l} onClick={() => setLocale(l)} className={locale === l ? "font-semibold" : ""}>
                  {LOCALE_LABELS[l]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-xs font-medium">
                {currency}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {CURRENCIES.map((c) => (
                <DropdownMenuItem key={c} onClick={() => setCurrency(c)} className={currency === c ? "font-semibold" : ""}>
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Auth */}
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                {t.nav.profile}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                {t.nav.signIn}
              </Button>
              <Button size="sm" onClick={() => navigate("/register")} className="gradient-warm text-primary-foreground shadow-warm hover:opacity-90">
                {t.nav.start}
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button type="button" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-3 px-4 py-4">
            <Link to="/catalog" onClick={() => setOpen(false)} className="text-sm font-medium">{t.nav.catalog}</Link>
            <Link to="/corporate" onClick={() => setOpen(false)} className="text-sm font-medium">{t.nav.corporate}</Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium">{t.nav.myGifts}</Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="text-sm font-medium">{t.nav.profile}</Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start">{t.nav.signOut}</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setOpen(false); navigate("/login"); }}>{t.nav.signIn}</Button>
                <Button size="sm" onClick={() => { setOpen(false); navigate("/register"); }} className="gradient-warm text-primary-foreground">{t.nav.start}</Button>
              </>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
              {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`rounded px-2 py-1 text-xs font-medium ${locale === l ? "gradient-warm text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
              <span className="text-border">|</span>
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded px-2 py-1 text-xs font-medium ${currency === c ? "gradient-warm text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {c}
                </button>
              ))}
              <span className="text-border">|</span>
              <button type="button" onClick={toggleTheme} className="p-1 text-muted-foreground" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
