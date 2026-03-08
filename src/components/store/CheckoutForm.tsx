import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { CouponInput } from './CouponInput';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const checkoutSchema = z.object({
  full_name: z.string().trim().min(2, 'Emri duhet të ketë të paktën 2 karaktere').max(100),
  phone: z.string().trim().min(9, 'Numri i telefonit nuk është i vlefshëm').max(20),
  address: z.string().trim().min(5, 'Adresa duhet të ketë të paktën 5 karaktere').max(300),
  city: z.string().trim().min(2, 'Qyteti duhet të ketë të paktën 2 karaktere').max(100),
  notes: z.string().max(500).optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

interface CouponResult {
  code: string;
  discount_type: string;
  discount_value: number;
  free_delivery: boolean;
}

interface CheckoutFormProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  deliveryFee: number;
}

export function CheckoutForm({ open, onClose, businessId, deliveryFee }: CheckoutFormProps) {
  const { items, subtotal, clearCart } = useCart();
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { full_name: '', phone: '', address: '', city: '', notes: '' },
  });

  // Calculate discount
  let discountAmount = 0;
  let effectiveDelivery = deliveryFee;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'fixed') {
      discountAmount = Math.min(appliedCoupon.discount_value, subtotal);
    } else {
      discountAmount = subtotal * (appliedCoupon.discount_value / 100);
    }
    if (appliedCoupon.free_delivery) effectiveDelivery = 0;
  }
  const total = subtotal - discountAmount + effectiveDelivery;

  const onSubmit = async (values: CheckoutValues) => {
    if (items.length === 0) return;
    setSubmitting(true);

    try {
      const { data: customer, error: custErr } = await supabase
        .from('customers')
        .insert({ business_id: businessId, full_name: values.full_name, phone: values.phone, address: values.address, email: null })
        .select('id')
        .single();
      if (custErr) throw custErr;

      const platformFee = 1.00;
      const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}`;

      const { data: order, error: ordErr } = await supabase
        .from('orders')
        .insert({
          business_id: businessId,
          customer_id: customer.id,
          order_number: orderNum,
          subtotal,
          delivery_fee: effectiveDelivery,
          platform_fee: platformFee,
          total,
          city: values.city,
          notes: values.notes || null,
          status: 'pending',
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discountAmount,
        } as any)
        .select('id')
        .single();
      if (ordErr) throw ordErr;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      await supabase.from('commission_logs').insert({
        order_id: order.id,
        business_id: businessId,
        order_number: orderNum,
        order_total: total,
        commission_amount: platformFee,
      });

      // Increment coupon used_count
      if (appliedCoupon) {
        try {
          const { data: couponData } = await supabase
            .from('coupons')
            .select('id, used_count')
            .eq('business_id', businessId)
            .eq('code', appliedCoupon.code)
            .maybeSingle();
          if (couponData) {
            await supabase.from('coupons').update({ used_count: (couponData.used_count || 0) + 1 }).eq('id', couponData.id);
          }
        } catch (e) { console.error('Coupon update error:', e); }
      }

      supabase.functions.invoke('notify-order', {
        body: {
          business_id: businessId,
          order_number: orderNum,
          customer_name: values.full_name,
          customer_phone: values.phone,
          city: values.city,
          subtotal,
          delivery_fee: effectiveDelivery,
          total,
          items: items.map(i => ({ product_name: i.name, quantity: i.quantity, unit_price: i.price, total: i.price * i.quantity })),
          notes: values.notes || undefined,
        },
      }).catch(err => console.error('Notification error:', err));

      clearCart();
      setAppliedCoupon(null);
      onClose();
      toast({ title: 'Porosia u dërgua me sukses! ✅', description: `Numri i porosisë: ${orderNum}` });
      navigate(`/store/${subdomain}/order/${orderNum}`);
    } catch (err) {
      console.error('Checkout error:', err);
      toast({ title: 'Gabim gjatë dërgimit', description: 'Porosia nuk u dërgua. Provo përsëri.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setAppliedCoupon(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Përfundo porosinë</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Emri i plotë</FormLabel>
                <FormControl><Input placeholder="Emri Mbiemri" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefoni</FormLabel>
                <FormControl><Input placeholder="+355 6X XXX XXXX" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>Qyteti</FormLabel>
                  <FormControl><Input placeholder="Tiranë" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresa</FormLabel>
                  <FormControl><Input placeholder="Rruga, Nr." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Shënime (opsionale)</FormLabel>
                <FormControl><Textarea placeholder="Shënime për porosinë..." rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Coupon */}
            <CouponInput
              businessId={businessId}
              subtotal={subtotal}
              applied={appliedCoupon}
              onApply={setAppliedCoupon}
              onRemove={() => setAppliedCoupon(null)}
            />

            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nëntotali</span><span>€{subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success"><span>Zbritja</span><span>-€{discountAmount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Transporti</span><span>€{effectiveDelivery.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Totali</span><span>€{total.toFixed(2)}</span></div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting || items.length === 0}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Dërgo porosinë
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
