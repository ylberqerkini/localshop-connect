CREATE POLICY "Business owners can update their customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM businesses
  WHERE businesses.id = customers.business_id
  AND businesses.owner_id = auth.uid()
));