
-- Drop restrictive INSERT policies and recreate as permissive

-- customers: drop restrictive, create permissive
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

-- orders: drop restrictive, create permissive
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

-- order_items: drop restrictive, create permissive
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

-- commission_logs: drop restrictive, create permissive
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

-- Ensure anon and authenticated roles have proper grants
GRANT INSERT ON public.customers TO anon, authenticated;
GRANT INSERT, SELECT ON public.orders TO anon, authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT INSERT ON public.commission_logs TO anon, authenticated;
GRANT SELECT ON public.businesses TO anon, authenticated;
