import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductBadge } from '@/components/store/ProductBadge';
import { WishlistButton } from '@/components/store/WishlistButton';
import { ReviewSection } from '@/components/store/ReviewSection';
import { ShoppingCart, ArrowLeft, Minus, Plus, Store as StoreIcon, Loader2, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  stock_quantity: number | null;
  category_id: string | null;
  business_id: string;
  badge: string | null;
}

interface Business {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
}

interface Category {
  name: string;
}

interface ProductImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export default function ProductDetail() {
  const { subdomain, productId } = useParams<{ subdomain: string; productId: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [extraImages, setExtraImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (!subdomain || !productId) return;
      setLoading(true);

      const { data: biz } = await supabase
        .from('businesses')
        .select('name, subdomain, logo_url, id')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .maybeSingle();

      if (!biz) { setNotFound(true); setLoading(false); return; }
      setBusiness(biz as Business);

      const { data: prod } = await supabase
        .from('products')
        .select('id, name, price, description, image_url, stock_quantity, category_id, business_id, badge')
        .eq('id', productId)
        .eq('business_id', biz.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!prod) { setNotFound(true); setLoading(false); return; }
      setProduct(prod as Product);
      setSelectedImage(prod.image_url);

      // Fetch extra images, category, related in parallel
      const [catRes, relRes, imgRes] = await Promise.all([
        prod.category_id
          ? supabase.from('categories').select('name').eq('id', prod.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('products').select('id, name, price, description, image_url, stock_quantity, category_id, business_id, badge')
          .eq('business_id', biz.id).eq('is_active', true).neq('id', productId).limit(4),
        supabase.from('product_images').select('*').eq('product_id', productId).order('sort_order'),
      ]);

      setCategory(catRes.data as Category | null);
      setRelatedProducts((relRes.data as Product[]) || []);
      setExtraImages((imgRes.data as ProductImage[]) || []);
      setLoading(false);
    }
    load();
  }, [subdomain, productId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (notFound || !product || !business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Produkti nuk u gjet</h1>
        <Link to={`/store/${subdomain}`}><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> Kthehu në dyqan</Button></Link>
      </div>
    );
  }

  const outOfStock = product.stock_quantity !== null && product.stock_quantity <= 0;
  const allImages = [product.image_url, ...extraImages.map(i => i.image_url)].filter(Boolean) as string[];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
    }
    setQuantity(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center h-16 px-4 gap-3">
          <Link to={`/store/${subdomain}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <StoreIcon className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
            <Link to={`/store/${subdomain}`} className="font-bold text-foreground hover:text-primary transition-colors">
              {business.name}
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl bg-muted overflow-hidden border border-border relative">
              <ProductBadge badge={product.badge} />
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="h-24 w-24 text-muted-foreground/30" /></div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${selectedImage === img ? 'border-primary' : 'border-border'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {category && <Badge variant="secondary" className="mb-2">{category.name}</Badge>}
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{product.name}</h1>
              </div>
              <WishlistButton productId={product.id} />
            </div>
            <p className="text-3xl font-bold text-primary">€{product.price.toFixed(2)}</p>

            {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}

            {product.stock_quantity !== null && (
              <p className="text-sm text-muted-foreground">
                {outOfStock ? <span className="text-destructive font-medium">Pa stok</span> :
                  product.stock_quantity <= 5 ? <span className="text-destructive">Vetëm {product.stock_quantity} copë!</span> :
                  <span>{product.stock_quantity} copë në stok</span>}
              </p>
            )}

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 border border-border rounded-lg px-2 py-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={outOfStock}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)} disabled={outOfStock}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart} disabled={outOfStock}>
                <ShoppingCart className="h-5 w-5" />
                {outOfStock ? 'Pa stok' : 'Shto në shportë'}
              </Button>
            </div>

            {/* WhatsApp share */}
            <Button variant="outline" className="gap-2 mt-2" onClick={() => {
              const url = window.location.href;
              const text = `${product.name} — €${product.price.toFixed(2)}\n${url}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Shpërndaj në WhatsApp
            </Button>
          </div>
        </div>

        {/* Reviews */}
        <div className="max-w-4xl mx-auto mt-12">
          <ReviewSection productId={product.id} businessId={product.business_id} />
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">Produkte të ngjashme</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map(rp => (
                <Link key={rp.id} to={`/store/${subdomain}/product/${rp.id}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-muted overflow-hidden relative">
                    <ProductBadge badge={rp.badge} />
                    {rp.image_url ? (
                      <img src={rp.image_url} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/30" /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-foreground line-clamp-1">{rp.name}</h3>
                    <p className="text-sm font-bold text-primary mt-1">€{rp.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground mt-8">
        <p>Mundësuar nga <span className="font-semibold text-primary">eblej</span></p>
      </footer>
    </div>
  );
}
