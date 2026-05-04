import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Gift } from "lucide-react";
import { toast } from "sonner";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email не указан. Вернитесь на страницу регистрации.");
      return;
    }
    if (code.length !== 6) {
      toast.error("Введите 6-значный код");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("expired") ? "Код истёк, запросите новый" : "Неверный код");
      return;
    }
    toast.success("Email подтверждён! Добро пожаловать 🎁");
    navigate("/dashboard");
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Новый код отправлен на почту");
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
        <h1 className="text-center text-3xl font-semibold">Подтвердите email</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Мы отправили 6-значный код на<br />
          <span className="font-medium text-foreground">{email || "вашу почту"}</span>
        </p>

        <form onSubmit={handleVerify} className="mt-6 space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full gradient-warm text-primary-foreground shadow-warm">
            {loading ? "Проверяем..." : "Подтвердить"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Не получили код?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resending ? "Отправляем..." : "Отправить снова"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/register" className="hover:underline">← Вернуться к регистрации</Link>
        </p>
      </Card>
    </div>
  );
};

export default VerifyEmail;