import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';
import { usePlatformCategories, buildCategoryTree } from '@/hooks/usePlatformCategories';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Loader2, Search, Package, ArrowRight, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface SearchableProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  business_id: string;
  business_name: string;
  business_subdomain: string;
  business_order_count: number;
  categoryNames: string[];
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function tokenizeQuery(value: string) {
  return normalizeText(value).split(/\s+/).filter(Boolean);
}

function ProductResultCard({ product }: { product: SearchableProduct }) {
  return (
    <Link
      to={`/store/${product.business_subdomain}/product/${product.id}`}
      className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-square bg-muted/30 relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
        <Link
          to={`/store/${product.business_subdomain}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
        >
          <Store className="h-3 w-3" />
          {product.business_name}
        </Link>
        {product.categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.categoryNames.slice(0, 2).map(cn => (
              <span key={cn} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{cn}</span>
            ))}
          </div>
        )}
        <p className="text-primary font-bold mt-2">€{product.price}</p>
      </div>
    </Link>
  );
}

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const { data: platformCategories = [] } = usePlatformCategories();
  const [allProducts, setAllProducts] = useState<SearchableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState<string | null>(searchParams.get('category') || null);
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [searchSort, setSearchSort] = useState<'relevance' | 'price-asc' | 'price-desc' | 'newest'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const { roots, children } = useMemo(() => buildCategoryTree(platformCategories), [platformCategories]);

  const isSearching = search.trim().length > 0;

  useEffect(() => {
    async function load() {
      const [bizRes, orderRes, pcRes, prodRes] = await Promise.all([
        supabase.from('businesses').select('id, name, subdomain').eq('is_active', true),
        supabase.from('orders').select('business_id'),
        supabase.from('product_categories').select('product_id, category_id'),
        supabase.from('products').select('id, name, description, price, image_url, business_id, created_at').eq('is_active', true),
      ]);

      const bizList = bizRes.data || [];
      const orders = orderRes.data || [];
      const productCategories = pcRes.data || [];
      const products = prodRes.data || [];

      const orderCounts: Record<string, number> = {};
      orders.forEach(o => { orderCounts[o.business_id] = (orderCounts[o.business_id] || 0) + 1; });

      const catIdToName: Record<string, string> = {};
      const catIdToSlug: Record<string, string> = {};
      platformCategories.forEach(c => { catIdToName[c.id] = c.name; catIdToSlug[c.id] = c.slug; });

      const prodCatMap: Record<string, { names: string[]; slugs: string[] }> = {};
      productCategories.forEach(pc => {
        if (!prodCatMap[pc.product_id]) prodCatMap[pc.product_id] = { names: [], slugs: [] };
        const name = catIdToName[pc.category_id];
        const slug = catIdToSlug[pc.category_id];
        if (name) prodCatMap[pc.product_id].names.push(name);
        if (slug) prodCatMap[pc.product_id].slugs.push(slug);
      });

      const bizMap: Record<string, { name: string; subdomain: string }> = {};
      bizList.forEach(b => { bizMap[b.id] = { name: b.name, subdomain: b.subdomain }; });

      const searchableProducts: SearchableProduct[] = products
        .filter(p => bizMap[p.business_id])
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image_url: p.image_url,
          business_id: p.business_id,
          business_name: bizMap[p.business_id].name,
          business_subdomain: bizMap[p.business_id].subdomain,
          business_order_count: orderCounts[p.business_id] || 0,
          categoryNames: prodCatMap[p.id]?.names || [],
          _categorySlugs: prodCatMap[p.id]?.slugs || [],
          _created_at: p.created_at,
        }));
      setAllProducts(searchableProducts as any);
      const max = Math.ceil(Math.max(...searchableProducts.map(p => p.price), 100));
      setMaxPrice(max);
      setPriceRange([0, max]);
      setLoading(false);
    }
    load();
  }, [platformCategories]);

  const searchableCategoryNames = useMemo(() => {
    const unique = new Set<string>();
    allProducts.forEach(product => {
      product.categoryNames.forEach(catName => unique.add(catName));
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  // Get active category slugs (including children)
  const activeCategorySlugs = useMemo(() => {
    if (!activeCategory) return null;
    const cat = platformCategories.find(c => c.slug === activeCategory);
    if (!cat) return null;
    const subs = children(cat.id).map(c => c.slug);
    return [cat.slug, ...subs];
  }, [activeCategory, platformCategories, children]);

  const displayProducts = useMemo(() => {
    let products = [...allProducts];

    // Filter by category
    if (activeCategorySlugs) {
      products = products.filter(p => {
        const slugs = (p as any)._categorySlugs || [];
        return slugs.some((s: string) => activeCategorySlugs.includes(s));
      });
    }

    // Filter by price range
    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filter by search category
    if (searchCategory !== 'all') {
      products = products.filter(p => p.categoryNames.includes(searchCategory));
    }

    // Search scoring
    if (isSearching) {
      const tokens = tokenizeQuery(search);
      const scored = products.map(product => {
        const name = normalizeText(product.name);
        const description = normalizeText(product.description || '');
        const business = normalizeText(product.business_name);
        const categories = product.categoryNames.map(cn => normalizeText(cn));

        let score = 0;
        tokens.forEach(token => {
          if (name.startsWith(token)) score += 12;
          else if (name.includes(token)) score += 8;
          if (categories.some(cat => cat.startsWith(token))) score += 6;
          else if (categories.some(cat => cat.includes(token))) score += 4;
          if (business.includes(token)) score += 3;
          if (description.includes(token)) score += 2;
        });

        if (tokens.length > 1 && tokens.every(token => name.includes(token))) {
          score += 10;
        }

        return { product, score };
      }).filter(item => item.score > 0);

      // Sort
      if (searchSort === 'price-asc') scored.sort((a, b) => a.product.price - b.product.price);
      else if (searchSort === 'price-desc') scored.sort((a, b) => b.product.price - a.product.price);
      else scored.sort((a, b) => b.score - a.score);

      return scored.map(item => item.product);
    }

    // Not searching - sort
    if (searchSort === 'price-asc') products.sort((a, b) => a.price - b.price);
    else if (searchSort === 'price-desc') products.sort((a, b) => b.price - a.price);
    else products.sort((a, b) => ((b as any)._created_at || '').localeCompare((a as any)._created_at || ''));

    return products;
  }, [allProducts, activeCategorySlugs, searchCategory, search, isSearching, searchSort, priceRange]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
              Zbulo produktet në <span className="text-gradient-primary">eblej.com</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Kërko dhe bli produkte nga dyqanet lokale më të mira.
            </p>
            
            <div className="max-w-2xl mx-auto flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Kërko produkte sipas emrit ose kategorisë..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>

            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtro sipas kategorisë" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Të gjitha kategoritë</SelectItem>
                  {searchableCategoryNames.map(categoryName => (
                    <SelectItem key={categoryName} value={categoryName}>{categoryName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={searchSort} onValueChange={(value) => setSearchSort(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Renditja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Më të rejat</SelectItem>
                  <SelectItem value="relevance">Më relevante</SelectItem>
                  <SelectItem value="price-asc">Çmimi: i ulët në të lartë</SelectItem>
                  <SelectItem value="price-desc">Çmimi: i lartë në të ulët</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Slider */}
            <div className="max-w-3xl mx-auto mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Çmimi</span>
                <span className="text-sm text-muted-foreground">
                  €{priceRange[0]} – €{priceRange[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={maxPrice}
                step={1}
                value={priceRange}
                onValueChange={(val) => setPriceRange(val as [number, number])}
                className="w-full"
              />
            </div>

            {roots.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant={activeCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(null)} className="rounded-full">Të gjitha</Button>
                {roots.map(cat => {
                  const Icon = getCategoryIcon(cat.icon);
                  return (
                    <Button key={cat.id} variant={activeCategory === cat.slug ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)} className="rounded-full gap-1.5">
                      <Icon className="h-3.5 w-3.5" /> {cat.name}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                {isSearching ? `Nuk u gjet asnjë produkt për "${search}".` : 'Nuk u gjet asnjë produkt.'}
              </p>
            </div>
          ) : (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">{displayProducts.length} produkte</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {displayProducts.map(product => <ProductResultCard key={product.id} product={product} />)}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}