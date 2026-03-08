
-- Fix customers: drop ALL existing insert policies, recreate as permissive
DROP POLICY IF EXISTS "Public can create customers for active businesses" ON public.customers;

CREATE POLICY "Public can create customers for active businesses"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = customers.business_id
    AND businesses.is_active = true
  )
);

-- Fix orders: drop restrictive insert policy, recreate as permissive
DROP POLICY IF EXISTS "Public can create orders for active businesses" ON public.orders;

CREATE POLICY "Public can create orders for active businesses"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = orders.business_id
    AND businesses.is_active = true
  )
);

-- Fix order_items: drop restrictive insert policy, recreate as permissive
DROP POLICY IF EXISTS "Public can create order items for valid orders" ON public.order_items;

CREATE POLICY "Public can create order items for valid orders"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
  )
);

-- Fix commission_logs: drop restrictive insert policy, recreate as permissive
DROP POLICY IF EXISTS "Public can insert commission logs for active businesses" ON public.commission_logs;

CREATE POLICY "Public can insert commission logs for active businesses"
ON public.commission_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = commission_logs.business_id
    AND businesses.is_active = true
  )
);
