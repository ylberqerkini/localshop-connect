import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Users, Phone, MapPin, Mail, Download, FileText, FileSpreadsheet,
  StickyNote, ArrowUpDown, TrendingUp, ShoppingBag, Crown, Eye, Calendar,
  ChevronUp, ChevronDown, Loader2, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  address: string | null;
  email: string | null;
  created_at: string;
  orders_count: number;
  total_spent: number;
}

type SortField = 'name' | 'orders' | 'spent' | 'date';
type SortDir = 'asc' | 'desc';

export default function Customers() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!business) return;
    fetchCustomers();
  }, [business]);

  const fetchCustomers = async () => {
    if (!business) return;
    try {
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customersWithStats = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('total')
            .eq('customer_id', customer.id);

          return {
            ...customer,
            orders_count: orders?.length || 0,
            total_spent: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = customers.filter(customer =>
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'name': return dir * a.full_name.localeCompare(b.full_name);
        case 'orders': return dir * (a.orders_count - b.orders_count);
        case 'spent': return dir * (a.total_spent - b.total_spent);
        case 'date': return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        default: return 0;
      }
    });

    return result;
  }, [customers, searchQuery, sortField, sortDir]);

  // Stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const avgOrderValue = totalRevenue / Math.max(customers.reduce((s, c) => s + c.orders_count, 0), 1);
  const repeatCustomers = customers.filter(c => c.orders_count > 1).length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 ml-1 text-primary" />
      : <ChevronDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const getCustomerTier = (c: Customer) => {
    if (c.total_spent >= 200 || c.orders_count >= 10) return { label: 'VIP', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
    if (c.total_spent >= 50 || c.orders_count >= 3) return { label: 'Besnik', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
    return { label: 'I ri', className: 'bg-muted text-muted-foreground' };
  };

  // Export
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = ['Emri', 'Telefoni', 'Email', 'Adresa', 'Porosi', 'Total shpenzuar', 'Regjistruar'];
    const rows = filteredCustomers.map(c => [
      c.full_name, c.phone, c.email || '', c.address || '',
      c.orders_count, c.total_spent.toFixed(2),
      format(new Date(c.created_at), 'dd/MM/yyyy')
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(csv, `klientët-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv;charset=utf-8');
    toast({ title: 'Sukses', description: 'CSV u eksportua' });
  };

  const exportTxt = () => {
    const text = filteredCustomers.map(c =>
      `👤 ${c.full_name}\n📞 ${c.phone}${c.email ? '\n📧 ' + c.email : ''}${c.address ? '\n📍 ' + c.address : ''}\n🛒 ${c.orders_count} porosi • €${c.total_spent.toFixed(2)} total\n📅 Që nga ${format(new Date(c.created_at), 'dd MMMM yyyy', { locale: sq })}\n${'─'.repeat(40)}`
    ).join('\n\n');
    downloadFile(text, `klientët-${format(new Date(), 'yyyy-MM-dd')}.txt`, 'text/plain;charset=utf-8');
    toast({ title: 'Sukses', description: 'Shënimet u eksportuan' });
  };

  const exportPdf = () => {
    const rows = filteredCustomers.map(c => {
      const tier = getCustomerTier(c);
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:600;">${c.full_name}</div>
          <div style="font-size:12px;color:#6b7280;">${c.email || ''}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${c.phone}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${c.address || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;">${c.orders_count}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">€${c.total_spent.toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
          <span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:500;background:${tier.label === 'VIP' ? '#fef9c3' : tier.label === 'Besnik' ? '#dbeafe' : '#f3f4f6'};color:${tier.label === 'VIP' ? '#854d0e' : tier.label === 'Besnik' ? '#1e40af' : '#6b7280'}">${tier.label}</span>
        </td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Raporti i Klientëve</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;color:#111827;padding:40px;max-width:1100px;margin:auto;}
.header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #111827;}
.header h1{font-size:26px;letter-spacing:-0.5px;}.header .sub{color:#6b7280;font-size:14px;margin-top:4px;}
.stats{display:flex;gap:16px;margin-bottom:28px;}.stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;flex:1;}
.stat .label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;}.stat .value{font-size:20px;font-weight:700;margin-top:4px;}
table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;}
th{text-align:left;padding:12px;background:#f9fafb;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;border-bottom:2px solid #e5e7eb;}
.footer{margin-top:32px;text-align:center;font-size:12px;color:#9ca3af;}@media print{body{padding:20px;}}</style></head><body>
<div class="header"><div><h1>👥 Raporti i Klientëve</h1><div class="sub">${business?.name || ''} • ${format(new Date(), 'dd MMMM yyyy', { locale: sq })}</div></div></div>
<div class="stats">
  <div class="stat"><div class="label">Klientë</div><div class="value">${totalCustomers}</div></div>
  <div class="stat"><div class="label">Të ardhura</div><div class="value">€${totalRevenue.toFixed(2)}</div></div>
  <div class="stat"><div class="label">Kthehen</div><div class="value">${repeatCustomers}</div></div>
</div>
<table><thead><tr><th>Klienti</th><th>Telefoni</th><th>Adresa</th><th style="text-align:center">Porosi</th><th style="text-align:right">Total</th><th style="text-align:center">Tier</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer"><p>${business?.name || ''}</p></div>
<script>window.onload=function(){window.print();}</script></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Klientët</h1>
          <p className="text-muted-foreground mt-1">
            Menaxho dhe analizo klientët e biznesit tënd
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Eksporto
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={exportPdf} className="gap-3 cursor-pointer">
              <FileText className="h-4 w-4 text-red-500" />
              <div><div className="font-medium">PDF</div><div className="text-xs text-muted-foreground">Raport për printim</div></div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportCsv} className="gap-3 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <div><div className="font-medium">Excel (CSV)</div><div className="text-xs text-muted-foreground">Spreadsheet format</div></div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportTxt} className="gap-3 cursor-pointer">
              <StickyNote className="h-4 w-4 text-yellow-500" />
              <div><div className="font-medium">Shënime (TXT)</div><div className="text-xs text-muted-foreground">Tekst i thjeshtë</div></div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Klientë total</p>
              <p className="text-xl font-bold">{loading ? '—' : totalCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Të ardhura totale</p>
              <p className="text-xl font-bold">€{loading ? '—' : totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Mesatare/porosi</p>
              <p className="text-xl font-bold">€{loading ? '—' : avgOrderValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Klientë besnikë</p>
              <p className="text-xl font-bold">{loading ? '—' : repeatCustomers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Sort */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kërko sipas emrit, telefonit ose emailit..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={`${sortField}-${sortDir}`} onValueChange={(v) => {
              const [f, d] = v.split('-') as [SortField, SortDir];
              setSortField(f); setSortDir(d);
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rendit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Më të rinjtë</SelectItem>
                <SelectItem value="date-asc">Më të vjetrit</SelectItem>
                <SelectItem value="spent-desc">Shpenzues më të mëdhenj</SelectItem>
                <SelectItem value="spent-asc">Shpenzues më të vegjël</SelectItem>
                <SelectItem value="orders-desc">Më shumë porosi</SelectItem>
                <SelectItem value="name-asc">Emri A-Z</SelectItem>
                <SelectItem value="name-desc">Emri Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Duke ngarkuar...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nuk ka klientë</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Klientët do të shfaqen këtu automatikisht pasi të bëjnë porosinë e parë
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button onClick={() => toggleSort('name')} className="flex items-center hover:text-foreground transition-colors">
                      Klienti <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead>Kontakti</TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort('orders')} className="flex items-center hover:text-foreground transition-colors">
                      Porosi <SortIcon field="orders" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort('spent')} className="flex items-center hover:text-foreground transition-colors">
                      Total <SortIcon field="spent" />
                    </button>
                  </TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort('date')} className="flex items-center hover:text-foreground transition-colors">
                      Regjistruar <SortIcon field="date" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const tier = getCustomerTier(customer);
                  return (
                    <TableRow key={customer.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCustomer(customer)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            {tier.label === 'VIP' ? (
                              <Crown className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <span className="text-sm font-semibold text-primary">
                                {customer.full_name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{customer.full_name}</p>
                            {customer.email && (
                              <p className="text-xs text-muted-foreground">{customer.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.phone}
                          </div>
                          {customer.address && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{customer.orders_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">€{customer.total_spent.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tier.className}>
                          {tier.label === 'VIP' && <Crown className="h-3 w-3 mr-1" />}
                          {tier.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: sq })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Result count */}
      {!loading && customers.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Duke shfaqur {filteredCustomers.length} nga {customers.length} klientë
        </p>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detajet e klientit</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (() => {
            const tier = getCustomerTier(selectedCustomer);
            return (
              <div className="space-y-5">
                {/* Profile card */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                    {tier.label === 'VIP' ? (
                      <Crown className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <span className="text-xl font-bold text-primary">
                        {selectedCustomer.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedCustomer.full_name}</h3>
                    <Badge variant="secondary" className={tier.className + ' mt-1'}>
                      {tier.label === 'VIP' && <Crown className="h-3 w-3 mr-1" />}
                      {tier.label}
                    </Badge>
                  </div>
                </div>

                {/* Contact info */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Klient që nga {format(new Date(selectedCustomer.created_at), 'dd MMMM yyyy', { locale: sq })}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{selectedCustomer.orders_count}</p>
                    <p className="text-xs text-muted-foreground mt-1">Porosi gjithsej</p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">€{selectedCustomer.total_spent.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total shpenzuar</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
