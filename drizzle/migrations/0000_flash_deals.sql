CREATE TABLE public.flash_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text,
  original_price numeric NOT NULL CHECK (original_price > 0),
  final_price numeric NOT NULL CHECK (final_price > 0),
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (final_price < original_price)
);
GRANT SELECT ON public.flash_deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flash_deals TO authenticated;
GRANT ALL ON public.flash_deals TO service_role;
ALTER TABLE public.flash_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active flash deals" ON public.flash_deals FOR SELECT TO anon, authenticated USING (status = 'active' AND ends_at > now());
CREATE POLICY "Admins read all flash deals" ON public.flash_deals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert flash deals" ON public.flash_deals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update flash deals" ON public.flash_deals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete flash deals" ON public.flash_deals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.limit_active_flash_deals() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active' AND (SELECT count(*) FROM public.flash_deals WHERE status = 'active' AND ends_at > now() AND id <> NEW.id) >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 ofertas Relâmpagos ativas';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER flash_deals_limit BEFORE INSERT OR UPDATE ON public.flash_deals FOR EACH ROW EXECUTE FUNCTION public.limit_active_flash_deals();