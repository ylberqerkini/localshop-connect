import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Link } from 'react-router-dom';
import { ProductBadge } from './ProductBadge';
import { WishlistButton } from './WishlistButton';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  stock_quantity: number | null;
  subdomain?: string;
  badge?: string | null;
  onBuyNow?: (product: { id: string; name: string; price: number; image_url: string | null }) => void;
}

export function ProductCard({ id, name, price, description, image_url, stock_quantity, subdomain, badge, onBuyNow }: ProductCardProps) {
  const { addItem } = useCart();
  const outOfStock = stock_quantity !== null && stock_quantity <= 0;
  const lowStock = stock_quantity !== null && stock_quantity > 0 && stock_quantity <= 5;
  const [imgLoaded, setImgLoaded] = useState(false);

  const cardContent = (
    <div className="aspect-square bg-muted overflow-hidden relative">
      <ProductBadge badge={badge || null} />
      {outOfStock && (
        <span className="absolute top-2 left-2 z-10 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-destructive border border-destructive/20">
          Pa stok
        </span>
      )}
      {image_url ? (
        <>
          {!imgLoaded && <Skeleton className="absolute inset-0" />}
          <img
            src={image_url}
            alt={name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <ShoppingCart className="h-12 w-12 opacity-20" />
        </div>
      )}
    </div>
  );

  return (
    <article className="group rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      {subdomain ? (
        <Link to={`/store/${subdomain}/product/${id}`} aria-label={`Shiko ${name}`}>
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-foreground line-clamp-1 flex-1">{name}</h3>
          <WishlistButton productId={id} />
        </div>
        {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
        <div className="flex items-center justify-between pt-1.5">
          <div>
            <span className="text-lg font-bold text-foreground">€{price.toFixed(2)}</span>
            {lowStock && <p className="text-xs text-destructive">Vetëm {stock_quantity} copë!</p>}
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addItem({ id, name, price, image_url })}
              disabled={outOfStock}
              className="gap-1"
              aria-label={`Shto ${name} në shportë`}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => onBuyNow?.({ id, name, price, image_url })}
              disabled={outOfStock}
              className="gap-1 flex-1"
            >
              {outOfStock ? 'Pa stok' : 'Blej tani'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}