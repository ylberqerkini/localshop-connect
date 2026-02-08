-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Create more restrictive policies that validate business_id exists
CREATE POLICY "Public can create customers for active businesses"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE businesses.id = customers.business_id 
        AND businesses.is_active = true
    )
);

CREATE POLICY "Public can create orders for active businesses"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE businesses.id = orders.business_id 
        AND businesses.is_active = true
    )
);

CREATE POLICY "Public can create order items for valid orders"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id
    )
);