import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Heart, Package, User, LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function BuyerAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch profile
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['buyer-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch wishlist with product details
  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['buyer-wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('wishlists')
        .select('*, products(id, name, price, image_url, businesses(name, subdomain))')
        .eq('user_identifier', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch order history by matching customer email
  const { data: orders = [] } = useQuery({
    queryKey: ['buyer-orders', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Find customer records by email
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email);
      if (!customers?.length) return [];
      const customerIds = customers.map(c => c.id);
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*), businesses(name, subdomain)')
        .in('customer_id', customerIds)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.email,
  });

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [city, setCity] = useState(profile?.city || '');
  const [saving, setSaving] = useState(false);

  // Sync form when profile loads
  useState(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
    }
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const profileData = { full_name: fullName, phone, address, city, user_id: user.id };
    
    if (profile) {
      await supabase.from('profiles').update(profileData).eq('user_id', user.id);
    } else {
      await supabase.from('profiles').insert(profileData);
    }
    
    await refetchProfile();
    setSaving(false);
    toast({ title: 'Profili u ruajt me sukses!' });
  };

  const removeFromWishlist = async (wishlistId: string) => {
    await supabase.from('wishlists').delete().eq('id', wishlistId);
    toast({ title: 'U hoq nga lista e dëshirave' });
  };

  const statusLabels: Record<string, string> = {
    pending: 'Në pritje',
    confirmed: 'Konfirmuar',
    shipped: 'Dërguar',
    delivered: 'Dorëzuar',
    cancelled: 'Anuluar',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Kthehu
          </Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate('/'); }}>
            <LogOut className="h-4 w-4 mr-2" />
            Dil
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Llogaria ime</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>

        <Tabs defaultValue="wishlist">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="wishlist" className="gap-2">
              <Heart className="h-4 w-4" />
              Dëshirat ({wishlistItems.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" />
              Porositë ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profili
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wishlist" className="mt-6">
            {wishlistItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nuk keni produkte në listën e dëshirave</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to="/marketplace">Shfletoni produktet</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {wishlistItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      {item.products?.image_url && (
                        <img src={item.products.image_url} alt={item.products.name} className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.products?.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.products?.businesses?.name}</p>
                        <p className="text-primary font-semibold">€{item.products?.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/store/${item.products?.businesses?.subdomain}/product/${item.products?.id}`}>Shiko</Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeFromWishlist(item.id)}>
                          <Heart className="h-4 w-4 fill-destructive text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nuk keni porosi të mëparshme</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to="/marketplace">Fillo blerjen</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map((order: any) => (
                  <Card key={order.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">#{order.order_number}</CardTitle>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">
                        {order.businesses?.name} • {format(new Date(order.created_at), 'dd/MM/yyyy')}
                      </p>
                      <div className="text-sm space-y-1">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.product_name} × {item.quantity}</span>
                            <span>€{item.total}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t mt-3 pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>€{order.total}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informacionet e profilit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Emri i plotë</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Emri juaj" />
                </div>
                <div className="space-y-2">
                  <Label>Telefoni</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+383 4X XXX XXX" />
                </div>
                <div className="space-y-2">
                  <Label>Adresa</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Adresa juaj" />
                </div>
                <div className="space-y-2">
                  <Label>Qyteti</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Prishtinë" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ruaj profilin
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
