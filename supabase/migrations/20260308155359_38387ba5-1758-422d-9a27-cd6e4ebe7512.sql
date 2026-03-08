
-- Grant necessary privileges to anon and authenticated roles for guest checkout
GRANT SELECT, INSERT ON public.customers TO anon, authenticated;
GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT, INSERT ON public.commission_logs TO anon, authenticated;
GRANT SELECT ON public.businesses TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
