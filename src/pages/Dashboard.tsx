import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Plus, Link as LinkIcon, Loader2, Copy, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type GiftBox = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  occasion: string | null;
  budget: number | null;
  unique_token: string;
  status: "pending" | "viewed" | "selected" | "shipped" | "delivered";
  created_at: string;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending:   { label: "Ожидает",   className: "bg-muted text-muted-foreground" },
  viewed:    { label: "Просмотрен", className: "bg-primary/10 text-primary" },
  selected:  { label: "Выбран",     className: "gradient-warm text-primary-foreground" },
  shipped:   { label: "Отправлен",  className: "bg-secondary text-secondary-foreground" },
  delivered: { label: "Доставлен",  className: "bg-green-100 text-green-800" },
};

const Dashboard = () => {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState<GiftBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("gift_boxes")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });
      if (error) toast.error("Не удалось загрузить подарки");
      if (data) setBoxes(data as GiftBox[]);
      setLoading(false);
    })();
  }, [user]);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/gift/${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Ссылка скопирована"),
      () => toast.error("Не удалось скопировать ссылку")
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Мои подарки</h1>
            <p className="mt-2 text-muted-foreground">Привет, {user?.user_metadata?.name || user?.email?.split("@")[0]} 👋</p>
          </div>
          <Link to="/create-gift">
            <Button className="gradient-warm text-primary-foreground shadow-warm">
              <Plus className="mr-2 h-4 w-4" /> Создать подарок
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-border/50 p-6">
            <div className="text-sm text-muted-foreground">Всего подарков</div>
            <div className="mt-1 text-3xl font-semibold">{boxes.length}</div>
          </Card>
          <Card className="border-border/50 p-6">
            <div className="text-sm text-muted-foreground">Выбрано</div>
            <div className="mt-1 text-3xl font-semibold">
              {boxes.filter((b) => ["selected", "shipped", "delivered"].includes(b.status)).length}
            </div>
          </Card>
          <Card className="border-border/50 p-6">
            <div className="text-sm text-muted-foreground">Ожидают</div>
            <div className="mt-1 text-3xl font-semibold">
              {boxes.filter((b) => ["pending", "viewed"].includes(b.status)).length}
            </div>
          </Card>
        </div>

        {/* List */}
        <div className="mt-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : boxes.length === 0 ? (
            <Card className="border-border/50 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Пока нет подарков</h3>
              <p className="mt-2 text-sm text-muted-foreground">Создайте первый gift box за 2 минуты</p>
              <Link to="/create-gift" className="mt-6 inline-block">
                <Button className="gradient-warm text-primary-foreground shadow-warm">
                  <Plus className="mr-2 h-4 w-4" /> Создать подарок
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {boxes.map((b) => {
                const st = statusLabels[b.status] || statusLabels.pending;
                return (
                  <Card key={b.id} className="border-border/50 p-6 transition-smooth hover:shadow-soft">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                            <Gift className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {b.recipient_name || b.recipient_email}
                              {b.occasion && <span className="ml-2 text-sm font-normal text-muted-foreground">· {b.occasion}</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {b.recipient_email} · {new Date(b.created_at).toLocaleDateString("ru-RU")}
                              {b.budget && <> · ₽{Number(b.budget).toLocaleString()}</>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={st.className}>
                          {b.status === "selected" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {b.status === "viewed" && <Eye className="mr-1 h-3 w-3" />}
                          {st.label}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => copyLink(b.unique_token)}>
                          <Copy className="mr-1 h-3.5 w-3.5" /> Ссылка
                        </Button>
                        <Link to={`/gift/${b.unique_token}`}>
                          <Button variant="ghost" size="sm">
                            <LinkIcon className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;