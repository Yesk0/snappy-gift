-- Grant missing table-level privileges.
-- Supabase web-UI adds these automatically; SQL migrations do not.
-- RLS policies alone are insufficient without the underlying GRANT.

-- anon: read access to public-facing tables + write needed for gift recipients
GRANT SELECT ON public.products             TO anon;
GRANT SELECT ON public.gift_boxes           TO anon;
GRANT SELECT ON public.gift_box_items       TO anon;
GRANT SELECT ON public.selections           TO anon;
GRANT INSERT ON public.selections           TO anon;
GRANT UPDATE ON public.gift_boxes           TO anon;

-- authenticated: full access to own data (RLS enforces row-level ownership)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_boxes             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_box_items         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.selections             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_events       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_participants TO authenticated;
GRANT SELECT                          ON public.products               TO authenticated;
GRANT SELECT                          ON public.audit_log              TO authenticated;
