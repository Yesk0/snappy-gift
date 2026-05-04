import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const { event_id } = await req.json();
    if (!event_id) {
      return new Response(JSON.stringify({ error: 'event_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify organizer owns event
    const { data: event, error: evErr } = await supabase
      .from('corporate_events').select('*').eq('id', event_id).single();
    if (evErr || !event || event.organizer_id !== userId) {
      return new Response(JSON.stringify({ error: 'Event not found or forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: participants, error: pErr } = await supabase
      .from('corporate_participants').select('*').eq('event_id', event_id);
    if (pErr) throw pErr;
    if (!participants || participants.length < 2) {
      return new Response(JSON.stringify({ error: 'Need at least 2 participants' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Derangement: shuffle until no one gifts themselves
    const indices = participants.map((_, i) => i);
    let assignment: number[] = [];
    for (let tries = 0; tries < 100; tries++) {
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      if (shuffled.every((v, i) => v !== i)) { assignment = shuffled; break; }
    }
    if (assignment.length === 0) throw new Error('Could not generate derangement');

    for (let i = 0; i < participants.length; i++) {
      const giver = participants[i];
      const receiver = participants[assignment[i]];
      await supabase.from('corporate_participants').update({
        assigned_to_email: receiver.user_email,
        assigned_to_name: receiver.user_name,
      }).eq('id', giver.id);
    }

    await supabase.from('corporate_events')
      .update({ assignments_generated: true }).eq('id', event_id);

    return new Response(JSON.stringify({ success: true, count: participants.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('secret-santa-assign error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});