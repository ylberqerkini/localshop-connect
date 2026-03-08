
-- Grant necessary privileges to anon and authenticated roles for checkout tables
GRANT INSERT ON public.customers TO anon, authenticated;
GRANT SELECT ON public.customers TO anon, authenticated;
GRANT UPDATE ON public.customers TO authenticated;

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT ON public.orders TO anon, authenticated;
GRANT UPDATE ON public.orders TO authenticated;

GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.order_items TO anon, authenticated;

GRANT INSERT ON public.commission_logs TO anon, authenticated;
GRANT SELECT ON public.commission_logs TO anon, authenticated;
