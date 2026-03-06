import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CartProvider } from '@/hooks/useCart';
import { ProductCard } from '@/components/store/ProductCard';
import { CartDrawer } from '@/components/store/CartDrawer';
import { CheckoutForm } from '@/components/store/CheckoutForm';
import ProductDetail from '@/pages/ProductDetail';
import { Store as StoreIcon, Loader2 } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  delivery_price: number;
  cash_on_delivery: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  stock_quantity: number | null;
  category_id: string | null;
  badge: string | null;
}

interface Category {
  id: string;
  name: string;
}

function StoreContent() {
  const { subdomain, productId } = useParams<{ subdomain: string; productId?: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!subdomain) return;
      setLoading(true);

      const { data: biz } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, delivery_price, cash_on_delivery')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .maybeSingle();

      if (!biz) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBusiness(biz as Business);

      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('id, name, price, description, image_url, stock_quantity, category_id, badge').eq('business_id', biz.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').eq('business_id', biz.id).order('name'),
      ]);

      setProducts((prodRes.data as Product[]) || []);
      setCategories((catRes.data as Category[]) || []);
      setLoading(false);
    }
    load();
  }, [subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <StoreIcon className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Dyqani nuk u gjet</h1>
        <p className="text-muted-foreground">Kjo faqe nuk ekziston ose nuk është aktive.</p>
      </div>
    );
  }

  const { clearCart, addItem } = useCart();

  const handleBuyNow = (product: { id: string; name: string; price: number; image_url: string | null }) => {
    clearCart();
    addItem(product);
    setCheckoutOpen(true);
  };

  // If viewing a specific product, render ProductDetail
  if (productId) {
    return (
      <>
        <ProductDetail onBuyNow={handleBuyNow} />
        <CheckoutForm
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          businessId={business.id}
          deliveryFee={business.delivery_price ?? 0}
        />
      </>
    );
  }

  const filtered = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <StoreIcon className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <h1 className="font-bold text-lg text-foreground">{business.name}</h1>
          </div>
          <CartDrawer deliveryFee={business.delivery_price ?? 0} onCheckout={() => setCheckoutOpen(true)} />
        </div>
      </header>

      {/* Hero */}
      {business.description && (
        <section className="bg-muted py-8">
          <div className="container mx-auto px-4">
            <p className="text-muted-foreground max-w-2xl">{business.description}</p>
          </div>
        </section>
      )}

      {/* Categories filter */}
      {categories.length > 0 && (
        <div className="container mx-auto px-4 py-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Të gjitha
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      <main className="container mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <StoreIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nuk ka produkte për momentin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => (
              <ProductCard key={product.id} {...product} subdomain={subdomain} badge={product.badge} onBuyNow={handleBuyNow} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>Mundësuar nga <span className="font-semibold text-primary">eblej</span></p>
      </footer>

      <CheckoutForm
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        businessId={business.id}
        deliveryFee={business.delivery_price ?? 0}
      />
    </div>
  );
}

export default function StorePage() {
  return (
    <CartProvider>
      <StoreContent />
    </CartProvider>
  );
}
