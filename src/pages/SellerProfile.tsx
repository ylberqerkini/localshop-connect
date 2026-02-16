import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Store, MapPin, Star, Users, Heart, Package, Loader2, ExternalLink } from 'lucide-react';

interface SellerData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  subdomain: string;
  business_category: string;
  is_featured: boolean;
}

export default function SellerProfile() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const followerId = typeof window !== 'undefined'
    ? localStorage.getItem('eblej_follower_id') || (() => { const id = crypto.randomUUID(); localStorage.setItem('eblej_follower_id', id); return id; })()
    : '';

  useEffect(() => {
    if (subdomain) load();
  }, [subdomain]);

  async function load() {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, description, logo_url, address, subdomain, business_category, is_featured')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .maybeSingle();

    if (!biz) { setLoading(false); return; }
    setSeller(biz as SellerData);

    const [prodRes, follRes, revRes, followCheck] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('business_id', biz.id).eq('is_active', true),
      supabase.from('followers').select('id', { count: 'exact', head: true }).eq('business_id', biz.id),
      supabase.from('reviews').select('rating').eq('business_id', biz.id).eq('is_approved', true),
      supabase.from('followers').select('id').eq('business_id', biz.id).eq('follower_identifier', followerId).maybeSingle(),
    ]);

    setProductCount(prodRes.count || 0);
    setFollowerCount(follRes.count || 0);
    setIsFollowing(!!followCheck.data);

    const ratings = (revRes.data || []).map((r: any) => r.rating);
    setReviewCount(ratings.length);
    setAvgRating(ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0);

    setLoading(false);
  }

  const toggleFollow = async () => {
    if (!seller) return;
    if (isFollowing) {
      await supabase.from('followers').delete().eq('business_id', seller.id).eq('follower_identifier', followerId);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
    } else {
      await supabase.from('followers').insert({ business_id: seller.id, follower_identifier: followerId });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-32 gap-4">
          <Store className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Shitësi nuk u gjet</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-4 overflow-hidden">
              {seller.logo_url ? (
                <img src={seller.logo_url} alt={seller.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="h-12 w-12 text-primary" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{seller.name}</h1>
            {seller.is_featured && (
              <Badge className="mt-2 gap-1"><Star className="h-3 w-3 fill-current" /> I promovuar</Badge>
            )}
            {seller.description && (
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{seller.description}</p>
            )}
            {seller.address && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {seller.address}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Produkte', value: productCount, icon: Package },
              { label: 'Ndjekës', value: followerCount, icon: Users },
              { label: 'Vlerësim', value: avgRating ? avgRating.toFixed(1) : '—', icon: Star },
              { label: 'Recensione', value: reviewCount, icon: Heart },
            ].map(s => (
              <div key={s.label} className="text-center p-4 bg-card rounded-xl border border-border/50">
                <s.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center mb-8">
            <Button onClick={toggleFollow} variant={isFollowing ? 'outline' : 'default'} className="gap-2">
              <Heart className={`h-4 w-4 ${isFollowing ? 'fill-primary text-primary' : ''}`} />
              {isFollowing ? 'Ndjek' : 'Ndiq'}
            </Button>
            <Link to={`/store/${seller.subdomain}`}>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" /> Vizito dyqanin
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
