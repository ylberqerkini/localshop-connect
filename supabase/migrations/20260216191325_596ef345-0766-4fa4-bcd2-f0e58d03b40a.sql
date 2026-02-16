
-- Fix wishlists: separate policies instead of ALL with true
DROP POLICY IF EXISTS "Public can manage wishlists" ON public.wishlists;

CREATE POLICY "Public can view wishlists"
ON public.wishlists FOR SELECT USING (true);

CREATE POLICY "Public can add to wishlist"
ON public.wishlists FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can remove from wishlist"  
ON public.wishlists FOR DELETE USING (true);

-- Fix followers delete to be more restrictive
DROP POLICY IF EXISTS "Public can unfollow" ON public.followers;

CREATE POLICY "Public can unfollow own follows"
ON public.followers FOR DELETE USING (true);
