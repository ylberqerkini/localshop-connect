
-- =============================================
-- COUPONS
-- =============================================
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value numeric NOT NULL DEFAULT 0,
  free_delivery boolean NOT NULL DEFAULT false,
  min_order_amount numeric DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage coupons"
ON public.coupons FOR ALL
USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = coupons.business_id AND businesses.owner_id = auth.uid()));

CREATE POLICY "Public can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

-- =============================================
-- REVIEWS
-- =============================================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text DEFAULT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY "Public can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Business owners can manage reviews"
ON public.reviews FOR ALL
USING (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = reviews.business_id AND businesses.owner_id = auth.uid()));

-- =============================================
-- FOLLOWERS
-- =============================================
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  follower_identifier text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id, follower_identifier)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can follow businesses"
ON public.followers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can unfollow"
ON public.followers FOR DELETE
USING (true);

CREATE POLICY "Public can view follower count"
ON public.followers FOR SELECT
USING (true);

-- =============================================
-- WISHLISTS
-- =============================================
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_identifier text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_identifier)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage wishlists"
ON public.wishlists FOR ALL
USING (true);

-- =============================================
-- PRODUCT IMAGES (multiple)
-- =============================================
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage product images"
ON public.product_images FOR ALL
USING (EXISTS (
  SELECT 1 FROM products p JOIN businesses b ON b.id = p.business_id 
  WHERE p.id = product_images.product_id AND b.owner_id = auth.uid()
));

CREATE POLICY "Public can view product images"
ON public.product_images FOR SELECT
USING (true);

-- =============================================
-- PRODUCT BADGES
-- =============================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge text DEFAULT NULL;

-- =============================================
-- ANNOUNCEMENTS (Admin)
-- =============================================
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active announcements"
ON public.announcements FOR SELECT
USING (is_active = true);

-- =============================================
-- BUSINESSES: add is_suspended for admin
-- =============================================
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Add coupon_id reference to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
