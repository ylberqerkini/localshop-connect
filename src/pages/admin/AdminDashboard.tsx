import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Store, ShoppingCart, Loader2, LayoutDashboard, LogOut, Ban, CheckCircle, Megaphone, Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessRow {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
  is_suspended: boolean;
  owner_id: string;
  total_orders: number;
  total_fees: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ orders: 0, fees: 0, revenue: 0, sellers: 0, activeSellers: 0 });
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [ordersRes, bizRes, annRes] = await Promise.all([
      supabase.from('orders').select('business_id, total, platform_fee'),
      supabase.from('businesses').select('id, name, subdomain, is_active, is_suspended, owner_id'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    ]);

    const orders = ordersRes.data || [];
    const bizList = bizRes.data || [];
    setAnnouncements((annRes.data as Announcement[]) || []);

    const bizMap: Record<string, { orders: number; fees: number }> = {};
    orders.forEach(o => {
      if (!bizMap[o.business_id]) bizMap[o.business_id] = { orders: 0, fees: 0 };
      bizMap[o.business_id].orders += 1;
      bizMap[o.business_id].fees += Number(o.platform_fee || 0);
    });

    const enriched: BusinessRow[] = bizList.map(b => ({
      ...b,
      is_suspended: (b as any).is_suspended || false,
      total_orders: bizMap[b.id]?.orders || 0,
      total_fees: bizMap[b.id]?.fees || 0,
    }));

    setBusinesses(enriched.sort((a, b) => b.total_fees - a.total_fees));
    setTotals({
      orders: orders.length,
      fees: orders.reduce((s, o) => s + Number(o.platform_fee || 0), 0),
      revenue: orders.reduce((s, o) => s + Number(o.total), 0),
      sellers: bizList.length,
      activeSellers: bizList.filter(b => b.is_active).length,
    });
    setLoading(false);
  };

  const toggleSuspend = async (biz: BusinessRow) => {
    const newVal = !biz.is_suspended;
    await supabase.from('businesses').update({ is_suspended: newVal, is_active: !newVal } as any).eq('id', biz.id);
    toast({ title: newVal ? 'Biznesi u pezullua' : 'Biznesi u aktivizua' });
    fetchData();
  };

  const createAnnouncement = async () => {
    if (!announcementForm.title) return;
    await supabase.from('announcements').insert(announcementForm);
    setAnnouncementDialog(false);
    setAnnouncementForm({ title: '', content: '' });
    toast({ title: 'Njoftimi u krijua' });
    fetchData();
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    fetchData();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Porosi totale', value: totals.orders, icon: ShoppingCart },
            { label: 'Tarifa totale', value: `€${totals.fees.toFixed(2)}`, icon: DollarSign },
            { label: 'Qarkullimi', value: `€${totals.revenue.toFixed(2)}`, icon: DollarSign },
            { label: 'Shitës total', value: totals.sellers, icon: Users },
            { label: 'Shitës aktiv', value: totals.activeSellers, icon: Store },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-soft">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="sellers">
          <TabsList>
            <TabsTrigger value="sellers">Shitësit</TabsTrigger>
            <TabsTrigger value="announcements">Njoftimet</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <Card className="border-0 shadow-soft">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Biznesi</TableHead>
                      <TableHead>Subdomain</TableHead>
                      <TableHead className="text-center">Porosi</TableHead>
                      <TableHead className="text-right">Tarifa</TableHead>
                      <TableHead>Statusi</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map(biz => (
                      <TableRow key={biz.id}>
                        <TableCell className="font-medium">{biz.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{biz.subdomain}.eblej.com</TableCell>
                        <TableCell className="text-center">{biz.total_orders}</TableCell>
                        <TableCell className="text-right font-semibold">€{biz.total_fees.toFixed(2)}</TableCell>
                        <TableCell>
                          {biz.is_suspended ? (
                            <Badge variant="destructive">Pezulluar</Badge>
                          ) : biz.is_active ? (
                            <Badge variant="default">Aktiv</Badge>
                          ) : (
                            <Badge variant="secondary">Joaktiv</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => toggleSuspend(biz)} className={biz.is_suspended ? 'text-success' : 'text-destructive'}>
                            {biz.is_suspended ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setAnnouncementDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Krijo njoftim
              </Button>
            </div>
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <Card className="border-0 shadow-soft"><CardContent className="py-8 text-center text-muted-foreground">Nuk ka njoftime</CardContent></Card>
              ) : announcements.map(a => (
                <Card key={a.id} className="border-0 shadow-soft">
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{a.title}</h3>
                        <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-xs">
                          {a.is_active ? 'Aktiv' : 'Joaktiv'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteAnnouncement(a.id)} className="text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Njoftim i ri</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titulli</Label>
              <Input value={announcementForm.title} onChange={e => setAnnouncementForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Përmbajtja</Label>
              <Textarea value={announcementForm.content} onChange={e => setAnnouncementForm(f => ({ ...f, content: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialog(false)}>Anulo</Button>
            <Button onClick={createAnnouncement}>Krijo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
