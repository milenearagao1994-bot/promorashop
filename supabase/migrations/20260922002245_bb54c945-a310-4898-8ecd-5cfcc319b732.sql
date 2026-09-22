CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "categories public read" ON public.categories;
CREATE POLICY "categories public read"
ON public.categories FOR SELECT TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "stores public read" ON public.stores;
CREATE POLICY "stores public read"
ON public.stores FOR SELECT TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "editorial reviews public read" ON public.editorial_reviews;
CREATE POLICY "editorial reviews public read"
ON public.editorial_reviews FOR SELECT TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "public settings read" ON public.site_settings;
CREATE POLICY "public settings read"
ON public.site_settings FOR SELECT TO anon, authenticated
USING (public = true);

DROP POLICY IF EXISTS "categories admin read" ON public.categories;
CREATE POLICY "categories admin read"
ON public.categories FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "stores admin read" ON public.stores;
CREATE POLICY "stores admin read"
ON public.stores FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "editorial reviews admin read" ON public.editorial_reviews;
CREATE POLICY "editorial reviews admin read"
ON public.editorial_reviews FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "settings admin read" ON public.site_settings;
CREATE POLICY "settings admin read"
ON public.site_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));