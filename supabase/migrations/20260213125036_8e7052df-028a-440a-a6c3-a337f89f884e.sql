-- Add business_category column with fixed options
ALTER TABLE public.businesses ADD COLUMN business_category text DEFAULT 'other';

-- Add a check constraint for allowed values
ALTER TABLE public.businesses ADD CONSTRAINT businesses_category_check 
  CHECK (business_category IN ('restaurant', 'clothing', 'electronics', 'market', 'pharmacy', 'beauty', 'services', 'other'));