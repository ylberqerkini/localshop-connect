-- Add notification preferences to businesses
ALTER TABLE public.businesses
ADD COLUMN email_notifications boolean NOT NULL DEFAULT true;