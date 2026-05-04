
-- Revoke execute on trigger functions (they only run from triggers)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten selections insert: only one active selection per box, and only if box exists & not cancelled
DROP POLICY IF EXISTS "Anyone can insert selection" ON public.selections;
CREATE POLICY "Public insert selection for existing box" ON public.selections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gift_boxes gb
      WHERE gb.id = gift_box_id AND gb.status IN ('pending','viewed')
    )
  );
