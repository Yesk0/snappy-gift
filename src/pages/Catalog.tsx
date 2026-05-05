import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, Product } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AiAssistant } from "@/components/AiAssistant";
import { useLocale } from "@/contexts/LocaleContext";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 24;

const Catalog = () => {
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 300);
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error("Не удалось загрузить каталог");
      if (data) setProducts(data as Product[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { setPage(1); }, [search, category, priceRange]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (search && !(`${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()))) return false;
      const price = Number(p.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      return true;
    });
  }, [products, category, search, priceRange, t]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div>
          <h1 className="text-4xl font-semibold">{t.catalog.title}</h1>
          <p className="mt-2 text-muted-foreground">{filtered.length} {t.catalog.subtitle}</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Filters */}
          <Card className="h-fit border-border/50 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> {t.catalog.filters}
            </div>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">{t.catalog.search}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchRaw}
                    onChange={(e) => setSearchRaw(e.target.value)}
                    placeholder={t.catalog.search}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">{t.catalog.category}</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-3 py-1 text-xs transition-smooth ${
                        category === c
                          ? "gradient-warm border-transparent text-primary-foreground shadow-warm"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {c === "all" ? t.catalog.all : c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  {t.catalog.price}: ${priceRange[0]} – ${priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                  min={0}
                  max={500}
                  step={10}
                  className="mt-3"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setSearchRaw(""); setCategory("all"); setPriceRange([0, 500]); }}
                className="w-full"
              >
                {t.catalog.reset}
              </Button>
            </div>
          </Card>

          {/* Grid */}
          <div>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <Card className="flex h-64 items-center justify-center border-border/50">
                <p className="text-muted-foreground">{t.catalog.notFound}</p>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {paginated.map((p) => (
                    <ProductCard key={p.id} product={p} hideAction />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button type="button" variant="outline" onClick={() => setPage((n) => n + 1)}>
                      {t.catalog.showMore}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <AiAssistant />
      <Footer />
    </div>
  );
};

export default Catalog;
