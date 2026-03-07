import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CartProvider } from '@/hooks/useCart';
import { ProductCard } from '@/components/store/ProductCard';
import { CartDrawer } from '@/components/store/CartDrawer';
import { CheckoutForm } from '@/components/store/CheckoutForm';
import ProductDetail from '@/pages/ProductDetail';
import { Store as StoreIcon, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

type ProductSort = 'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'name';

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function tokenize(value: string) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function StoreContent() {
  const { subdomain, productId } = useParams<{ subdomain: string; productId?: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductSort>('newest');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
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

  // If viewing a specific product, render ProductDetail
  if (productId) {
    return <ProductDetail />;
  }

  const hasSearch = searchQuery.trim().length > 0;

  const filtered = useMemo(() => {
    const tokens = tokenize(searchQuery);
    const categoryMap = new Map(categories.map(category => [category.id, normalize(category.name)]));

    const ranked = products
      .filter(product => !selectedCategory || product.category_id === selectedCategory)
      .filter(product => !onlyAvailable || (product.stock_quantity === null || product.stock_quantity > 0))
      .map(product => {
        if (!hasSearch) return { product, score: 0 };

        const name = normalize(product.name);
        const description = normalize(product.description || '');
        const categoryName = normalize(categoryMap.get(product.category_id || '') || '');

        let score = 0;
        tokens.forEach(token => {
          if (name.startsWith(token)) score += 12;
          else if (name.includes(token)) score += 8;
          if (categoryName.includes(token)) score += 5;
          if (description.includes(token)) score += 3;
        });

        if (tokens.length > 1 && tokens.every(token => name.includes(token))) {
          score += 8;
        }

        return { product, score };
      })
      .filter(item => !hasSearch || item.score > 0);

    ranked.sort((a, b) => {
      if (sortBy === 'price-asc') return a.product.price - b.product.price;
      if (sortBy === 'price-desc') return b.product.price - a.product.price;
      if (sortBy === 'name') return a.product.name.localeCompare(b.product.name);
      if (sortBy === 'relevance') {
        if (b.score !== a.score) return b.score - a.score;
        return a.product.name.localeCompare(b.product.name);
      }
      return products.findIndex(p => p.id === a.product.id) - products.findIndex(p => p.id === b.product.id);
    });

    return ranked.map(item => item.product);
  }, [products, categories, selectedCategory, onlyAvailable, hasSearch, searchQuery, sortBy]);

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

      {/* Search and listing controls */}
      <section className="container mx-auto px-4 pt-4">
        <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  if (sortBy === 'newest') {
                    setSortBy('relevance');
                  }
                }}
                placeholder="Kërko produkte, kategori ose fjalë kyçe..."
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:w-auto">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as ProductSort)}>
                <SelectTrigger className="col-span-2 sm:col-span-1 min-w-[170px]">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Renditja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Më relevante</SelectItem>
                  <SelectItem value="newest">Më të rejat</SelectItem>
                  <SelectItem value="price-asc">Çmimi në rritje</SelectItem>
                  <SelectItem value="price-desc">Çmimi në ulje</SelectItem>
                  <SelectItem value="name">A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant={onlyAvailable ? 'default' : 'outline'}
                onClick={() => setOnlyAvailable(current => !current)}
                className="col-span-2 sm:col-span-1"
              >
                Vetëm në stok
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {filtered.length} rezultate {hasSearch ? `për "${searchQuery.trim()}"` : ''}
            </p>
            {(hasSearch || onlyAvailable || selectedCategory) && (
              <button
                type="button"
                className="text-primary hover:text-primary/80 font-medium"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setOnlyAvailable(false);
                  setSortBy('newest');
                }}
              >
                Pastro filtrat
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <main className="container mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <StoreIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{hasSearch ? 'Asnjë produkt nuk përputhet me kërkimin.' : 'Nuk ka produkte për momentin.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => (
              <ProductCard key={product.id} {...product} subdomain={subdomain} badge={product.badge} />
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
