import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Store, ShoppingCart, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';

interface BusinessFees {
  business_id: string;
  business_name: string;
  total_orders: number;
  total_platform_fees: number;
  total_revenue: number;
}

export default function PlatformFees() {
  const [data, setData] = useState<BusinessFees[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ orders: 0, fees: 0, revenue: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all orders with business info
      const { data: orders } = await supabase
        .from('orders')
        .select('business_id, total, platform_fee');

      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name');

      if (!orders || !businesses) {
        setLoading(false);
        return;
      }

      const bizMap = new Map(businesses.map(b => [b.id, b.name]));

      // Group by business
      const grouped: Record<string, BusinessFees> = {};
      orders.forEach(o => {
        if (!grouped[o.business_id]) {
          grouped[o.business_id] = {
            business_id: o.business_id,
            business_name: bizMap.get(o.business_id) || 'Pa emër',
            total_orders: 0,
            total_platform_fees: 0,
            total_revenue: 0,
          };
        }
        grouped[o.business_id].total_orders += 1;
        grouped[o.business_id].total_platform_fees += Number(o.platform_fee || 0);
        grouped[o.business_id].total_revenue += Number(o.total);
      });

      const list = Object.values(grouped).sort((a, b) => b.total_platform_fees - a.total_platform_fees);
      
      setData(list);
      setTotals({
        orders: orders.length,
        fees: orders.reduce((s, o) => s + Number(o.platform_fee || 0), 0),
        revenue: orders.reduce((s, o) => s + Number(o.total), 0),
      });
    } catch (err) {
      console.error('Error fetching platform fees:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center h-16 px-4">
          <h1 className="text-xl font-bold text-foreground">Admin — Tarifa Platformës</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Porosi totale</p>
                <p className="text-2xl font-bold">{totals.orders}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tarifa totale</p>
                <p className="text-2xl font-bold">€{totals.fees.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Biznese</p>
                <p className="text-2xl font-bold">{data.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown by business */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Tarifat sipas biznesit</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biznesi</TableHead>
                  <TableHead className="text-center">Porosi</TableHead>
                  <TableHead className="text-right">Tarifa platformës</TableHead>
                  <TableHead className="text-right">Qarkullimi total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nuk ka të dhëna
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map(row => (
                    <TableRow key={row.business_id}>
                      <TableCell className="font-medium">{row.business_name}</TableCell>
                      <TableCell className="text-center">{row.total_orders}</TableCell>
                      <TableCell className="text-right font-semibold">€{row.total_platform_fees.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">€{row.total_revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
