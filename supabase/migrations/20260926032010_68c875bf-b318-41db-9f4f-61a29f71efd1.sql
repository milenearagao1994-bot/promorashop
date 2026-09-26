CREATE TABLE public.affiliate_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  link_url text NOT NULL CHECK (link_url ~* '^https?://'),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text,
  commission_info text,
  commission_highlight boolean NOT NULL DEFAULT false,
  description text,
  affiliate_notes text,
  caption text,
  benefits text,
  promo_image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_opportunities TO authenticated;
GRANT ALL ON public.affiliate_opportunities TO service_role;
ALTER TABLE public.affiliate_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate public read" ON public.affiliate_opportunities FOR SELECT TO anon, authenticated
  USING (active AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "affiliate admin all" ON public.affiliate_opportunities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.affiliate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('page_view','link_click')),
  opportunity_id uuid REFERENCES public.affiliate_opportunities(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX affiliate_events_created_idx ON public.affiliate_events(created_at);
GRANT INSERT ON public.affiliate_events TO anon;
GRANT SELECT, INSERT, DELETE ON public.affiliate_events TO authenticated;
GRANT ALL ON public.affiliate_events TO service_role;
ALTER TABLE public.affiliate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliate events public insert" ON public.affiliate_events FOR INSERT TO anon, authenticated
  WITH CHECK (
    (event_type = 'page_view' AND opportunity_id IS NULL)
    OR (event_type = 'link_click' AND opportunity_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.affiliate_opportunities o WHERE o.id = opportunity_id AND o.active))
  );
CREATE POLICY "affiliate events admin read" ON public.affiliate_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "affiliate events admin delete" ON public.affiliate_events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));