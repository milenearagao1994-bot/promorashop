ALTER TABLE public.categories
  ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

DROP POLICY "categories public read" ON public.categories;
CREATE POLICY "categories public read" ON public.categories
  FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.products
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN price_updated_at TIMESTAMPTZ,
  ADD COLUMN specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.coupons
  ADD COLUMN conditions TEXT;

ALTER TABLE public.stores
  ADD COLUMN affiliate_base_url TEXT,
  ADD COLUMN admin_notes TEXT;

CREATE TABLE public.editorial_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  rating NUMERIC(2,1),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT editorial_reviews_rating_range CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5))
);
GRANT SELECT ON public.editorial_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.editorial_reviews TO authenticated;
GRANT ALL ON public.editorial_reviews TO service_role;
ALTER TABLE public.editorial_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "editorial reviews public read" ON public.editorial_reviews
  FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "editorial reviews admin write" ON public.editorial_reviews
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER editorial_reviews_updated_at BEFORE UPDATE ON public.editorial_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX editorial_reviews_product_idx ON public.editorial_reviews(product_id, published_at DESC);

CREATE TYPE public.analytics_event_type AS ENUM ('product_view', 'outbound_click');
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.analytics_event_type NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  anonymous_session_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics admin read" ON public.analytics_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX analytics_events_occurred_idx ON public.analytics_events(occurred_at DESC);
CREATE INDEX analytics_events_product_idx ON public.analytics_events(product_id, event_type);
CREATE INDEX analytics_events_store_idx ON public.analytics_events(store_id, event_type);

CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public settings read" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (public = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "settings admin write" ON public.site_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (key, value, public) VALUES
  ('music_player', jsonb_build_object('playlist_id', 'PLepg7gx3R7I0', 'title', 'Playlist PromoVip'), true)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, public = EXCLUDED.public;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN lower(COALESCE(NEW.email, '')) = 'arianearagaocomercial@gmail.com'
      THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
  ) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'arianearagaocomercial@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE INDEX products_display_idx ON public.products(active, featured DESC, sort_order, created_at DESC);
CREATE INDEX categories_display_idx ON public.categories(active, sort_order);