import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

function getUserId() {
  let id = localStorage.getItem('eblej_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('eblej_user_id', id); }
  return id;
}

export function WishlistButton({ productId }: { productId: string }) {
  const [wishlisted, setWishlisted] = useState(false);
  const userId = getUserId();

  useEffect(() => {
    supabase
      .from('wishlists')
      .select('id')
      .eq('product_id', productId)
      .eq('user_identifier', userId)
      .maybeSingle()
      .then(({ data }) => setWishlisted(!!data));
  }, [productId]);

  const toggle = async () => {
    if (wishlisted) {
      await supabase.from('wishlists').delete().eq('product_id', productId).eq('user_identifier', userId);
      setWishlisted(false);
    } else {
      await supabase.from('wishlists').insert({ product_id: productId, user_identifier: userId });
      setWishlisted(true);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="shrink-0">
      <Heart className={`h-5 w-5 transition-colors ${wishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
    </Button>
  );
}
