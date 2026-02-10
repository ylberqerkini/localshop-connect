import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';

interface CartDrawerProps {
  deliveryFee: number;
  onCheckout: () => void;
}

export function CartDrawer({ deliveryFee, onCheckout }: CartDrawerProps) {
  const { items, totalItems, subtotal, updateQuantity, removeItem } = useCart();
  const total = subtotal + deliveryFee;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="hidden sm:inline">Shporta</span>
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Shporta ({totalItems})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Shporta është bosh
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-center p-3 rounded-lg border border-border">
                  <div className="h-14 w-14 rounded-md bg-muted overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground line-clamp-1">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} ALL</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-semibold text-sm">{(item.price * item.quantity).toLocaleString()} ALL</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t border-border pt-4 flex-col gap-2">
              <div className="w-full space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Nëntotali</span><span>{subtotal.toLocaleString()} ALL</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Transporti</span><span>{deliveryFee.toLocaleString()} ALL</span></div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-border"><span>Totali</span><span>{total.toLocaleString()} ALL</span></div>
              </div>
              <Button className="w-full" size="lg" onClick={onCheckout}>
                Porosit tani
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
