import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Sparkles, Heart, Users, Zap, Shield, ArrowRight, Check } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const Index = () => {
  const { t } = useLocale();
  const l = t.landing;

  const steps = [
    { icon: Gift,     title: l.step1Title, text: l.step1Text },
    { icon: Sparkles, title: l.step2Title, text: l.step2Text },
    { icon: Heart,    title: l.step3Title, text: l.step3Text },
  ];

  const businessFeats = [
    { icon: Users,  text: l.businessFeat1 },
    { icon: Zap,    text: l.businessFeat2 },
    { icon: Shield, text: l.businessFeat3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {l.badge}
            </div>
            <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
              {l.hero}{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {l.heroHighlight}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {l.heroPara}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="gradient-warm px-8 text-primary-foreground shadow-warm hover:opacity-90">
                  {l.createGift}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/catalog">
                <Button size="lg" variant="outline" className="px-8">
                  {l.viewCatalog}
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {l.noRegForReceiver}</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {l.aiPicks}</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {l.corpEvents}</div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-glow/30 blur-3xl" />
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold md:text-5xl">{l.howItWorks}</h2>
          <p className="mt-4 text-muted-foreground">{l.howItWorksSub}</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((f) => (
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

      {/* For business */}
      <section className="bg-accent/30 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl font-semibold md:text-5xl">{l.forBusiness}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{l.forBusinessSub}</p>
              <ul className="mt-6 space-y-3">
                {businessFeats.map((i) => (
                  <li key={i.text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <i.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>{i.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/corporate" className="mt-8 inline-block">
                <Button size="lg" variant="outline">{l.learnMore}</Button>
              </Link>
            </div>
            <Card className="border-border/50 p-8 shadow-soft">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div>
                    <div className="text-xs text-muted-foreground">{l.demoBudget}</div>
                    <div className="font-semibold">{l.demoEvent}</div>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {l.demoActive}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-2xl font-semibold">24</div><div className="text-xs text-muted-foreground">{l.demoParticipants}</div></div>
                  <div><div className="text-2xl font-semibold">18</div><div className="text-xs text-muted-foreground">{l.demoSelected}</div></div>
                  <div><div className="text-2xl font-semibold">₽50K</div><div className="text-xs text-muted-foreground">{l.demoBudget}</div></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="gradient-warm overflow-hidden border-0 p-12 text-center shadow-warm md:p-20">
          <h2 className="text-4xl font-semibold text-primary-foreground md:text-5xl">{l.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">{l.ctaSub}</p>
          <Link to="/register" className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="px-10">
              {l.ctaBtn}
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
