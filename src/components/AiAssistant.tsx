import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };
type UserContext = { categories?: string[]; budget_max?: number | null; allergies?: string[] };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const MAX_INPUT = 500;

export const AiAssistant = () => {
  const { user, session } = useAuth();
  const { t } = useLocale();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: t.ai.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load user profile for context
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.preferences) return;
        const p = data.preferences as Record<string, unknown>;
        setUserContext({
          categories: Array.isArray(p.categories) ? (p.categories as string[]) : [],
          budget_max: typeof p.budget_max === "number" ? p.budget_max : null,
          allergies: Array.isArray(p.allergies) ? (p.allergies as string[]) : [],
        });
      });
  }, [user]);

  const scrollDown = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const handleOpen = () => {
    if (!user) { toast.error(t.ai.loginRequired); return; }
    setOpen(true);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !session) return;

    const userMsg: Msg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    scrollDown();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      if (resp.status === 429) { toast.error(t.ai.tooMany); setLoading(false); return; }
      if (resp.status === 402) { toast.error(t.ai.noCredits); setLoading(false); return; }
      if (resp.status === 401) { toast.error(t.ai.authRequired); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error(t.ai.error); setLoading(false); return; }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      let acc = "";

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        while (buffer.includes("\n")) {
          const nlPos = buffer.indexOf("\n");
          let line = buffer.slice(0, nlPos);
          buffer = buffer.slice(nlPos + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const chunk = line.slice(6).trim();
          if (chunk === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(chunk);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
              scrollDown();
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch {
      toast.error(t.ai.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2 rounded-full gradient-warm px-5 text-primary-foreground shadow-warm transition-smooth hover:scale-105"
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">{t.ai.title}</span>
        </button>
      )}

      {open && (
        <Card className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden border-border/50 shadow-warm">
          <div className="flex items-center justify-between gradient-warm p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <div className="font-semibold">{t.ai.title}</div>
                <div className="text-xs opacity-80">{t.ai.subtitle}</div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-accent/20 p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user" ? "gradient-warm text-primary-foreground" : "bg-background shadow-soft"
                  }`}
                >
                  {m.content || <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 border-t border-border/40 bg-background p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
              placeholder={t.ai.placeholder}
              disabled={loading}
              maxLength={MAX_INPUT}
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" aria-label="Send" className="gradient-warm text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </Card>
      )}
    </>
  );
};
