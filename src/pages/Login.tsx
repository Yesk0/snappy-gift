import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/contexts/LocaleContext";

const Login = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Неверный email или пароль" : error.message);
      return;
    }
    toast.success(t.auth.signIn);
    navigate("/dashboard");
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/50 p-8 shadow-soft">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warm shadow-warm">
            <Gift className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-brand text-2xl font-semibold">Snappy Gift</span>
        </Link>
        <h1 className="text-center text-3xl font-semibold">{t.auth.signIn}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t.auth.signInSub}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">{t.auth.forgot}</Link>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-warm text-primary-foreground shadow-warm">
            {loading ? t.auth.loggingIn : t.auth.loginBtn}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.auth.noAccount}{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">{t.auth.register}</Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
