import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) setValid(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValid(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Пароль должен быть минимум 6 символов");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Пароль обновлён!");
    navigate("/dashboard");
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/50 p-8 shadow-soft">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warm shadow-warm">
            <Gift className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold" style={{ fontFamily: "Fraunces, serif" }}>Snappy Gift</span>
        </div>
        <h1 className="text-center text-2xl font-semibold">Новый пароль</h1>
        {!valid ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Ссылка недействительна или устарела. Запросите новую.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="password">Новый пароль</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-warm text-primary-foreground shadow-warm">
              {loading ? "Сохраняем..." : "Обновить пароль"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;