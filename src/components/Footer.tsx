import { Gift } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-border/40 bg-background">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-warm">
              <Gift className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold" style={{ fontFamily: "Fraunces, serif" }}>Snappy Gift</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Дарите подарки, которые выбирают сами получатели. Без промахов, без возвратов.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Продукт</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catalog" className="hover:text-foreground">Каталог</Link></li>
            <li><Link to="/create-gift" className="hover:text-foreground">Создать подарок</Link></li>
            <li><Link to="/corporate" className="hover:text-foreground">Корпоративные</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Компания</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>SIS Project · 2026</li>
            <li>Information Systems</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
        © 2026 Snappy Gift. Все права защищены.
      </div>
    </div>
  </footer>
);