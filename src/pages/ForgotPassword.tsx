import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Письмо отправлено на ваш email");
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/50 p-8 shadow-soft">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warm shadow-warm">
            <Gift className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold" style={{ fontFamily: "Fraunces, serif" }}>Snappy Gift</span>
        </Link>

        {sent ? (
          <>
            <h1 className="text-center text-2xl font-semibold">Проверьте почту</h1>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Мы отправили ссылку для восстановления пароля на <strong>{email}</strong>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-center text-2xl font-semibold">Забыли пароль?</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">Введите email и мы пришлём ссылку для сброса</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-warm text-primary-foreground shadow-warm">
                {loading ? "Отправляем..." : "Отправить ссылку"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">← Вернуться ко входу</Link>
        </p>
      </Card>
    </div>
  );
};

export default ForgotPassword;