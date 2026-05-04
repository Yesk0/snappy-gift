import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Sparkles, Heart, Users, Zap, Shield, ArrowRight, Check } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered подбор подарков
            </div>
            <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
              Подарки, которые <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">выбирают сами</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Соберите box из тщательно отобранных вариантов — получатель выберет то, что ему по душе. Никаких промахов, никаких возвратов.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="gradient-warm px-8 text-primary-foreground shadow-warm hover:opacity-90">
                  Создать подарок
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/catalog">
                <Button size="lg" variant="outline" className="px-8">
                  Посмотреть каталог
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Без регистрации для получателя</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> AI подберёт варианты</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Корпоративные события</div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-glow/30 blur-3xl" />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold md:text-5xl">Как это работает</h2>
          <p className="mt-4 text-muted-foreground">Три шага — и идеальный подарок уже в пути</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { icon: Gift, title: "1. Соберите box", text: "Выберите 3–5 подарков в категориях и бюджете получателя" },
            { icon: Sparkles, title: "2. AI подскажет", text: "Наш ассистент проанализирует повод и предложит лучшие варианты" },
            { icon: Heart, title: "3. Получатель выбирает", text: "По ссылке он сам выбирает то, что ему по-настоящему нужно" },
          ].map((f) => (
            <Card key={f.title} className="border-border/50 p-8 transition-smooth hover:shadow-warm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-warm shadow-warm">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="bg-accent/30 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl font-semibold md:text-5xl">Для бизнеса и команд</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Организуйте Secret Santa, корпоративные поздравления и подарки клиентам. Распределение автоматическое, отчётность — в один клик.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { icon: Users, text: "Secret Santa с автоматическим распределением" },
                  { icon: Zap, text: "Массовая отправка по списку email" },
                  { icon: Shield, text: "Анонимность и безопасность участников" },
                ].map((i) => (
                  <li key={i.text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <i.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>{i.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/corporate" className="mt-8 inline-block">
                <Button size="lg" variant="outline">Узнать больше</Button>
              </Link>
            </div>
            <Card className="border-border/50 p-8 shadow-soft">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Событие</div>
                    <div className="font-semibold">Новый Год 2026 · Команда продуктa</div>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Активно</div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-2xl font-semibold">24</div><div className="text-xs text-muted-foreground">Участника</div></div>
                  <div><div className="text-2xl font-semibold">18</div><div className="text-xs text-muted-foreground">Выбрали</div></div>
                  <div><div className="text-2xl font-semibold">₽50K</div><div className="text-xs text-muted-foreground">Бюджет</div></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="gradient-warm overflow-hidden border-0 p-12 text-center shadow-warm md:p-20">
          <h2 className="text-4xl font-semibold text-primary-foreground md:text-5xl">Готовы подарить радость?</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
            Создайте первый gift box за 2 минуты. Бесплатно, без карты.
          </p>
          <Link to="/register" className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="px-10">
              Начать бесплатно
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Index;