import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  occasion: string | null;
  image_url: string | null;
  stock_quantity: number;
};

type Props = {
  product: Product;
  selected?: boolean;
  onToggle?: () => void;
  hideAction?: boolean;
};

export const ProductCard = ({ product, selected, onToggle, hideAction }: Props) => {
  const { format } = useCurrency();

  return (
    <Card className={`group overflow-hidden border-border/50 transition-smooth hover:shadow-warm ${selected ? "ring-2 ring-primary" : ""}`}>
      <div className="relative aspect-square overflow-hidden bg-accent/40">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">🎁</div>
        )}
        <Badge className="absolute left-3 top-3 bg-background/90 text-foreground backdrop-blur">
          {product.category}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold">{format(Number(product.price))}</span>
          {!hideAction && onToggle && (
            <Button
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              onClick={onToggle}
              className={selected ? "gradient-warm text-primary-foreground" : ""}
            >
              {selected ? <><Check className="mr-1 h-4 w-4" /> В box</> : <><Plus className="mr-1 h-4 w-4" /> Добавить</>}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
