import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Download, Eye, Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  city: string | null;
  notes: string | null;
  customer: {
    full_name: string;
    phone: string;
    address: string | null;
  } | null;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Në pritje', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Konfirmuar', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  shipped: { label: 'Dërguar', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Dorëzuar', color: 'bg-green-100 text-green-800', icon: Package },
  cancelled: { label: 'Anuluar', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function Orders() {
  const { business } = useBusiness();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!business) return;
    fetchOrders();
  }, [business]);

  const fetchOrders = async () => {
    if (!business) return;
    
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, phone, address)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('product_name, quantity, unit_price, total')
            .eq('order_id', order.id);

          return {
            ...order,
            items: items || []
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Porositë</h1>
          <p className="text-muted-foreground mt-1">
            Menaxho porositë e biznesit tënd
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Eksporto
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kërko sipas numrit, emrit ose telefonit..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statusi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha</SelectItem>
                <SelectItem value="pending">Në pritje</SelectItem>
                <SelectItem value="confirmed">Konfirmuar</SelectItem>
                <SelectItem value="shipped">Dërguar</SelectItem>
                <SelectItem value="delivered">Dorëzuar</SelectItem>
                <SelectItem value="cancelled">Anuluar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr. Porosisë</TableHead>
                <TableHead>Klienti</TableHead>
                <TableHead>Statusi</TableHead>
                <TableHead>Totali</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Duke ngarkuar...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nuk ka porosi ende
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer?.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{order.customer?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig[order.status].color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[order.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">€{Number(order.total).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), 'dd MMM yyyy', { locale: sq })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order details dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Porosia #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Informacioni i klientit</h4>
                <p className="text-sm">{selectedOrder.customer?.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customer?.phone}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customer?.address}</p>
              </div>

              {/* Order items */}
              <div>
                <h4 className="font-medium mb-2">Produktet</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>€{Number(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Nëntotali</span>
                      <span>€{Number(selectedOrder.total - (selectedOrder as any).delivery_fee - (selectedOrder as any).platform_fee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tarifë platforme</span>
                      <span>€{Number((selectedOrder as any).platform_fee || 1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Totali</span>
                      <span>€{Number(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium mb-2">Shënime</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status update */}
              <div>
                <h4 className="font-medium mb-2">Ndrysho statusin</h4>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => updateOrderStatus(selectedOrder.id, value as OrderStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Në pritje</SelectItem>
                    <SelectItem value="confirmed">Konfirmuar</SelectItem>
                    <SelectItem value="shipped">Dërguar</SelectItem>
                    <SelectItem value="delivered">Dorëzuar</SelectItem>
                    <SelectItem value="cancelled">Anuluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
