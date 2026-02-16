import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Ticket, Check, X } from 'lucide-react';

interface CouponResult {
  code: string;
  discount_type: string;
  discount_value: number;
  free_delivery: boolean;
}

export function CouponInput({
  businessId,
  subtotal,
  onApply,
  onRemove,
  applied,
}: {
  businessId: string;
  subtotal: number;
  onApply: (coupon: CouponResult) => void;
  onRemove: () => void;
  applied: CouponResult | null;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const checkCoupon = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setError('');

    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('business_id', businessId)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    setChecking(false);

    if (!data) { setError('Kuponi nuk u gjet'); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setError('Kuponi ka skaduar'); return; }
    if (data.max_uses && data.used_count >= data.max_uses) { setError('Kuponi ka arritur limitin'); return; }
    if (data.min_order_amount && subtotal < Number(data.min_order_amount)) {
      setError(`Min. porosi: €${Number(data.min_order_amount).toFixed(2)}`);
      return;
    }

    onApply({
      code: data.code,
      discount_type: data.discount_type,
      discount_value: Number(data.discount_value),
      free_delivery: data.free_delivery,
    });
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between p-2 bg-success/10 border border-success/20 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-success" />
          <span className="font-mono font-bold">{applied.code}</span>
          <span className="text-muted-foreground">
            {applied.discount_type === 'fixed' ? `-€${applied.discount_value}` : `-${applied.discount_value}%`}
            {applied.free_delivery && ' + transport falas'}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kodi i kuponit"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            className="pl-9 font-mono text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={checkCoupon} disabled={checking || !code.trim()}>
          Apliko
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
