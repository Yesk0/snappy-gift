import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
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

function buildSystemPrompt(ctx?: { categories?: string[]; budget_max?: number | null; allergies?: string[] }): string {
  if (!ctx) return BASE_PROMPT;
  const lines: string[] = [];
  if (ctx.categories?.length) lines.push(`User's favourite categories: ${ctx.categories.join(', ')}.`);
  if (ctx.budget_max) lines.push(`User's typical max budget: $${ctx.budget_max}.`);
  if (ctx.allergies?.length) lines.push(`Allergies/restrictions: ${ctx.allergies.join(', ')}. Never suggest these.`);
  return lines.length ? `${BASE_PROMPT}\n\nUser profile:\n${lines.join('\n')}` : BASE_PROMPT;
}

type GeminiContent = { role: 'user' | 'model'; parts: [{ text: string }] };

function toGeminiContents(messages: Array<{ role: string; content: string }>): GeminiContent[] {
  const mapped: GeminiContent[] = messages.map(m => ({
    role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    parts: [{ text: m.content || ' ' }],
  }));

  // Gemini requires first turn to be "user"
  while (mapped.length > 0 && mapped[0].role === 'model') mapped.shift();

  // Merge consecutive same-role messages (Gemini disallows them)
  const result: GeminiContent[] = [];
  for (const msg of mapped) {
    const last = result[result.length - 1];
    if (last && last.role === msg.role) {
      last.parts[0].text += '\n' + msg.parts[0].text;
    } else {
      result.push({ role: msg.role, parts: [{ text: msg.parts[0].text }] });
    }
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured on the server' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const contents = toGeminiContents(trimmed);
    if (contents.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(userContext) }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });

    if (geminiResp.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!geminiResp.ok || !geminiResp.body) {
      const errText = await geminiResp.text().catch(() => '');
      console.error('Gemini API error', geminiResp.status, errText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform Gemini SSE → OpenAI-compatible SSE format (what the client expects)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiResp.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (!data) continue;
              try {
                const event = JSON.parse(data);
                const text = event.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
                  controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                }
              } catch {
                // skip malformed event line
              }
            }
          }
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('ai-assistant error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
