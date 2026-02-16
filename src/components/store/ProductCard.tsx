import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  stock_quantity: number | null;
  subdomain?: string;
}

export function ProductCard({ id, name, price, description, image_url, stock_quantity, subdomain }: ProductCardProps) {
  const { addItem } = useCart();
  const outOfStock = stock_quantity !== null && stock_quantity <= 0;

  const cardContent = (
    <>
      <div className="aspect-square bg-muted overflow-hidden">
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 opacity-20" />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {subdomain ? (
        <Link to={`/store/${subdomain}/product/${id}`}>
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{name}</h3>
        {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-foreground">{price.toLocaleString()} ALL</span>
          <Button
            size="sm"
            onClick={() => addItem({ id, name, price, image_url })}
            disabled={outOfStock}
            className="gap-1"
          >
            <ShoppingCart className="h-4 w-4" />
            {outOfStock ? 'Pa stok' : 'Shto'}
          </Button>
        </div>
      </div>
    </div>
  );
}
