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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Store, ShoppingCart, Loader2, LayoutDashboard, LogOut, Ban, CheckCircle, Megaphone, Plus, Trash2, Users, Tag, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCategoryIcon } from '@/lib/categoryIcons';

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

interface PlatformCat {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function AdminDashboard() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allCategories, setAllCategories] = useState<PlatformCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ orders: 0, fees: 0, revenue: 0, sellers: 0, activeSellers: 0 });
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<PlatformCat | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', parent_id: '', icon: '', sort_order: '0' });
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [ordersRes, bizRes, annRes, catRes] = await Promise.all([
      supabase.from('orders').select('business_id, total, platform_fee'),
      supabase.from('businesses').select('id, name, subdomain, is_active, is_suspended, owner_id'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('platform_categories').select('*').order('sort_order'),
    ]);

    const orders = ordersRes.data || [];
    const bizList = bizRes.data || [];
    setAnnouncements((annRes.data as Announcement[]) || []);
    setAllCategories((catRes.data as PlatformCat[]) || []);

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

  // Category management
  const openCatDialog = (cat?: PlatformCat) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, slug: cat.slug, parent_id: cat.parent_id || '', icon: cat.icon || '', sort_order: String(cat.sort_order) });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', slug: '', parent_id: '', icon: '', sort_order: '0' });
    }
    setCatDialog(true);
  };

  const saveCat = async () => {
    if (!catForm.name || !catForm.slug) return;
    const payload = {
      name: catForm.name,
      slug: catForm.slug,
      parent_id: catForm.parent_id || null,
      icon: catForm.icon || null,
      sort_order: parseInt(catForm.sort_order) || 0,
    };
    if (editingCat) {
      await supabase.from('platform_categories').update(payload).eq('id', editingCat.id);
      toast({ title: 'Kategoria u përditësua' });
    } else {
      await supabase.from('platform_categories').insert(payload);
      toast({ title: 'Kategoria u krijua' });
    }
    setCatDialog(false);
    fetchData();
  };

  const toggleCatActive = async (cat: PlatformCat) => {
    await supabase.from('platform_categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    fetchData();
  };

  const rootCategories = allCategories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => allCategories.filter(c => c.parent_id === parentId);

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
            <TabsTrigger value="categories">Kategoritë</TabsTrigger>
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

          <TabsContent value="categories">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openCatDialog()} className="gap-2">
                <Plus className="h-4 w-4" /> Shto kategori
              </Button>
            </div>
            <Card className="border-0 shadow-soft">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emri</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Prindi</TableHead>
                      <TableHead className="text-center">Rendi</TableHead>
                      <TableHead>Statusi</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rootCategories.map(root => (
                      <>
                        <TableRow key={root.id} className="bg-muted/30">
                          <TableCell className="font-semibold flex items-center gap-2">
                            {(() => { const Icon = getCategoryIcon(root.icon); return <Icon className="h-4 w-4 text-primary" />; })()}
                            {root.name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{root.slug}</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell className="text-center">{root.sort_order}</TableCell>
                          <TableCell>
                            <Badge variant={root.is_active ? 'default' : 'secondary'}>{root.is_active ? 'Aktiv' : 'Joaktiv'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => openCatDialog(root)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleCatActive(root)}>
                                {root.is_active ? <Ban className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {getChildren(root.id).map(sub => (
                          <TableRow key={sub.id}>
                            <TableCell className="pl-10 text-sm">{sub.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{sub.slug}</TableCell>
                            <TableCell className="text-xs">{root.name}</TableCell>
                            <TableCell className="text-center">{sub.sort_order}</TableCell>
                            <TableCell>
                              <Badge variant={sub.is_active ? 'default' : 'secondary'} className="text-xs">{sub.is_active ? 'Aktiv' : 'Joaktiv'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 justify-end">
                                <Button variant="ghost" size="icon" onClick={() => openCatDialog(sub)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => toggleCatActive(sub)}>
                                  {sub.is_active ? <Ban className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
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

      {/* Announcement dialog */}
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

      {/* Category dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCat ? 'Ndrysho Kategorinë' : 'Kategori e Re'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Emri</Label>
              <Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="p.sh. Veshje Sportive" />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: e.target.value }))} placeholder="p.sh. veshje-sportive" />
            </div>
            <div className="space-y-2">
              <Label>Kategoria prindërore</Label>
              <Select value={catForm.parent_id || 'none'} onValueChange={v => setCatForm(f => ({ ...f, parent_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Asnjë (kryesore)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Asnjë (kryesore)</SelectItem>
                  {rootCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ikona</Label>
                <Input value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} placeholder="p.sh. shirt" />
              </div>
              <div className="space-y-2">
                <Label>Rendi</Label>
                <Input type="number" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Anulo</Button>
            <Button onClick={saveCat}>{editingCat ? 'Ruaj' : 'Krijo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
