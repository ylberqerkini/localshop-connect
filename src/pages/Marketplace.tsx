import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Store, Loader2, Search, MapPin, Package, Star, ArrowRight, UtensilsCrossed, Shirt, Cpu, ShoppingCart, Pill, Sparkles, Wrench, MoreHorizontal, TrendingUp, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BusinessWithProducts {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  subdomain: string;
  address: string | null;
  is_featured: boolean;
  business_category: string;
  product_count: number;
  order_count: number;
  created_at: string;
}

const CATEGORIES: Record<string, { label: string; icon: React.ElementType }> = {
  restaurant: { label: 'Restorante', icon: UtensilsCrossed },
  clothing: { label: 'Veshje', icon: Shirt },
  electronics: { label: 'Elektronikë', icon: Cpu },
  market: { label: 'Market', icon: ShoppingCart },
  pharmacy: { label: 'Farmaci', icon: Pill },
  beauty: { label: 'Bukuri', icon: Sparkles },
  services: { label: 'Shërbime', icon: Wrench },
  other: { label: 'Të tjera', icon: MoreHorizontal },
};

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
  const [businesses, setBusinesses] = useState<BusinessWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const [bizRes, orderRes] = await Promise.all([
        supabase.from('businesses').select('id, name, description, logo_url, subdomain, address, is_featured, business_category, created_at').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('orders').select('business_id'),
      ]);

      const bizList = bizRes.data || [];
      const orders = orderRes.data || [];

      // Count orders per business
      const orderCounts: Record<string, number> = {};
      orders.forEach(o => { orderCounts[o.business_id] = (orderCounts[o.business_id] || 0) + 1; });

      const enriched: BusinessWithProducts[] = await Promise.all(
        bizList.map(async (biz) => {
          const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('business_id', biz.id).eq('is_active', true);
          return {
            ...biz,
            is_featured: !!biz.is_featured,
            business_category: (biz as any).business_category || 'other',
            product_count: count ?? 0,
            order_count: orderCounts[biz.id] || 0,
            created_at: biz.created_at,
          };
        })
      );

      setBusinesses(enriched);
      setLoading(false);
    }
    load();
  }, []);

  // Extract unique cities from addresses
  const cities = [...new Set(businesses.map(b => b.address?.split(',').pop()?.trim()).filter(Boolean))] as string[];

  const filtered = businesses.filter(b => {
    const matchesSearch = !search.trim() || b.name.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || b.business_category === activeCategory;
    const matchesCity = cityFilter === 'all' || b.address?.toLowerCase().includes(cityFilter.toLowerCase());
    return matchesSearch && matchesCategory && matchesCity;
  });

  const featuredBusinesses = filtered.filter(b => b.is_featured);
  const regularBusinesses = filtered.filter(b => !b.is_featured);

  // Trending = most orders
  const trendingBusinesses = [...regularBusinesses].sort((a, b) => b.order_count - a.order_count).slice(0, 3);
  // New arrivals = most recently created
  const newArrivals = [...regularBusinesses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);

  const groupedByCategory = Object.entries(CATEGORIES).reduce<Record<string, BusinessWithProducts[]>>(
    (acc, [key]) => {
      const bizsInCat = regularBusinesses.filter(b => b.business_category === key);
      if (bizsInCat.length > 0) acc[key] = bizsInCat;
      return acc;
    }, {}
  );

  const availableCategories = Object.keys(CATEGORIES).filter(key => businesses.some(b => b.business_category === key));

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

            {availableCategories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant={activeCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(null)} className="rounded-full">Të gjitha</Button>
                {availableCategories.map(key => {
                  const cat = CATEGORIES[key];
                  const Icon = cat.icon;
                  return (
                    <Button key={key} variant={activeCategory === key ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(activeCategory === key ? null : key)} className="rounded-full gap-1.5">
                      <Icon className="h-3.5 w-3.5" /> {cat.label}
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
              {/* Featured */}
              {featuredBusinesses.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6"><Star className="h-5 w-5 text-primary fill-primary" /><h2 className="text-xl font-bold text-foreground">Dyqane të promovuara</h2></div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredBusinesses.map(biz => <BusinessCard key={biz.id} biz={biz} featured />)}
                  </div>
                </section>
              )}

              {/* Trending */}
              {!activeCategory && trendingBusinesses.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6"><TrendingUp className="h-5 w-5 text-accent" /><h2 className="text-xl font-bold text-foreground">Në trend</h2></div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingBusinesses.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
                  </div>
                </section>
              )}

              {/* New Arrivals */}
              {!activeCategory && newArrivals.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-2 mb-6"><Clock className="h-5 w-5 text-success" /><h2 className="text-xl font-bold text-foreground">Të rinj në platformë</h2></div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newArrivals.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
                  </div>
                </section>
              )}

              {/* Categories */}
              {activeCategory ? (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    {(() => { const Icon = CATEGORIES[activeCategory]?.icon || Store; return <Icon className="h-5 w-5 text-primary" />; })()}
                    <h2 className="text-xl font-bold text-foreground">{CATEGORIES[activeCategory]?.label || activeCategory}</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularBusinesses.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
                  </div>
                </section>
              ) : (
                Object.entries(groupedByCategory).map(([catKey, bizList]) => {
                  const cat = CATEGORIES[catKey];
                  const Icon = cat?.icon || Store;
                  return (
                    <section key={catKey} className="mb-12">
                      <div className="flex items-center gap-2 mb-6"><Icon className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold text-foreground">{cat?.label || catKey}</h2></div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bizList.map(biz => <BusinessCard key={biz.id} biz={biz} />)}
                      </div>
                    </section>
                  );
                })
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
