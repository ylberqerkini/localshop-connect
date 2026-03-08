import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp, Wallet, Receipt, Truck, Package, Download, FileText,
  FileSpreadsheet, StickyNote, Loader2, ArrowUpRight, ArrowDownRight,
  CircleDollarSign, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CommissionLog {
  id: string;
  order_number: string;
  order_total: number;
  commission_amount: number;
  created_at: string;
}

interface Payout {
  id: string;
  amount: number;
  platform_fees: number;
  net_amount: number;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

interface OrderEarning {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  delivery_fee: number | null;
  platform_fee: number;
  discount_amount: number | null;
  status: string;
  created_at: string;
}

export default function Earnings() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<CommissionLog[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [orders, setOrders] = useState<OrderEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    fetchData();
  }, [business]);

  const fetchData = async () => {
    if (!business) return;
    try {
      const [ordersRes, commissionsRes, payoutsRes] = await Promise.all([
        supabase.from('orders').select('id, order_number, total, subtotal, delivery_fee, platform_fee, discount_amount, status, created_at').eq('business_id', business.id).order('created_at', { ascending: false }),
        supabase.from('commission_logs').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('payouts').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
      ]);

      setOrders((ordersRes.data as OrderEarning[]) || []);
      setCommissions((commissionsRes.data as CommissionLog[]) || []);
      setPayouts((payoutsRes.data as Payout[]) || []);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalSubtotal = orders.reduce((s, o) => s + Number(o.subtotal), 0);
    const totalDeliveryFees = orders.reduce((s, o) => s + Number(o.delivery_fee || 0), 0);
    const totalCommissions = orders.reduce((s, o) => s + Number(o.platform_fee || 0), 0);
    const totalDiscounts = orders.reduce((s, o) => s + Number(o.discount_amount || 0), 0);
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const deliveredRevenue = deliveredOrders.reduce((s, o) => s + Number(o.total), 0);

    return {
      totalRevenue,
      totalSubtotal,
      totalDeliveryFees,
      totalCommissions,
      totalDiscounts,
      netEarnings: totalRevenue - totalCommissions,
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length,
      deliveredRevenue,
      avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
    };
  }, [orders]);

  const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Në pritje', variant: 'secondary' },
    processing: { label: 'Në proces', variant: 'outline' },
    completed: { label: 'Përfunduar', variant: 'default' },
    failed: { label: 'Dështuar', variant: 'destructive' },
  };

  const orderStatusLabel: Record<string, string> = {
    pending: 'Në pritje',
    confirmed: 'Konfirmuar',
    shipped: 'Dërguar',
    delivered: 'Dorëzuar',
    cancelled: 'Anuluar',
  };

  // Export helpers
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = ['Nr. Porosisë', 'Nëntotali', 'Transport', 'Zbritje', 'Komisioni', 'Totali', 'Statusi', 'Data'];
    const rows = orders.map(o => [
      o.order_number,
      Number(o.subtotal).toFixed(2),
      Number(o.delivery_fee || 0).toFixed(2),
      Number(o.discount_amount || 0).toFixed(2),
      Number(o.platform_fee).toFixed(2),
      Number(o.total).toFixed(2),
      orderStatusLabel[o.status] || o.status,
      format(new Date(o.created_at), 'dd/MM/yyyy HH:mm'),
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(csv, `fitimet-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv;charset=utf-8');
    toast({ title: 'Sukses', description: 'CSV u eksportua' });
  };

  const exportTxt = () => {
    const header = `📊 RAPORTI I FITIMEVE — ${business?.name || ''}\n📅 ${format(new Date(), 'dd MMMM yyyy', { locale: sq })}\n${'═'.repeat(50)}\n`;
    const summary = `\n💰 Qarkullimi total: €${stats.totalRevenue.toFixed(2)}\n📦 Nëntotali produkteve: €${stats.totalSubtotal.toFixed(2)}\n🚚 Kostoja e postës: €${stats.totalDeliveryFees.toFixed(2)}\n🏷️ Zbritje: -€${stats.totalDiscounts.toFixed(2)}\n📋 Komisione platformë: -€${stats.totalCommissions.toFixed(2)}\n✅ Fitimi neto: €${stats.netEarnings.toFixed(2)}\n${'─'.repeat(50)}\n`;
    const details = orders.map(o =>
      `#${o.order_number} | €${Number(o.total).toFixed(2)} | Transport: €${Number(o.delivery_fee || 0).toFixed(2)} | Komisioni: -€${Number(o.platform_fee).toFixed(2)} | ${orderStatusLabel[o.status] || o.status} | ${format(new Date(o.created_at), 'dd MMM yyyy')}`
    ).join('\n');
    downloadFile(header + summary + '\n' + details, `fitimet-${format(new Date(), 'yyyy-MM-dd')}.txt`, 'text/plain;charset=utf-8');
    toast({ title: 'Sukses', description: 'Shënimet u eksportuan' });
  };

  const exportPdf = () => {
    const rows = orders.map(o => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:500;">#${o.order_number}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">€${Number(o.subtotal).toFixed(2)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">€${Number(o.delivery_fee || 0).toFixed(2)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;">-€${Number(o.platform_fee).toFixed(2)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">€${Number(o.total).toFixed(2)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${orderStatusLabel[o.status] || o.status}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${format(new Date(o.created_at), 'dd MMM yyyy')}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Raporti i Fitimeve</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;color:#111827;padding:40px;max-width:1100px;margin:auto;}
.header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #111827;}
.header h1{font-size:26px;}.header .sub{color:#6b7280;font-size:14px;margin-top:4px;}
.stats{display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;}.stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px 18px;flex:1;min-width:140px;}
.stat .label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;}.stat .value{font-size:18px;font-weight:700;margin-top:4px;}
.stat .value.green{color:#16a34a;}.stat .value.red{color:#dc2626;}
table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;}
th{text-align:left;padding:10px;background:#f9fafb;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;border-bottom:2px solid #e5e7eb;}
.footer{margin-top:32px;text-align:center;font-size:12px;color:#9ca3af;}@media print{body{padding:20px;}}</style></head><body>
<div class="header"><div><h1>💰 Raporti i Fitimeve</h1><div class="sub">${business?.name || ''} • ${format(new Date(), 'dd MMMM yyyy', { locale: sq })}</div></div></div>
<div class="stats">
  <div class="stat"><div class="label">Qarkullimi</div><div class="value">€${stats.totalRevenue.toFixed(2)}</div></div>
  <div class="stat"><div class="label">Produkte</div><div class="value">€${stats.totalSubtotal.toFixed(2)}</div></div>
  <div class="stat"><div class="label">Posta</div><div class="value">€${stats.totalDeliveryFees.toFixed(2)}</div></div>
  <div class="stat"><div class="label">Komisione</div><div class="value red">-€${stats.totalCommissions.toFixed(2)}</div></div>
  <div class="stat"><div class="label">Fitimi neto</div><div class="value green">€${stats.netEarnings.toFixed(2)}</div></div>
</div>
<table><thead><tr><th>Nr.</th><th style="text-align:right">Nëntotali</th><th style="text-align:right">Transport</th><th style="text-align:right">Komisioni</th><th style="text-align:right">Totali</th><th>Statusi</th><th>Data</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer"><p>${business?.name || ''} • Gjeneruar automatikisht</p></div>
<script>window.onload=function(){window.print();}</script></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl lg:text-3xl font-bold">Fitimet</h1></div>
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Duke ngarkuar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Fitimet</h1>
          <p className="text-muted-foreground mt-1">Menaxho fitimet dhe pagesat e biznesit tënd</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">Qarkullimi</p>
                <p className="text-lg font-bold">€{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">Produkte</p>
                <p className="text-lg font-bold">€{stats.totalSubtotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground font-medium truncate">Kostoja e postës</p>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Totali i tarifave të transportit nga të gjitha porositë</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-lg font-bold">€{stats.totalDeliveryFees.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">Komisione</p>
                <p className="text-lg font-bold text-destructive">-€{stats.totalCommissions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">Fitimi neto</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">€{stats.netEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium truncate">Mesatare/porosi</p>
                <p className="text-lg font-bold">€{stats.avgOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Banner */}
      <Card className="border-0 shadow-soft bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <span className="font-semibold text-foreground">Përmbledhje:</span>
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
              <span className="text-muted-foreground">Shitje produktesh:</span>
              <span className="font-semibold">€{stats.totalSubtotal.toFixed(2)}</span>
            </span>
            <span className="text-muted-foreground">+</span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-muted-foreground">Posta:</span>
              <span className="font-semibold">€{stats.totalDeliveryFees.toFixed(2)}</span>
            </span>
            <span className="text-muted-foreground">−</span>
            <span className="flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              <span className="text-muted-foreground">Komisione:</span>
              <span className="font-semibold text-destructive">€{stats.totalCommissions.toFixed(2)}</span>
            </span>
            {stats.totalDiscounts > 0 && (
              <>
                <span className="text-muted-foreground">−</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Zbritje:</span>
                  <span className="font-semibold text-destructive">€{stats.totalDiscounts.toFixed(2)}</span>
                </span>
              </>
            )}
            <span className="text-muted-foreground">=</span>
            <span className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-green-600" />
              <span className="font-bold text-green-600 dark:text-green-400">€{stats.netEarnings.toFixed(2)}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Porositë ({orders.length})</TabsTrigger>
          <TabsTrigger value="payouts">Pagesat ({payouts.length})</TabsTrigger>
          <TabsTrigger value="commissions">Komisione ({commissions.length})</TabsTrigger>
        </TabsList>

        {/* Orders breakdown */}
        <TabsContent value="orders">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr. Porosisë</TableHead>
                    <TableHead className="text-right">Nëntotali</TableHead>
                    <TableHead className="text-right">Transport</TableHead>
                    <TableHead className="text-right">Zbritje</TableHead>
                    <TableHead className="text-right">Komisioni</TableHead>
                    <TableHead className="text-right">Totali</TableHead>
                    <TableHead>Statusi</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        Nuk ka porosi ende
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">#{o.order_number}</TableCell>
                        <TableCell className="text-right">€{Number(o.subtotal).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {Number(o.delivery_fee || 0) > 0 ? (
                            <span className="text-orange-600 dark:text-orange-400">€{Number(o.delivery_fee).toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">€0.00</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(o.discount_amount || 0) > 0 ? (
                            <span className="text-destructive">-€{Number(o.discount_amount).toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-destructive font-medium">-€{Number(o.platform_fee).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">€{Number(o.total).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {orderStatusLabel[o.status] || o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(o.created_at), 'dd MMM yyyy', { locale: sq })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts */}
        <TabsContent value="payouts">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Pagesat javore</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periudha</TableHead>
                    <TableHead className="text-right">Qarkullimi</TableHead>
                    <TableHead className="text-right">Komisione</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Statusi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Nuk ka pagesa ende
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">
                          {format(new Date(p.period_start), 'dd MMM', { locale: sq })} — {format(new Date(p.period_end), 'dd MMM yyyy', { locale: sq })}
                        </TableCell>
                        <TableCell className="text-right">€{Number(p.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-destructive">-€{Number(p.platform_fees).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">€{Number(p.net_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={statusLabel[p.status]?.variant || 'secondary'}>
                            {statusLabel[p.status]?.label || p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions */}
        <TabsContent value="commissions">
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Historiku i komisioneve</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr. Porosisë</TableHead>
                    <TableHead className="text-right">Totali porosisë</TableHead>
                    <TableHead className="text-right">Komisioni</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        Nuk ka komisione ende
                      </TableCell>
                    </TableRow>
                  ) : (
                    commissions.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">#{c.order_number}</TableCell>
                        <TableCell className="text-right">€{Number(c.order_total).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-destructive font-medium">-€{Number(c.commission_amount).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(c.created_at), 'dd MMM yyyy HH:mm', { locale: sq })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
