GRANT INSERT ON public.analytics_events TO anon, authenticated;

CREATE POLICY "analytics public insert"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  anonymous_session_id IS NULL
  AND metadata = '{}'::jsonb
  AND product_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.id = analytics_events.product_id
      AND products.active = true
      AND (analytics_events.store_id IS NULL OR analytics_events.store_id = products.store_id)
  )
);

DROP POLICY "stores public read" ON public.stores;
CREATE POLICY "stores public read"
ON public.stores
FOR SELECT
TO anon, authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.stores FROM anon;
GRANT SELECT (id, name, slug, website_url, logo_url, accent_color, active, created_at, updated_at) ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;