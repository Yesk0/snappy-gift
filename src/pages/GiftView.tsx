import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Loader2, Heart, Check, PartyPopper } from "lucide-react";
import { Product } from "@/components/ProductCard";
import { toast } from "sonner";

type Box = {
  id: string;
  recipient_name: string | null;
  message: string | null;
  occasion: string | null;
  status: "pending" | "viewed" | "selected" | "shipped" | "delivered";
};

const GiftView = () => {
  const { token } = useParams<{ token: string }>();
  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [existingSelection, setExistingSelection] = useState<Product | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: b } = await supabase
        .from("gift_boxes")
        .select("id, recipient_name, message, occasion, status")
        .eq("unique_token", token)
        .maybeSingle();

      if (!b) { setLoading(false); return; }
      setBox(b as Box);

      const { data: itemRows } = await supabase
        .from("gift_box_items")
        .select("product_id, products:product_id(*)")
        .eq("gift_box_id", b.id);
      const prods = (itemRows || []).map((r: any) => r.products).filter(Boolean);
      setItems(prods as Product[]);

      // mark as viewed if still pending
      if (b.status === "pending") {
        await supabase.from("gift_boxes").update({ status: "viewed" }).eq("id", b.id);
      }

      // existing selection?
      const { data: sel } = await supabase
        .from("selections")
        .select("selected_product_id, products:selected_product_id(*)")
        .eq("gift_box_id", b.id)
        .maybeSingle();
      if (sel?.products) {
        setExistingSelection(sel.products as Product);
        setDone(true);
      }
      setLoading(false);
    })();
  }, [token]);

  const confirmChoice = async () => {
    if (!box || !selectedId) return;
    setConfirming(true);
    const { error } = await supabase.from("selections").insert({
      gift_box_id: box.id,
      selected_product_id: selectedId,
    });
    if (error) {
      toast.error("Не удалось сохранить выбор");
      setConfirming(false);
      return;
    }
    await supabase.from("gift_boxes").update({ status: "selected" }).eq("id", box.id);
    setDone(true);
    setExistingSelection(items.find((i) => i.id === selectedId) || null);
    setConfirming(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!box) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md p-12 text-center">
          <h1 className="text-2xl font-semibold">Подарок не найден</h1>
          <p className="mt-2 text-muted-foreground">Возможно, ссылка устарела</p>
          <Link to="/"><Button className="mt-6">На главную</Button></Link>
        </Card>
      </div>
    );
  }

  if (done && existingSelection) {
    return (
      <div className="gradient-hero min-h-screen px-4 py-12">
        <Card className="mx-auto max-w-2xl border-border/50 p-8 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-warm shadow-warm">
            <PartyPopper className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Отличный выбор!</h1>
          <p className="mt-2 text-muted-foreground">Ваш подарок уже в пути</p>
          <div className="mt-6 rounded-xl border border-border p-6">
            {existingSelection.image_url && (
              <img src={existingSelection.image_url} alt={existingSelection.name} className="mx-auto h-40 w-40 rounded-xl object-cover" />
            )}
            <div className="mt-4 font-semibold">{existingSelection.name}</div>
            <div className="text-sm text-muted-foreground">{existingSelection.description}</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="gradient-hero min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <Card className="border-border/50 p-8 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-warm shadow-warm">
            <Gift className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
            {box.recipient_name ? `${box.recipient_name}, ` : ""}вам подарок! 🎁
          </h1>
          {box.occasion && <p className="mt-2 text-muted-foreground">По случаю: {box.occasion}</p>}
          {box.message && (
            <div className="mx-auto mt-6 max-w-xl rounded-xl bg-accent/60 p-4 italic">
              <Heart className="mx-auto mb-2 h-4 w-4 text-primary" />
              "{box.message}"
            </div>
          )}
        </Card>

        <div className="mt-8">
          <h2 className="text-center text-xl font-semibold">Выберите то, что вам по душе</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">Можно выбрать только один вариант</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => {
              const active = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`group overflow-hidden rounded-2xl border bg-card text-left transition-smooth ${
                    active ? "border-primary shadow-warm ring-2 ring-primary" : "border-border hover:shadow-soft"
                  }`}
                >
                  <div className="relative aspect-square overflow-hidden bg-accent/40">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">🎁</div>
                    )}
                    {active && (
                      <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full gradient-warm text-primary-foreground shadow-warm">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold">{p.name}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={confirmChoice}
              disabled={!selectedId || confirming}
              className="gradient-warm px-10 text-primary-foreground shadow-warm"
            >
              {confirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Подтвердить выбор
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftView;