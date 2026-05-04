
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('user', 'hr', 'admin');
CREATE TYPE public.gift_status AS ENUM ('pending', 'viewed', 'selected', 'cancelled');
CREATE TYPE public.event_type AS ENUM ('secret_santa', 'team_gift', 'birthday', 'other');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  preferences JSONB NOT NULL DEFAULT '{"categories":[],"budget_max":null,"allergies":[]}'::jsonb,
  privacy_settings JSONB NOT NULL DEFAULT '{"show_history":true,"allow_corporate":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ PRODUCTS (public catalog) ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  occasion TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products viewable by everyone" ON public.products
  FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- ============ GIFT BOXES ============
CREATE TABLE public.gift_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT,
  occasion TEXT,
  budget NUMERIC(10,2),
  unique_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status gift_status NOT NULL DEFAULT 'pending',
  corporate_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gift_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Senders view own boxes" ON public.gift_boxes
  FOR SELECT TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "Senders create boxes" ON public.gift_boxes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Senders update own boxes" ON public.gift_boxes
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "Anyone can view by token" ON public.gift_boxes
  FOR SELECT USING (true);
-- Публичный SELECT нужен для страницы /gift/:token; фильтруем на клиенте по токену.
-- Это безопасно: токен — случайные 32 hex-символа (128 бит энтропии).

-- ============ GIFT BOX ITEMS ============
CREATE TABLE public.gift_box_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_box_id UUID NOT NULL REFERENCES public.gift_boxes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gift_box_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items viewable by box sender" ON public.gift_box_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.gift_boxes WHERE id = gift_box_id AND sender_id = auth.uid())
  );
CREATE POLICY "Items viewable publicly" ON public.gift_box_items
  FOR SELECT USING (true);
CREATE POLICY "Senders add items" ON public.gift_box_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.gift_boxes WHERE id = gift_box_id AND sender_id = auth.uid())
  );

-- ============ SELECTIONS ============
CREATE TABLE public.selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_box_id UUID NOT NULL UNIQUE REFERENCES public.gift_boxes(id) ON DELETE CASCADE,
  selected_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  custom_request TEXT,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Selections viewable by sender" ON public.selections
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.gift_boxes WHERE id = gift_box_id AND sender_id = auth.uid())
  );
CREATE POLICY "Anyone can insert selection" ON public.selections
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view selection by box" ON public.selections
  FOR SELECT USING (true);

-- ============ CORPORATE EVENTS ============
CREATE TABLE public.corporate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type event_type NOT NULL DEFAULT 'secret_santa',
  budget_per_person NUMERIC(10,2) NOT NULL,
  description TEXT,
  assignments_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.corporate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage own events" ON public.corporate_events
  FOR ALL TO authenticated USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);

-- ============ CORPORATE PARTICIPANTS ============
CREATE TABLE public.corporate_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.corporate_events(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  assigned_to_email TEXT,
  assigned_to_name TEXT,
  gift_box_id UUID REFERENCES public.gift_boxes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_email)
);
ALTER TABLE public.corporate_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage participants" ON public.corporate_participants
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.corporate_events WHERE id = event_id AND organizer_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.corporate_events WHERE id = event_id AND organizer_id = auth.uid())
  );

-- ============ AUTO-CREATE PROFILE TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEED PRODUCTS (24 items) ============
INSERT INTO public.products (name, description, image_url, price, category, occasion, stock_quantity) VALUES
('Artisan Coffee Bundle', 'Three single-origin beans from small farms in Ethiopia, Colombia, Guatemala.', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800', 42.00, 'Food & Drink', 'any', 50),
('Cashmere Throw Blanket', 'Ultra-soft 100% Mongolian cashmere in warm sand tone.', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800', 185.00, 'Home', 'housewarming', 18),
('Leather Journal', 'Handbound vegetable-tanned leather, 200 cotton pages.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 58.00, 'Stationery', 'any', 34),
('Scented Soy Candle Set', 'Fig, cedarwood, and bergamot — 3 candles, 40h each.', 'https://images.unsplash.com/photo-1602178141046-0c3e8b4f1e56?w=800', 48.00, 'Home', 'any', 62),
('Wireless Earbuds Pro', 'Active noise cancelling, 30h battery, USB-C.', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', 129.00, 'Tech', 'birthday', 27),
('Fountain Pen Classic', 'Brass body, medium nib, includes two ink cartridges.', 'https://images.unsplash.com/photo-1583485088034-697b5bc36b92?w=800', 76.00, 'Stationery', 'work_anniversary', 15),
('Craft Chocolate Box', '12 single-origin bars from award-winning makers.', 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800', 54.00, 'Food & Drink', 'any', 40),
('Wool Slippers', 'Merino wool, leather sole. Sizes S–XL.', 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800', 64.00, 'Fashion', 'winter', 38),
('Botanical Print Set', 'Three framed archival prints, 30x40cm.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800', 92.00, 'Home', 'housewarming', 22),
('Premium Tea Collection', '30 sachets across green, black, oolong, herbal.', 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=800', 36.00, 'Food & Drink', 'any', 71),
('Silk Scarf', 'Hand-rolled silk twill, 90cm square.', 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800', 98.00, 'Fashion', 'birthday', 19),
('Desk Planter Trio', 'Three minimalist ceramic planters with succulents.', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800', 44.00, 'Home', 'work_anniversary', 33),
('Aromatherapy Diffuser', 'Walnut finish, 500ml, timer + mood light.', 'https://images.unsplash.com/photo-1636644691550-9f8f9b9b8f1d?w=800', 68.00, 'Wellness', 'any', 26),
('Gourmet Olive Oil Set', 'Two cold-pressed oils + aged balsamic from Tuscany.', 'https://images.unsplash.com/photo-1620705625656-b9e42e0d15b9?w=800', 58.00, 'Food & Drink', 'housewarming', 29),
('Linen Pyjama Set', 'Stonewashed French linen, unisex cut.', 'https://images.unsplash.com/photo-1602830207088-0df7c38e1fa8?w=800', 124.00, 'Fashion', 'any', 14),
('Bluetooth Speaker', 'Portable, waterproof, 12h playback.', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800', 89.00, 'Tech', 'birthday', 42),
('Spa Gift Box', 'Bath salts, facial mask, body oil, soy candle.', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800', 72.00, 'Wellness', 'any', 38),
('Classic Novels Set', 'Clothbound editions — 5 literary classics.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800', 110.00, 'Books', 'any', 20),
('Smart Mug', 'Temperature-controlled mug with app control.', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800', 99.00, 'Tech', 'work_anniversary', 17),
('Handmade Ceramic Vase', 'One-of-a-kind stoneware, 25cm, matte cream.', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', 82.00, 'Home', 'housewarming', 11),
('Truffle Salt & Pepper', 'Black truffle sea salt and wild pepper blend.', 'https://images.unsplash.com/photo-1599591059924-1d5e2bbd1e52?w=800', 34.00, 'Food & Drink', 'any', 55),
('Merino Wool Socks (3-pack)', 'Moisture-wicking, cushioned, lifetime guarantee.', 'https://images.unsplash.com/photo-1586350977771-2a1de0da75e8?w=800', 42.00, 'Fashion', 'any', 68),
('Instant Film Camera', 'Retro design, 10 sheets included.', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800', 128.00, 'Tech', 'birthday', 23),
('Meditation App + Journal', '12-month premium access + guided journal.', 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800', 88.00, 'Wellness', 'any', 999);
