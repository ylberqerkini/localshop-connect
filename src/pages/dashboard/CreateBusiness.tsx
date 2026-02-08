import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const businessSchema = z.object({
  name: z.string().min(2, 'Emri duhet të ketë të paktën 2 karaktere'),
  subdomain: z.string()
    .min(3, 'Subdomain duhet të ketë të paktën 3 karaktere')
    .max(30, 'Subdomain nuk mund të ketë më shumë se 30 karaktere')
    .regex(/^[a-z0-9-]+$/, 'Vetëm shkronja të vogla, numra dhe viza'),
});

export default function CreateBusiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSubdomain = (businessName: string) => {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = businessSchema.safeParse({ name, subdomain });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    if (!user) {
      setError('Duhet të jeni i kyçur për të krijuar biznes');
      return;
    }

    setLoading(true);

    try {
      // Check if subdomain is available
      const { data: existing } = await supabase
        .from('businesses')
        .select('id')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (existing) {
        setError('Ky subdomain është i zënë. Zgjidhni një tjetër.');
        setLoading(false);
        return;
      }

      // Create business
      const { error: createError } = await supabase
        .from('businesses')
        .insert({
          owner_id: user.id,
          name,
          subdomain
        });

      if (createError) throw createError;

      toast({
        title: 'Sukses!',
        description: 'Biznesi juaj u krijua me sukses'
      });

      // Refresh the page to load the new business
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error creating business:', err);
      setError('Ndodhi një gabim. Provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Krijo biznesin tënd</CardTitle>
          <CardDescription>
            Plotësoni të dhënat për të krijuar dyqanin tuaj online
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Emri i biznesit</Label>
              <Input
                id="name"
                placeholder="Kafeteria Joni"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSubdomain(generateSubdomain(e.target.value));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center">
                <Input
                  id="subdomain"
                  placeholder="kafeteria-joni"
                  value={subdomain}
                  onChange={(e) => setSubdomain(generateSubdomain(e.target.value))}
                  className="rounded-r-none"
                />
                <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground whitespace-nowrap">
                  .eblej.com
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Kjo do të jetë adresa e dyqanit tuaj online
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Krijo biznesin
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
