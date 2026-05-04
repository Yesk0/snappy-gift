import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Plus, Loader2, Gift, Sparkles, Shield, Zap, Calendar } from "lucide-react";

type Event = {
  id: string;
  name: string;
  description: string | null;
  budget_per_person: number;
  type: string;
  assignments_generated: boolean;
  created_at: string;
};

const Corporate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("1500");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("corporate_events")
        .select("*")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setEvents(data as Event[]);
      setLoading(false);
    })();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Введите название события"); return; }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("corporate_events")
      .insert({
        organizer_id: user.id,
        name: name.trim(),
        description: description || null,
        budget_per_person: Number(budget) || 0,
        type: "secret_santa",
      })
      .select("*")
      .single();
    setSubmitting(false);
    if (error || !data) { toast.error("Не удалось создать событие"); return; }
    toast.success("Событие создано");
    setOpen(false);
    navigate(`/corporate/${data.id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="gradient-hero">
          <div className="container mx-auto px-4 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Для команд и компаний
              </div>
              <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
                Secret Santa <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">без хаоса</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
                Организуйте корпоративный обмен подарками за 5 минут. Автоматическое распределение, анонимность участников, трекинг выборов.
              </p>
              <Link to="/register" className="mt-8 inline-block">
                <Button size="lg" className="gradient-warm px-8 text-primary-foreground shadow-warm">
                  Попробовать бесплатно
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Zap, title: "Автораспределение", text: "Алгоритм derangement гарантирует, что никто не достанется сам себе" },
              { icon: Shield, title: "Полная анонимность", text: "Участники видят только того, кому дарят — не организатора" },
              { icon: Users, title: "Любой размер команды", text: "От 2 до 500 человек в одном событии" },
            ].map((f) => (
              <Card key={f.title} className="border-border/50 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-warm shadow-warm">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Корпоративные события</h1>
            <p className="mt-2 text-muted-foreground">Secret Santa и массовые поздравления</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-warm text-primary-foreground shadow-warm">
                <Plus className="mr-2 h-4 w-4" /> Новое событие
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новое событие</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="n">Название *</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Новый Год 2026" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="d">Описание</Label>
                  <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="b">Бюджет на человека (₽)</Label>
                  <Input id="b" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1.5" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
                <Button onClick={handleCreate} disabled={submitting} className="gradient-warm text-primary-foreground">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : events.length === 0 ? (
            <Card className="border-border/50 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Ещё нет событий</h3>
              <p className="mt-2 text-sm text-muted-foreground">Создайте первое корпоративное событие</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((e) => (
                <Link key={e.id} to={`/corporate/${e.id}`}>
                  <Card className="border-border/50 p-6 transition-smooth hover:shadow-soft">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warm shadow-warm">
                          <Gift className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="font-semibold">{e.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(e.created_at).toLocaleDateString("ru-RU")}</span>
                            <span>· ₽{Number(e.budget_per_person).toLocaleString()}/чел</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={e.assignments_generated ? "gradient-warm text-primary-foreground" : "bg-muted text-muted-foreground"}>
                        {e.assignments_generated ? "Распределено" : "Черновик"}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Corporate;