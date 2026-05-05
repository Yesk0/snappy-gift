import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User as UserIcon, Heart, Shield, X, Plus, Loader2 } from "lucide-react";

type Preferences = {
  categories: string[];
  allergies: string[];
  budget_max: number | null;
};

type PrivacySettings = {
  show_history: boolean;
  allow_corporate: boolean;
};

const ALL_CATEGORIES = ["Еда и напитки", "Beauty", "Электроника", "Дом и уют", "Книги", "Впечатления"];

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [preferences, setPreferences] = useState<Preferences>({ categories: [], allergies: [], budget_max: null });
  const [privacy, setPrivacy] = useState<PrivacySettings>({ show_history: true, allow_corporate: true });
  const [allergyInput, setAllergyInput] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, preferences, privacy_settings")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        toast.error("Не удалось загрузить профиль");
      } else if (data) {
        setName(data.name || "");
        const prefs = (data.preferences as any) || {};
        setPreferences({
          categories: prefs.categories || [],
          allergies: prefs.allergies || [],
          budget_max: prefs.budget_max ?? null,
        });
        const priv = (data.privacy_settings as any) || {};
        setPrivacy({
          show_history: priv.show_history ?? true,
          allow_corporate: priv.allow_corporate ?? true,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const toggleCategory = (cat: string) => {
    setPreferences((p) => ({
      ...p,
      categories: p.categories.includes(cat) ? p.categories.filter((c) => c !== cat) : [...p.categories, cat],
    }));
  };

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (!val || preferences.allergies.includes(val)) return;
    setPreferences((p) => ({ ...p, allergies: [...p.allergies, val] }));
    setAllergyInput("");
  };

  const removeAllergy = (a: string) => {
    setPreferences((p) => ({ ...p, allergies: p.allergies.filter((x) => x !== a) }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name,
        preferences: preferences as any,
        privacy_settings: privacy as any,
      }, { onConflict: "id" });
    setSaving(false);
    if (error) {
      toast.error("Не удалось сохранить изменения");
      return;
    }
    toast.success("Профиль обновлён");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div>
          <h1 className="text-4xl font-semibold">Профиль</h1>
          <p className="mt-2 text-muted-foreground">Управляйте своими данными и предпочтениями</p>
        </div>

        {/* Личные данные */}
        <Card className="mt-8 border-border/50 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Личные данные</h2>
              <p className="text-sm text-muted-foreground">Как к вам обращаться</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="name">Имя</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="Ваше имя" />
            </div>
          </div>
        </Card>

        {/* Предпочтения */}
        <Card className="mt-6 border-border/50 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Предпочтения</h2>
              <p className="text-sm text-muted-foreground">Поможем AI подбирать лучшие подарки</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label>Любимые категории</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const active = preferences.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-full border px-4 py-1.5 text-sm transition-smooth ${
                        active
                          ? "gradient-warm border-transparent text-primary-foreground shadow-warm"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <Label>Аллергии и ограничения</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllergy(); } }}
                  placeholder="Например: орехи, лактоза"
                />
                <Button type="button" variant="outline" onClick={addAllergy}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {preferences.allergies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {preferences.allergies.map((a) => (
                    <Badge key={a} variant="secondary" className="gap-1 pr-1">
                      {a}
                      <button type="button" onClick={() => removeAllergy(a)} className="ml-1 rounded-full hover:bg-background/50">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <Label htmlFor="budget">Максимальный бюджет (₽)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                value={preferences.budget_max ?? ""}
                onChange={(e) =>
                  setPreferences((p) => ({ ...p, budget_max: e.target.value ? Number(e.target.value) : null }))
                }
                className="mt-1.5"
                placeholder="Не ограничен"
              />
              <p className="mt-1 text-xs text-muted-foreground">Подсказка для отправителей подарков</p>
            </div>
          </div>
        </Card>

        {/* Приватность */}
        <Card className="mt-6 border-border/50 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Приватность</h2>
              <p className="text-sm text-muted-foreground">Контролируйте, что видят другие</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 p-4">
              <div>
                <div className="font-medium">Показывать историю подарков</div>
                <div className="text-sm text-muted-foreground">Отправители смогут видеть, что вам уже дарили</div>
              </div>
              <Switch
                checked={privacy.show_history}
                onCheckedChange={(v) => setPrivacy((p) => ({ ...p, show_history: v }))}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 p-4">
              <div>
                <div className="font-medium">Участие в корпоративных событиях</div>
                <div className="text-sm text-muted-foreground">Разрешить организаторам добавлять вас в Secret Santa</div>
              </div>
              <Switch
                checked={privacy.allow_corporate}
                onCheckedChange={(v) => setPrivacy((p) => ({ ...p, allow_corporate: v }))}
              />
            </div>
          </div>
        </Card>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="gradient-warm text-primary-foreground shadow-warm hover:opacity-90"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Сохранить изменения
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;