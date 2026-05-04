import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductCard, Product } from "@/components/ProductCard";
import { AiAssistant } from "@/components/AiAssistant";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Gift, Loader2, Copy } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const CreateGift = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1: details
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [message, setMessage] = useState("");

  // Step 2: picking
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Step 4: result
  const [submitting, setSubmitting] = useState(false);
  const [resultToken, setResultToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*");
      if (data) setProducts(data as Product[]);
      setLoadingProducts(false);
    })();
  }, []);

  const categories = useMemo(() => ["all", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    const b = budget ? Number(budget) : null;
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (b && Number(p.price) > b) return false;
      return true;
    });
  }, [products, categoryFilter, budget]);

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= 5) {
          toast.error("Максимум 5 вариантов в одном box");
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const canContinue = {
    1: recipientEmail.includes("@") && occasion.trim().length > 0,
    2: selected.size >= 2,
    3: true,
  } as Record<number, boolean>;

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { data: box, error } = await supabase
      .from("gift_boxes")
      .insert({
        sender_id: user.id,
        recipient_name: recipientName || null,
        recipient_email: recipientEmail,
        occasion: occasion || null,
        budget: budget ? Number(budget) : null,
        message: message || null,
      })
      .select("*")
      .single();

    if (error || !box) {
      setSubmitting(false);
      toast.error("Не удалось создать подарок");
      return;
    }

    const items = Array.from(selected).map((product_id) => ({ gift_box_id: box.id, product_id }));
    const { error: itemsError } = await supabase.from("gift_box_items").insert(items);
    if (itemsError) {
      setSubmitting(false);
      toast.error("Не удалось добавить товары в box");
      return;
    }

    setResultToken(box.unique_token);
    setStep(4);
    setSubmitting(false);
  };

  const copyLink = () => {
    if (!resultToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/gift/${resultToken}`);
    toast.success("Ссылка скопирована");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-smooth ${
                  step >= (s as Step)
                    ? "gradient-warm text-primary-foreground shadow-warm"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`mx-2 h-px flex-1 ${step > s ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="border-border/50 p-8">
            <h2 className="text-2xl font-semibold">Для кого подарок?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Основные данные получателя</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="rn">Имя получателя</Label>
                <Input id="rn" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Анна" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="re">Email получателя *</Label>
                <Input id="re" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="anna@example.com" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="oc">Повод *</Label>
                <Input id="oc" value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="День рождения" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="bg">Бюджет (₽)</Label>
                <Input id="bg" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="3000" className="mt-1.5" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="msg">Личное сообщение</Label>
                <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Пара тёплых слов..." className="mt-1.5" rows={3} />
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-border/50 p-8">
            <h2 className="text-2xl font-semibold">Выберите 2–5 вариантов</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Получатель выберет один из них. Сейчас выбрано: <strong>{selected.size}</strong>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`rounded-full border px-3 py-1 text-xs transition-smooth ${
                    categoryFilter === c
                      ? "gradient-warm border-transparent text-primary-foreground shadow-warm"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {c === "all" ? "Все" : c}
                </button>
              ))}
            </div>
            {loadingProducts ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} selected={selected.has(p.id)} onToggle={() => toggleProduct(p.id)} />
                ))}
              </div>
            )}
          </Card>
        )}

        {step === 3 && (
          <Card className="border-border/50 p-8">
            <h2 className="text-2xl font-semibold">Проверьте всё перед отправкой</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-accent/40 p-4">
                <div className="text-xs text-muted-foreground">Получатель</div>
                <div className="font-medium">{recipientName || "—"} · {recipientEmail}</div>
                <div className="mt-1 text-sm text-muted-foreground">Повод: {occasion}{budget && ` · Бюджет: ₽${budget}`}</div>
                {message && <div className="mt-2 text-sm italic">"{message}"</div>}
              </div>
              <div>
                <div className="mb-3 text-sm font-semibold">Варианты в box ({selected.size})</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.filter((p) => selected.has(p.id)).map((p) => (
                    <ProductCard key={p.id} product={p} hideAction />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 4 && resultToken && (
          <Card className="border-border/50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-warm shadow-warm">
              <Gift className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">Подарок готов! 🎉</h2>
            <p className="mt-2 text-muted-foreground">Поделитесь ссылкой с получателем — он сам выберет лучший вариант</p>
            <div className="mx-auto mt-6 flex max-w-lg items-center gap-2 rounded-xl border border-border bg-background p-3">
              <code className="flex-1 truncate text-sm">{window.location.origin}/gift/{resultToken}</code>
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Копировать
              </Button>
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>В мои подарки</Button>
              <Button onClick={() => window.location.reload()} className="gradient-warm text-primary-foreground">
                Создать ещё
              </Button>
            </div>
          </Card>
        )}

        {/* Nav */}
        {step < 4 && (
          <div className="mt-6 flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Назад
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canContinue[step]}
                className="gradient-warm text-primary-foreground shadow-warm"
              >
                Далее <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gradient-warm text-primary-foreground shadow-warm"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                Создать подарок
              </Button>
            )}
          </div>
        )}
      </div>
      <AiAssistant />
      <Footer />
    </div>
  );
};

export default CreateGift;