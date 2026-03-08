
-- Drop restrictive policies and recreate as permissive for public insert on customers
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
