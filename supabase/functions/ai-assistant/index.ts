import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_MSG_LEN = 2000;
const MAX_HISTORY = 20;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;

const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(userId: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

const BASE_PROMPT = `You are Snappy, a warm and thoughtful gift concierge.
Your job is to help a user pick meaningful gifts for someone they care about.

Rules:
- Ask ONE clarifying follow-up question if critical context is missing (recipient, budget, occasion, or interests). Keep it short and kind.
- Once you have enough context, propose 3–5 gift ideas. Use a short bulleted list: "**Name** — 1-line why it fits." No more than ~120 words total.
- Warm, human tone. No corporate jargon. No emojis overload (max 1 per reply).
- If the user is vague ("something nice"), nudge them with empathy, not a checklist.`;

function buildPrompt(ctx?: { categories?: string[]; budget_max?: number | null; allergies?: string[] }): string {
  if (!ctx) return BASE_PROMPT;
  const lines: string[] = [];
  if (ctx.categories?.length) lines.push(`User's favourite categories: ${ctx.categories.join(', ')}.`);
  if (ctx.budget_max) lines.push(`User's typical max budget: $${ctx.budget_max}.`);
  if (ctx.allergies?.length) lines.push(`Allergies/restrictions: ${ctx.allergies.join(', ')}. Never suggest these.`);
  return lines.length ? `${BASE_PROMPT}\n\nUser profile:\n${lines.join('\n')}` : BASE_PROMPT;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!checkRate(userData.user.id)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { messages, userContext } = body;

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages must be an array' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmed = messages.slice(-MAX_HISTORY);
    for (const m of trimmed) {
      if (typeof m.content === 'string' && m.content.length > MAX_MSG_LEN) {
        return new Response(JSON.stringify({ error: 'Message too long' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'system', content: buildPrompt(userContext) }, ...trimmed],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) {
      console.error('AI gateway error', response.status, await response.text());
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('ai-assistant error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
