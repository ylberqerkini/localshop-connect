import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useBusiness } from '@/hooks/useBusiness';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, Truck, CreditCard, ExternalLink, Bell, Star } from 'lucide-react';

export default function Settings() {
  const { business, updateBusiness } = useBusiness();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    delivery_price: '',
    cash_on_delivery: true,
    email_notifications: true,
    is_featured: false,
    logo_url: ''
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        description: business.description || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address || '',
        delivery_price: String(business.delivery_price || 0),
        cash_on_delivery: business.cash_on_delivery,
        email_notifications: (business as any).email_notifications ?? true,
        is_featured: (business as any).is_featured ?? false,
        logo_url: business.logo_url || ''
      });
    }
  }, [business]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateBusiness({
        name: formData.name,
        description: formData.description || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        delivery_price: parseFloat(formData.delivery_price) || 0,
        cash_on_delivery: formData.cash_on_delivery,
        logo_url: formData.logo_url || null,
        email_notifications: formData.email_notifications,
        is_featured: formData.is_featured,
      } as any);

      if (error) throw error;

      toast({
        title: 'Sukses',
        description: 'Cilësimet u ruajtën'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Gabim',
        description: 'Nuk u ruajtën cilësimet',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!business) {
    return (
      <div className="text-center py-12">Duke ngarkuar...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Cilësimet</h1>
        <p className="text-muted-foreground mt-1">
          Menaxho informacionin e biznesit tënd
        </p>
      </div>

      {/* Store info */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle>Informacioni i dyqanit</CardTitle>
          </div>
          <CardDescription>
            Informacioni bazë që shfaqet në dyqanin tënd online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Emri i biznesit</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                value={business.subdomain}
                disabled
                className="bg-muted"
              />
              <a
                href={`https://${business.subdomain}.eblej.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Subdomain nuk mund të ndryshohet
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Përshkrimi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Përshkruani biznesin tuaj..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">URL e logos</Label>
            <Input
              id="logo"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Informacioni i kontaktit</CardTitle>
          <CardDescription>
            Si mund të kontaktojnë klientët biznesin tuaj
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@shembull.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoni</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+383 44 123 456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresa</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rruga, Qyteti"
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery settings */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle>Dërgesa</CardTitle>
          </div>
          <CardDescription>
            Cilësimet e dërgesës dhe pagesës
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delivery_price">Çmimi i dërgesës (€)</Label>
            <Input
              id="delivery_price"
              type="number"
              step="0.01"
              value={formData.delivery_price}
              onChange={(e) => setFormData({ ...formData, delivery_price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Pagesa me para në dorë</p>
                <p className="text-sm text-muted-foreground">
                  Lejo klientët të paguajnë me para në dorë
                </p>
              </div>
            </div>
            <Switch
              checked={formData.cash_on_delivery}
              onCheckedChange={(checked) => setFormData({ ...formData, cash_on_delivery: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Njoftimet</CardTitle>
          </div>
          <CardDescription>
            Merr njoftime kur vjen një porosi e re
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Njoftime me email</p>
                <p className="text-sm text-muted-foreground">
                  Merr email kur vjen një porosi e re
                </p>
              </div>
            </div>
            <Switch
              checked={formData.email_notifications}
              onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Featured / Promoted */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <CardTitle>Promovimi</CardTitle>
          </div>
          <CardDescription>
            Shfaq dyqanin tënd në seksionin e promovuar të marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Dyqan i promovuar</p>
                <p className="text-sm text-muted-foreground">
                  Shfaqet në krye të faqes së dyqaneve
                </p>
              </div>
            </div>
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ruaj ndryshimet
        </Button>
      </div>
    </div>
  );
}
