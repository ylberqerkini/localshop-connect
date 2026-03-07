-- Allow businesses to configure bank details for online payouts
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS accepts_online_payments boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_account_holder text,
  ADD COLUMN IF NOT EXISTS bank_name text;

-- If online payments are enabled, require IBAN and account holder.
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS businesses_online_payments_require_bank_details;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_online_payments_require_bank_details
  CHECK (
    accepts_online_payments = false
    OR (
      iban IS NOT NULL
      AND length(trim(iban)) > 0
      AND bank_account_holder IS NOT NULL
      AND length(trim(bank_account_holder)) > 0
    )
  );
