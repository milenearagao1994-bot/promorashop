CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.review_source AS ENUM ('admin','visitor');

CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 2 AND 60),
  body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 1200),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  photo_url text,
  source public.review_source NOT NULL DEFAULT 'visitor',
  status public.review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews public read approved" ON public.product_reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'approved' AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active = true));

CREATE POLICY "reviews visitor insert" ON public.product_reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND source = 'visitor' AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.active = true));

CREATE POLICY "reviews admin read" ON public.product_reviews
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reviews admin write" ON public.product_reviews
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.sanitize_product_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.author_name := btrim(regexp_replace(NEW.author_name, '<[^>]*>', '', 'g'));
  NEW.body := btrim(regexp_replace(NEW.body, '<[^>]*>', '', 'g'));
  NEW.body := left(NEW.body, 1200);
  IF NEW.photo_url IS NOT NULL AND NEW.photo_url !~* '^(https?://|/api/public/media/)' THEN
    NEW.photo_url := NULL;
  END IF;
  IF TG_OP = 'INSERT' AND EXISTS (
    SELECT 1 FROM public.product_reviews r
    WHERE r.product_id = NEW.product_id
      AND lower(r.body) = lower(NEW.body)
      AND r.created_at > now() - interval '10 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate review';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_reviews_sanitize
  BEFORE INSERT OR UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_product_review();

CREATE INDEX product_reviews_product_status_idx ON public.product_reviews (product_id, status, created_at DESC);

CREATE POLICY "media admin read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "media admin insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "media admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "media admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "media visitor review photo insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = 'avaliacoes');