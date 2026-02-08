import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  salesByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  ordersByCity: { city: string; count: number }[];
  conversionMetrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#6366F1'];

export default function Analytics() {
  const { business } = useBusiness();
  const [data, setData] = useState<AnalyticsData>({
    salesByDay: [],
    topProducts: [],
    ordersByCity: [],
    conversionMetrics: {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      averageOrderValue: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    fetchAnalytics();
  }, [business]);

  const fetchAnalytics = async () => {
    if (!business) return;

    try {
      // Fetch all orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', business.id);

      // Fetch all order items with product info
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*');

      if (!orders) {
        setLoading(false);
        return;
      }

      // Sales by day (last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      const salesByDay = last30Days.map(date => {
        const dayOrders = orders.filter(o => o.created_at.startsWith(date));
        return {
          date: new Date(date).toLocaleDateString('sq', { day: 'numeric', month: 'short' }),
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          orders: dayOrders.length
        };
      });

      // Top products by revenue
      const productRevenue: Record<string, { name: string; revenue: number; quantity: number }> = {};
      orderItems?.forEach(item => {
        if (!productRevenue[item.product_name]) {
          productRevenue[item.product_name] = { name: item.product_name, revenue: 0, quantity: 0 };
        }
        productRevenue[item.product_name].revenue += Number(item.total);
        productRevenue[item.product_name].quantity += item.quantity;
      });

      const topProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Orders by city
      const cityCount: Record<string, number> = {};
      orders.forEach(order => {
        const city = order.city || 'Pa specifikuar';
        cityCount[city] = (cityCount[city] || 0) + 1;
      });

      const ordersByCity = Object.entries(cityCount)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Conversion metrics
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

      setData({
        salesByDay,
        topProducts,
        ordersByCity,
        conversionMetrics: {
          totalOrders: orders.length,
          completedOrders,
          cancelledOrders,
          averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Analitika</h1>
          <p className="text-muted-foreground mt-1">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Analitika</h1>
        <p className="text-muted-foreground mt-1">
          Statistikat e biznesit tënd
        </p>
      </div>

      {/* Conversion metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Porosi totale</p>
            <p className="text-3xl font-bold mt-1">{data.conversionMetrics.totalOrders}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Porosi të përfunduara</p>
            <p className="text-3xl font-bold mt-1 text-success">{data.conversionMetrics.completedOrders}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Porosi të anuluara</p>
            <p className="text-3xl font-bold mt-1 text-destructive">{data.conversionMetrics.cancelledOrders}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Vlera mesatare</p>
            <p className="text-3xl font-bold mt-1">€{data.conversionMetrics.averageOrderValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales over time */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Shitjet - 30 ditët e fundit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesByDay}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`€${value.toFixed(2)}`, 'Të ardhura']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Produktet më të shitura</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nuk ka të dhëna</p>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`€${value.toFixed(2)}`, 'Të ardhura']}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders by city */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Porositë sipas qytetit</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ordersByCity.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nuk ka të dhëna</p>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.ordersByCity}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="city"
                      label={({ city, count }) => `${city}: ${count}`}
                    >
                      {data.ordersByCity.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
