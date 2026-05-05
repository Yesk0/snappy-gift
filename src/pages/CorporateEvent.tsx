import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2, Sparkles, Users, Gift, CheckCircle2, UserPlus } from "lucide-react";

const MIN_PARTICIPANTS = 3;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Event = {
  id: string;
  name: string;
  description: string | null;
  budget_per_person: number;
  assignments_generated: boolean;
};

type Participant = {
  id: string;
  user_name: string | null;
  user_email: string;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
};

const CorporateEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { user, session } = useAuth();
  const { t } = useLocale();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [bulkEmails, setBulkEmails] = useState("");

  const load = async () => {
    if (!id) return;
    try {
      const { data: ev, error: evErr } = await supabase.from("corporate_events").select("*").eq("id", id).maybeSingle();
      if (evErr) throw evErr;
      if (ev) setEvent(ev as Event);
      const { data: ps, error: psErr } = await supabase.from("corporate_participants").select("*").eq("event_id", id).order("created_at");
      if (psErr) throw psErr;
      if (ps) setParticipants(ps as Participant[]);
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const addParticipant = async () => {
    if (!id) return;
    if (!EMAIL_RE.test(newEmail.trim())) { toast.error("Введите корректный email"); return; }
    const normalised = newEmail.trim().toLowerCase();
    if (participants.some((p) => p.user_email.toLowerCase() === normalised)) {
      toast.error("Этот email уже в списке"); return;
    }
    setAdding(true);
    const { error } = await supabase.from("corporate_participants").insert({
      event_id: id,
      user_email: normalised,
      user_name: newName.trim() || null,
    });
    setAdding(false);
    if (error) { toast.error("Не удалось добавить"); return; }
    setNewEmail(""); setNewName("");
    load();
  };

  const addBulk = async () => {
    if (!id) return;
    const lines = bulkEmails.split(/[\n,;]/).map((l) => l.trim()).filter(Boolean);
    const toInsert: { event_id: string; user_email: string; user_name: string | null }[] = [];
    const existing = new Set(participants.map((p) => p.user_email.toLowerCase()));
    const invalid: string[] = [];

    for (const line of lines) {
      const emailMatch = line.match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/);
      if (!emailMatch) { invalid.push(line); continue; }
      const email = emailMatch[0].toLowerCase();
      if (existing.has(email)) continue;
      existing.add(email);
      const name = line.replace(emailMatch[0], "").trim() || null;
      toInsert.push({ event_id: id, user_email: email, user_name: name });
    }

    if (invalid.length > 0) toast.error(`Пропущено ${invalid.length} строк с некорректным email`);
    if (toInsert.length === 0) { toast.error("Нет новых корректных email"); return; }
    setAdding(true);
    const { error } = await supabase.from("corporate_participants").insert(toInsert);
    setAdding(false);
    if (error) { toast.error("Ошибка при массовом добавлении"); return; }
    toast.success(`Добавлено: ${toInsert.length}`);
    setBulkEmails("");
    load();
  };

  const removeParticipant = async (pid: string) => {
    if (event?.assignments_generated) { toast.error("Нельзя менять список после распределения"); return; }
    const { error } = await supabase.from("corporate_participants").delete().eq("id", pid);
    if (error) { toast.error("Не удалось удалить участника"); return; }
    load();
  };

  const runAssignment = async () => {
    if (!id || !session) return;
    if (participants.length < MIN_PARTICIPANTS) {
      toast.error(t.corporate.minParticipants);
      return;
    }
    setAssigning(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secret-santa-assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ event_id: id }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) { toast.error(data.error || "Не удалось распределить"); return; }
      toast.success(`Распределено между ${data.count} участниками 🎉`);
      load();
    } catch {
      toast.error("Ошибка сети. Проверьте соединение и попробуйте снова.");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl">{t.corporate.eventNotFound}</h1>
          <Link to="/corporate"><Button type="button" className="mt-4">{t.corporate.toList}</Button></Link>
        </div>
      </div>
    );
  }

  const myAssignment = participants.find((p) => p.user_email === user?.email);
  const canAssign = participants.length >= MIN_PARTICIPANTS && !event.assignments_generated;
  const need = MIN_PARTICIPANTS - participants.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Link to="/corporate" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t.corporate.toEvents}
        </Link>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">{event.name}</h1>
            {event.description && <p className="mt-2 text-muted-foreground">{event.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="secondary">Бюджет: ₽{Number(event.budget_per_person).toLocaleString()}{t.corporate.perPerson}</Badge>
              <Badge className={event.assignments_generated ? "gradient-warm text-primary-foreground" : "bg-muted text-muted-foreground"}>
                {event.assignments_generated ? t.corporate.distributed : t.corporate.draft}
              </Badge>
              <Badge variant="outline"><Users className="mr-1 h-3 w-3" />{participants.length}</Badge>
            </div>
          </div>
          {!event.assignments_generated && (
            <div className="flex flex-col items-end gap-1">
              <Button
                type="button"
                size="lg"
                onClick={runAssignment}
                disabled={assigning || !canAssign}
                className="gradient-warm text-primary-foreground shadow-warm"
              >
                {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {t.corporate.runSanta}
              </Button>
              {need > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t.corporate.needMore} {need} {t.corporate.moreParticipants}
                </p>
              )}
            </div>
          )}
        </div>

        {event.assignments_generated && myAssignment?.assigned_to_email && (
          <Card className="mt-6 gradient-warm border-0 p-6 text-primary-foreground shadow-warm">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6" />
              <div>
                <div className="text-xs uppercase tracking-wide opacity-80">{t.corporate.youGift}</div>
                <div className="text-xl font-semibold">{myAssignment.assigned_to_name || myAssignment.assigned_to_email}</div>
                <div className="text-sm opacity-90">{myAssignment.assigned_to_email}</div>
              </div>
            </div>
          </Card>
        )}

        {!event.assignments_generated && (
          <Card className="mt-6 border-border/50 p-6">
            <h3 className="flex items-center gap-2 font-semibold"><UserPlus className="h-4 w-4" /> {t.corporate.addParticipant}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input placeholder={t.corporate.namePlaceholder} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input type="email" placeholder={t.corporate.emailPlaceholder} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Button type="button" onClick={addParticipant} disabled={adding} className="gradient-warm text-primary-foreground">
                <Plus className="mr-1 h-4 w-4" /> {t.corporate.add}
              </Button>
            </div>
            <Separator className="my-6" />
            <h3 className="font-semibold">{t.corporate.bulkAdd}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.corporate.bulkHint}</p>
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={"anna@company.com Анна\nboris@company.com Борис"}
            />
            <Button type="button" variant="outline" onClick={addBulk} disabled={adding || !bulkEmails.trim()} className="mt-2">
              {t.corporate.bulkBtn}
            </Button>
          </Card>
        )}

        <Card className="mt-6 border-border/50 p-6">
          <h3 className="font-semibold">{t.corporate.participants} ({participants.length})</h3>
          {participants.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t.corporate.noParticipants}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                  <div>
                    <div className="font-medium">{p.user_name || p.user_email}</div>
                    <div className="text-xs text-muted-foreground">{p.user_email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.assignments_generated && p.assigned_to_email && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {t.corporate.distributed_label}
                      </Badge>
                    )}
                    {!event.assignments_generated && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeParticipant(p.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default CorporateEvent;
