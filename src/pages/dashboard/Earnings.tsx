import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Wallet, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';

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

export default function Earnings() {
  const { business } = useBusiness();
  const [commissions, setCommissions] = useState<CommissionLog[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalCommissions: 0, netEarnings: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    fetchData();
  }, [business]);

  const fetchData = async () => {
    if (!business) return;
    try {
      const [ordersRes, commissionsRes, payoutsRes] = await Promise.all([
        supabase.from('orders').select('total, platform_fee').eq('business_id', business.id),
        supabase.from('commission_logs').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('payouts').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
      const totalCommissions = orders.reduce((s, o) => s + Number(o.platform_fee || 0), 0);

      setStats({
        totalRevenue,
        totalCommissions,
        netEarnings: totalRevenue - totalCommissions,
        totalOrders: orders.length,
      });

      setCommissions((commissionsRes.data as CommissionLog[]) || []);
      setPayouts((payoutsRes.data as Payout[]) || []);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Në pritje', variant: 'secondary' },
    processing: { label: 'Në proces', variant: 'outline' },
    completed: { label: 'Përfunduar', variant: 'default' },
    failed: { label: 'Dështuar', variant: 'destructive' },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl lg:text-3xl font-bold">Fitimet</h1><p className="text-muted-foreground mt-1">Duke ngarkuar...</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Fitimet</h1>
        <p className="text-muted-foreground mt-1">Menaxho fitimet dhe pagesat e biznesit tënd</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Qarkullimi total</p>
                <p className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Komisione ({stats.totalOrders} porosi)</p>
                <p className="text-2xl font-bold">-€{stats.totalCommissions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fitimi neto</p>
                <p className="text-2xl font-bold text-primary">€{stats.netEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Komisioni/porosi</p>
                <p className="text-2xl font-bold">€1.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Pagesat javore</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periudha</TableHead>
                <TableHead>Qarkullimi</TableHead>
                <TableHead>Komisione</TableHead>
                <TableHead>Neto</TableHead>
                <TableHead>Statusi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nuk ka pagesa ende
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      {format(new Date(p.period_start), 'dd MMM', { locale: sq })} — {format(new Date(p.period_end), 'dd MMM yyyy', { locale: sq })}
                    </TableCell>
                    <TableCell>€{Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-destructive">-€{Number(p.platform_fees).toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">€{Number(p.net_amount).toFixed(2)}</TableCell>
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

      {/* Commission log */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Historiku i komisioneve</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr. Porosisë</TableHead>
                <TableHead>Totali porosisë</TableHead>
                <TableHead>Komisioni</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nuk ka komisione ende
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">#{c.order_number}</TableCell>
                    <TableCell>€{Number(c.order_total).toFixed(2)}</TableCell>
                    <TableCell className="text-destructive font-medium">-€{Number(c.commission_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(c.created_at), 'dd MMM yyyy HH:mm', { locale: sq })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
