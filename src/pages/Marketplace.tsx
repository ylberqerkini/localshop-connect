import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Store, Loader2, Search, MapPin, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BusinessWithProducts {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  subdomain: string;
  address: string | null;
  product_count: number;
}

export default function Marketplace() {
  const [businesses, setBusinesses] = useState<BusinessWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data: bizList } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, subdomain, address')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!bizList) {
        setLoading(false);
        return;
      }

      // Get product counts per business
      const enriched: BusinessWithProducts[] = await Promise.all(
        bizList.map(async (biz) => {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', biz.id)
            .eq('is_active', true);
          return { ...biz, product_count: count ?? 0 };
        })
      );

      setBusinesses(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? businesses.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.description?.toLowerCase().includes(search.toLowerCase())
      )
    : businesses;

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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Shfleto bizneset lokale dhe porosit online direkt nga dyqani i tyre.
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kërko dyqane..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Store className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Nuk u gjet asnjë dyqan.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(biz => (
                <Link
                  key={biz.id}
                  to={`/store/${biz.subdomain}`}
                  className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Logo area */}
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    {biz.logo_url ? (
                      <img
                        src={biz.logo_url}
                        alt={biz.name}
                        className="h-20 w-20 rounded-xl object-cover shadow-md"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Store className="h-10 w-10 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {biz.name}
                    </h3>
                    {biz.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {biz.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {biz.product_count} produkte
                      </span>
                      {biz.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {biz.address}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-primary font-medium">
                      {biz.subdomain}.eblej.com →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
