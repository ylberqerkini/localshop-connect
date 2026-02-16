-- Add IBAN to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS iban text DEFAULT NULL;

-- Create payouts table for weekly payout batching
CREATE TABLE public.payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id),
    amount numeric NOT NULL,
    platform_fees numeric NOT NULL DEFAULT 0,
    net_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own payouts
CREATE POLICY "Business owners can view their payouts"
ON public.payouts
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = payouts.business_id AND businesses.owner_id = auth.uid()
));

-- Admins can manage all payouts
CREATE POLICY "Admins can manage all payouts"
ON public.payouts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Commission log table
CREATE TABLE public.commission_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id),
    business_id uuid NOT NULL REFERENCES public.businesses(id),
    order_number text NOT NULL,
    order_total numeric NOT NULL,
    commission_amount numeric NOT NULL DEFAULT 1.00,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_logs ENABLE ROW LEVEL SECURITY;

-- Sellers can view their commission logs
CREATE POLICY "Business owners can view their commission logs"
ON public.commission_logs
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = commission_logs.business_id AND businesses.owner_id = auth.uid()
));

-- Admins can view all commission logs
CREATE POLICY "Admins can view all commission logs"
ON public.commission_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public can insert commission logs (triggered during checkout)
CREATE POLICY "Public can insert commission logs for active businesses"
ON public.commission_logs
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = commission_logs.business_id AND businesses.is_active = true
));