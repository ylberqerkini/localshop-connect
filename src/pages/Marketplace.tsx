import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformCategories, buildCategoryTree, type PlatformCategory } from '@/hooks/usePlatformCategories';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Store, Loader2, Search, MapPin, Package, Star, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface BusinessWithProducts {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  subdomain: string;
  address: string | null;
  is_featured: boolean;
  product_count: number;
  order_count: number;
  created_at: string;
  category_slugs: string[];
}

function BusinessCard({ biz, featured = false }: { biz: BusinessWithProducts; featured?: boolean }) {
  return (
    <Link
      to={`/store/${biz.subdomain}`}
      className={`group bg-card rounded-2xl border overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 ${
        featured ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border/50'
      }`}
    >
      <div className={`h-32 relative flex items-center justify-center ${
        featured ? 'bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5' : 'bg-gradient-to-br from-primary/10 to-accent/10'
      }`}>
        {featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold">
            <Star className="h-3 w-3 fill-current" /> Promovuar
          </div>
        )}
        {biz.logo_url ? (
          <img src={biz.logo_url} alt={biz.name} className="h-20 w-20 rounded-xl object-cover shadow-md" />
        ) : (
          <div className="h-20 w-20 rounded-xl bg-primary/20 flex items-center justify-center">
            <Store className="h-10 w-10 text-primary" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{biz.name}</h3>
        {biz.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{biz.description}</p>}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{biz.product_count} produkte</span>
          {biz.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{biz.address}</span>}
        </div>
        <div className="mt-3 text-xs text-primary font-medium flex items-center gap-1">
          {biz.subdomain}.eblej.com <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const { data: platformCategories = [] } = usePlatformCategories();
  const [businesses, setBusinesses] = useState<BusinessWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState<string | null>(searchParams.get('category') || null);
  const [cityFilter, setCityFilter] = useState<string>('all');
  // Products indexed by business_id for search
  const [productsByBusiness, setProductsByBusiness] = useState<Record<string, { name: string; categoryNames: string[] }[]>>({});

  const { roots, children } = useMemo(() => buildCategoryTree(platformCategories), [platformCategories]);

  useEffect(() => {
    async function load() {
      const [bizRes, orderRes, pcRes, prodRes] = await Promise.all([
        supabase.from('businesses').select('id, name, description, logo_url, subdomain, address, is_featured, created_at').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('orders').select('business_id'),
        supabase.from('product_categories').select('product_id, category_id'),
        supabase.from('products').select('id, name, business_id, is_active').eq('is_active', true),
      ]);

      const bizList = bizRes.data || [];
      const orders = orderRes.data || [];
      const productCategories = pcRes.data || [];
      const allProducts = prodRes.data || [];

      const orderCounts: Record<string, number> = {};
      orders.forEach(o => { orderCounts[o.business_id] = (orderCounts[o.business_id] || 0) + 1; });

      // Build product-to-category-name mapping
      const catIdToName: Record<string, string> = {};
      platformCategories.forEach(c => { catIdToName[c.id] = c.name; });

      const prodCatMap: Record<string, string[]> = {};
      productCategories.forEach(pc => {
        if (!prodCatMap[pc.product_id]) prodCatMap[pc.product_id] = [];
        const name = catIdToName[pc.category_id];
        if (name) prodCatMap[pc.product_id].push(name);
      });

      // Index products by business for search
      const prodIndex: Record<string, { name: string; categoryNames: string[] }[]> = {};
      allProducts.forEach(p => {
        if (!prodIndex[p.business_id]) prodIndex[p.business_id] = [];
        prodIndex[p.business_id].push({ name: p.name, categoryNames: prodCatMap[p.id] || [] });
      });
      setProductsByBusiness(prodIndex);

      // Enrich businesses with counts & category slugs
      const enriched: BusinessWithProducts[] = bizList.map(biz => {
        const bizProds = allProducts.filter(p => p.business_id === biz.id);
        const bizProductIds = bizProds.map(p => p.id);
        const bizCatIds = productCategories
          .filter(pc => bizProductIds.includes(pc.product_id))
          .map(pc => pc.category_id);
        const catSlugs = platformCategories
          .filter(c => bizCatIds.includes(c.id))
          .map(c => c.slug);

        return {
          ...biz,
          is_featured: !!biz.is_featured,
          product_count: bizProds.length,
          order_count: orderCounts[biz.id] || 0,
          created_at: biz.created_at,
          category_slugs: [...new Set(catSlugs)],
        };
      });

      setBusinesses(enriched);
      setLoading(false);
    }
    load();
  }, [platformCategories]);

  const cities = [...new Set(businesses.map(b => b.address?.split(',').pop()?.trim()).filter(Boolean))] as string[];

  // Find selected category and all its subcategory slugs
  const activeCategorySlugs = useMemo(() => {
    if (!activeCategory) return null;
    const cat = platformCategories.find(c => c.slug === activeCategory);
    if (!cat) return null;
    const subs = children(cat.id).map(c => c.slug);
    return [cat.slug, ...subs];
  }, [activeCategory, platformCategories, children]);

  const filtered = businesses.filter(b => {
    const q = search.trim().toLowerCase();
    const matchesBizName = !q || b.name.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q);
    // Also match if any product name or product category name contains the search
    const bizProducts = productsByBusiness[b.id] || [];
    const matchesProduct = q ? bizProducts.some(p => 
      p.name.toLowerCase().includes(q) || 
      p.categoryNames.some(cn => cn.toLowerCase().includes(q))
    ) : false;
    const matchesSearch = matchesBizName || matchesProduct;
    const matchesCategory = !activeCategorySlugs || b.category_slugs.some(s => activeCategorySlugs.includes(s));
    const matchesCity = cityFilter === 'all' || b.address?.toLowerCase().includes(cityFilter.toLowerCase());
    return matchesSearch && matchesCategory && matchesCity;
  });

  const featuredBusinesses = filtered.filter(b => b.is_featured);
  const regularBusinesses = filtered.filter(b => !b.is_featured);
  const trendingBusinesses = [...regularBusinesses].sort((a, b) => b.order_count - a.order_count).slice(0, 3);
  const newArrivals = [...regularBusinesses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
              Zbulo dyqanet në <span className="text-gradient-primary">eblej.com</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">Shfleto bizneset lokale dhe porosit online direkt nga dyqani i tyre.</p>
            
            <div className="max-w-2xl mx-auto flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Kërko dyqane..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              {cities.length > 0 && (
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[160px]">
                    <MapPin className="h-4 w-4 mr-1" />
                    <SelectValue placeholder="Qyteti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Të gjitha</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Store className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Nuk u gjet asnjë dyqan.</p>
            </div>
          ) : (
            <>
              {featuredBusinesses.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6"><Star className="h-5 w-5 text-primary fill-primary" /><h2 className="text-xl font-bold text-foreground">Dyqane të promovuara</h2></div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredBusinesses.map(biz => <BusinessCard key={biz.id} biz={biz} featured />)}
                  </div>
                </section>
              )}

              {!activeCategory && trendingBusinesses.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6"><TrendingUp className="h-5 w-5 text-accent" /><h2 className="text-xl font-bold text-foreground">Në trend</h2></div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingBusinesses.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
                  </div>
                </section>
              )}

              {!activeCategory && newArrivals.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6"><Clock className="h-5 w-5 text-success" /><h2 className="text-xl font-bold text-foreground">Të rinj në platformë</h2></div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newArrivals.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
                  </div>
                </section>
              )}

              {regularBusinesses.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <Store className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">
                      {activeCategory ? platformCategories.find(c => c.slug === activeCategory)?.name || 'Dyqane' : 'Të gjitha dyqanet'}
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularBusinesses.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
