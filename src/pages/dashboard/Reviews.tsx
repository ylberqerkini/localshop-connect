import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Star, Check, X, Loader2, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  product_name?: string;
}

export default function Reviews() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business) fetchReviews();
  }, [business]);

  const fetchReviews = async () => {
    if (!business) return;
    const { data } = await supabase
      .from('reviews')
      .select('*, products(name)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

    const mapped = (data || []).map((r: any) => ({
      ...r,
      product_name: r.products?.name || 'Pa produkt',
    }));
    setReviews(mapped);
    setLoading(false);
  };

  const toggleApproval = async (id: string, approved: boolean) => {
    await supabase.from('reviews').update({ is_approved: !approved }).eq('id', id);
    toast({ title: !approved ? 'Aprovuar' : 'Çaktivizuar' });
    fetchReviews();
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Fshi këtë vlerësim?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    fetchReviews();
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Vlerësimet</h1>
        <p className="text-muted-foreground mt-1">Menaxho vlerësimet e klientëve</p>
      </div>

      <Card className="border-0 shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klienti</TableHead>
                <TableHead>Produkti</TableHead>
                <TableHead>Vlerësimi</TableHead>
                <TableHead className="hidden sm:table-cell">Komenti</TableHead>
                <TableHead>Statusi</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : reviews.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nuk ka vlerësime ende
                </TableCell></TableRow>
              ) : reviews.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.customer_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.product_name}</TableCell>
                  <TableCell>{renderStars(r.rating)}</TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[200px] truncate text-sm">{r.comment || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_approved ? 'default' : 'secondary'}>
                      {r.is_approved ? 'Aprovuar' : 'Në pritje'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleApproval(r.id, r.is_approved)}>
                        {r.is_approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4 text-success" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteReview(r.id)} className="text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
