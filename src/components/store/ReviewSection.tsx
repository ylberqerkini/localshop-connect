import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function ReviewSection({ productId, businessId }: { productId: string; businessId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from('reviews')
      .select('id, customer_name, rating, comment, created_at')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews((data as Review[]) || []));
  }, [productId]);

  const submit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      business_id: businessId,
      customer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Gabim', variant: 'destructive' });
    } else {
      toast({ title: 'Faleminderit!', description: 'Vlerësimi do shfaqet pasi të aprovohet.' });
      setShowForm(false);
      setName(''); setComment(''); setRating(5);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-foreground">Vlerësimet</h3>
          {avgRating && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {avgRating} ({reviews.length})
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Anulo' : 'Shkruaj vlerësim'}
        </Button>
      </div>

      {showForm && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
          <Input placeholder="Emri juaj" value={name} onChange={e => setName(e.target.value)} maxLength={100} />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setRating(i)} className="p-1">
                <Star className={`h-6 w-6 transition-colors ${i <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
              </button>
            ))}
          </div>
          <Textarea placeholder="Komenti juaj (opsional)" value={comment} onChange={e => setComment(e.target.value)} rows={2} maxLength={500} />
          <Button onClick={submit} disabled={submitting || !name.trim()} className="gap-2">
            <Send className="h-4 w-4" /> Dërgo
          </Button>
        </div>
      )}

      {reviews.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">Nuk ka vlerësime ende. Bëhu i pari!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="border border-border/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{r.customer_name}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`h-3 w-3 ${i <= r.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
