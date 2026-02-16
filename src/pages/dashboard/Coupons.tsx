import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Ticket, Loader2, Copy } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  free_delivery: boolean;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function Coupons() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discount_type: 'fixed',
    discount_value: '',
    free_delivery: false,
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
  });

  useEffect(() => {
    if (business) fetchCoupons();
  }, [business]);

  const fetchCoupons = async () => {
    if (!business) return;
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, code }));
  };

  const handleSave = async () => {
    if (!business || !form.code || !form.discount_value) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('coupons').insert({
        business_id: business.id,
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        free_delivery: form.free_delivery,
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      });
      if (error) throw error;
      toast({ title: 'Sukses', description: 'Kuponi u krijua' });
      setDialogOpen(false);
      setForm({ code: '', discount_type: 'fixed', discount_value: '', free_delivery: false, min_order_amount: '', max_uses: '', expires_at: '' });
      fetchCoupons();
    } catch (err: any) {
      toast({ title: 'Gabim', description: err.message || 'Nuk u krijua kuponi', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (id: string, active: boolean) => {
    await supabase.from('coupons').update({ is_active: !active }).eq('id', id);
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Fshi kuponin?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Kuponat</h1>
          <p className="text-muted-foreground mt-1">Krijo kupona zbritjesh për klientët</p>
        </div>
        <Button onClick={() => { setDialogOpen(true); generateCode(); }} className="gap-2">
          <Plus className="h-4 w-4" /> Krijo kupon
        </Button>
      </div>

      <Card className="border-0 shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kodi</TableHead>
                <TableHead>Zbritja</TableHead>
                <TableHead className="hidden sm:table-cell">Min. porosi</TableHead>
                <TableHead className="hidden sm:table-cell">Përdorime</TableHead>
                <TableHead>Aktiv</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : coupons.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nuk ka kupona</TableCell></TableRow>
              ) : coupons.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="font-mono font-bold">{c.code}</span>
                      {c.free_delivery && <Badge variant="secondary" className="text-xs">Free transport</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.discount_type === 'fixed' ? `€${c.discount_value}` : `${c.discount_value}%`}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">€{c.min_order_amount}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</TableCell>
                  <TableCell>
                    <Switch checked={c.is_active} onCheckedChange={() => toggleCoupon(c.id, c.is_active)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteCoupon(c.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Kupon i ri</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kodi</Label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ZBRITJE20" className="font-mono" />
                <Button variant="outline" size="icon" onClick={generateCode} title="Gjenero"><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lloji</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fikse (€)</SelectItem>
                    <SelectItem value="percentage">Përqindje (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vlera</Label>
                <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Min. porosi (€)</Label>
              <Input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Max përdorime (bosh = pa limit)</Label>
              <Input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Pa limit" />
            </div>
            <div className="space-y-2">
              <Label>Skadon më</Label>
              <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label>Transport falas</Label>
              <Switch checked={form.free_delivery} onCheckedChange={v => setForm(f => ({ ...f, free_delivery: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulo</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Krijo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
