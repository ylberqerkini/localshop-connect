import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, DollarSign, Package, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalPlatformFees: number;
  ordersToday: number;
  totalCustomers: number;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

export default function Overview() {
  const { business } = useBusiness();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalPlatformFees: 0,
    ordersToday: 0,
    totalCustomers: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;

    const fetchStats = async () => {
      try {
        // Fetch total orders and revenue
        const { data: orders } = await supabase
          .from('orders')
          .select('total, platform_fee, created_at')
          .eq('business_id', business.id);

        const today = new Date().toISOString().split('T')[0];
        const ordersToday = orders?.filter(o => 
          o.created_at.startsWith(today)
        ).length || 0;

        const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
        const totalPlatformFees = orders?.reduce((sum, o) => sum + Number(o.platform_fee || 0), 0) || 0;

        // Fetch customers count
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', business.id);

        setStats({
          totalOrders: orders?.length || 0,
          totalRevenue,
          totalPlatformFees,
          ordersToday,
          totalCustomers: customersCount || 0
        });

        // Generate chart data for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const chartData = last7Days.map(date => {
          const dayOrders = orders?.filter(o => o.created_at.startsWith(date)) || [];
          return {
            date: new Date(date).toLocaleDateString('sq', { weekday: 'short' }),
            revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
            orders: dayOrders.length
          };
        });

        setChartData(chartData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [business]);

  const statCards = [
    {
      title: 'Porosi totale',
      value: stats.totalOrders,
      icon: ShoppingCart,
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Të ardhura',
      value: `€${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Tarifë platforme',
      value: `€${stats.totalPlatformFees.toFixed(2)}`,
      icon: DollarSign,
      change: `${stats.totalOrders} porosi`,
      trend: 'neutral'
    },
    {
      title: 'Porosi sot',
      value: stats.ordersToday,
      icon: Package,
      change: stats.ordersToday > 0 ? '+' + stats.ordersToday : '0',
      trend: stats.ordersToday > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Klientë',
      value: stats.totalCustomers,
      icon: Users,
      change: '+5%',
      trend: 'up'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Përmbledhje</h1>
        <p className="text-muted-foreground mt-1">
          Mirësevini, {business?.name}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-success' : 'text-muted-foreground'
                }`}>
                  {stat.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                  {stat.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Të ardhurat - 7 ditët e fundit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
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
    </div>
  );
}
