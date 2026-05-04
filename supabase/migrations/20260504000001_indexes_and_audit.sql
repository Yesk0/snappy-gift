-- ============ PERFORMANCE INDEXES ============
-- gift_boxes: sender dashboard + token lookup
CREATE INDEX IF NOT EXISTS idx_gift_boxes_sender_id ON public.gift_boxes(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_boxes_unique_token ON public.gift_boxes(unique_token);
CREATE INDEX IF NOT EXISTS idx_gift_boxes_status ON public.gift_boxes(status);

-- selections: duplicate check + sender view
CREATE INDEX IF NOT EXISTS idx_selections_gift_box_id ON public.selections(gift_box_id);

-- corporate tables
CREATE INDEX IF NOT EXISTS idx_corporate_events_organizer_id ON public.corporate_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_corporate_participants_event_id ON public.corporate_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_corporate_participants_email ON public.corporate_participants(user_email);

-- gift_box_items: join performance
CREATE INDEX IF NOT EXISTS idx_gift_box_items_gift_box_id ON public.gift_box_items(gift_box_id);
CREATE INDEX IF NOT EXISTS idx_gift_box_items_product_id ON public.gift_box_items(product_id);

-- ============ AUDIT LOG ============
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert; users can read their own entries
CREATE POLICY "Users view own audit entries" ON public.audit_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ============ GIFT BOX AUDIT TRIGGER ============
CREATE OR REPLACE FUNCTION public.audit_gift_box_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log(user_id, action, entity, entity_id, metadata)
    VALUES (NEW.sender_id, 'gift_box.created', 'gift_boxes', NEW.id::text,
            jsonb_build_object('recipient_email', NEW.recipient_email, 'occasion', NEW.occasion));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log(user_id, action, entity, entity_id, metadata)
    VALUES (NEW.sender_id, 'gift_box.status_changed', 'gift_boxes', NEW.id::text,
            jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER gift_box_audit
  AFTER INSERT OR UPDATE ON public.gift_boxes
  FOR EACH ROW EXECUTE FUNCTION public.audit_gift_box_changes();

-- ============ SELECTION AUDIT TRIGGER ============
CREATE OR REPLACE FUNCTION public.audit_selection()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sender_id UUID;
BEGIN
  SELECT sender_id INTO v_sender_id FROM public.gift_boxes WHERE id = NEW.gift_box_id;
  INSERT INTO public.audit_log(user_id, action, entity, entity_id, metadata)
  VALUES (v_sender_id, 'selection.made', 'selections', NEW.gift_box_id::text,
          jsonb_build_object('product_id', NEW.selected_product_id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER selection_audit
  AFTER INSERT ON public.selections
  FOR EACH ROW EXECUTE FUNCTION public.audit_selection();
