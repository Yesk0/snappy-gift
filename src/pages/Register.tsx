import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Gift, Mail } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/LocaleContext";

const Register = () => {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t.auth.passwordPlaceholder);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name: name.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Этот email уже зарегистрирован" : error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border/50 p-8 shadow-soft text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-warm shadow-warm">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">{t.auth.checkEmail}</h1>
          <p className="mt-3 text-muted-foreground">{t.auth.emailSent}</p>
          <p className="mt-2 text-sm text-muted-foreground">{email}</p>
          <p className="mt-6 text-sm text-muted-foreground">
            {t.auth.hasAccount}{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t.auth.loginBtn}
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/50 p-8 shadow-soft">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warm shadow-warm">
            <Gift className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-brand text-2xl font-semibold">Snappy Gift</span>
        </Link>
        <h1 className="text-center text-3xl font-semibold">{t.auth.createAccount}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t.auth.createAccountSub}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">{t.auth.name}</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.auth.namePlaceholder}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.passwordPlaceholder}
              className="mt-1.5"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-warm text-primary-foreground shadow-warm">
            {loading ? t.auth.creating : t.auth.createBtn}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.auth.hasAccount}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">{t.auth.loginBtn}</Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
