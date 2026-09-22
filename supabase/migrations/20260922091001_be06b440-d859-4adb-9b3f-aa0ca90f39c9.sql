CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  link_label TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT banners_link_url_http CHECK (link_url IS NULL OR link_url ~* '^https?://')
);
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners public read" ON public.banners FOR SELECT TO anon, authenticated
USING (active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "banners admin read" ON public.banners FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "banners admin write" ON public.banners FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX banners_display_idx ON public.banners(active, sort_order, starts_at, ends_at);

CREATE TABLE public.product_relations (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, related_product_id),
  CONSTRAINT product_relations_not_self CHECK (product_id <> related_product_id)
);
GRANT SELECT ON public.product_relations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_relations TO authenticated;
GRANT ALL ON public.product_relations TO service_role;
ALTER TABLE public.product_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product relations public read" ON public.product_relations FOR SELECT TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active = true)
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = related_product_id AND p.active = true)
);
CREATE POLICY "product relations admin read" ON public.product_relations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product relations admin write" ON public.product_relations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX product_relations_related_idx ON public.product_relations(related_product_id);

CREATE OR REPLACE FUNCTION public.admin_setup_status()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') $$;
REVOKE ALL ON FUNCTION public.admin_setup_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_setup_status() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

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
      AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
      THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
  ) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

INSERT INTO public.site_settings (key, value, public) VALUES
('brand', jsonb_build_object('name','PromoraShop','tagline','OFERTAS · DESCOBERTAS · VOCÊ'), true),
('landing', jsonb_build_object('hero_title','Descubra coisas incríveis. Do seu jeito.','hero_description','Achadinhos escolhidos com carinho, informações claras e uma assistente pronta para ajudar você a encontrar o que combina com sua vida.','vivi_title','Encontre o que você precisa por um preço que vale a pena.','vivi_description','A Vivi é sua assistente que vai te ajudar a encontrar o que você precisa, por um preço que vale a pena.'), true),
('social', jsonb_build_object('whatsapp','https://wa.me/5571992600863','facebook','https://www.facebook.com/PromoraShop.ofc?mibextid=wwXIfr'), true),
('music_player', jsonb_build_object('playlist_id','PLepg7gx3R7I0','title','Playlist PromoraShop'), true),
('vivi', jsonb_build_object('enabled',true,'catalog_only',true), true)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, public = EXCLUDED.public;