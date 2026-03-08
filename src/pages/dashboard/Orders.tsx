import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Download, Eye, Clock, CheckCircle, Truck, Package, XCircle, Printer, Edit, Loader2, FileText, FileSpreadsheet, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  delivery_fee: number | null;
  platform_fee: number;
  discount_amount: number | null;
  coupon_code: string | null;
  created_at: string;
  city: string | null;
  notes: string | null;
  customer_id: string | null;
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
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    status: '' as OrderStatus,
  });

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

  const openEditDialog = (order: Order) => {
    setEditOrder(order);
    setEditForm({
      full_name: order.customer?.full_name || '',
      phone: order.customer?.phone || '',
      address: order.customer?.address || '',
      city: order.city || '',
      notes: order.notes || '',
      status: order.status,
    });
  };

  const handleEditSave = async () => {
    if (!editOrder) return;
    setEditSaving(true);
    try {
      // Update order fields
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          city: editForm.city || null,
          notes: editForm.notes || null,
          status: editForm.status,
        })
        .eq('id', editOrder.id);
      if (orderError) throw orderError;

      // Update customer if exists
      if (editOrder.customer_id) {
        const { error: custError } = await supabase
          .from('customers')
          .update({
            full_name: editForm.full_name,
            phone: editForm.phone,
            address: editForm.address || null,
          })
          .eq('id', editOrder.customer_id);
        if (custError) throw custError;
      }

      toast({ title: 'Sukses', description: 'Porosia u përditësua' });
      setEditOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({ title: 'Gabim', description: 'Nuk u përditësua porosia', variant: 'destructive' });
    } finally {
      setEditSaving(false);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const itemsRows = order.items.map(item => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.product_name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">€${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">€${Number(item.total).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Faturë - #${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; color: #333; padding: 40px; max-width: 800px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #333; padding-bottom: 20px; }
    .header h1 { font-size: 28px; }
    .header .meta { text-align: right; font-size: 14px; color: #666; }
    .section { margin-bottom: 24px; }
    .section h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
    .section p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #333; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    .totals { margin-top: 16px; border-top: 2px solid #333; padding-top: 12px; }
    .totals .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
    .totals .row.grand { font-size: 18px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px; }
    .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>FATURË</h1>
      <p style="color:#666;font-size:14px;margin-top:4px;">${business?.name || ''}</p>
    </div>
    <div class="meta">
      <p><strong>#${order.order_number}</strong></p>
      <p>${format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: sq })}</p>
      <p style="margin-top:4px;">Status: ${statusConfig[order.status].label}</p>
    </div>
  </div>

  <div class="section">
    <h3>Klienti</h3>
    <p><strong>${order.customer?.full_name || 'N/A'}</strong></p>
    <p>${order.customer?.phone || ''}</p>
    <p>${order.customer?.address || ''}${order.city ? ', ' + order.city : ''}</p>
  </div>

  <div class="section">
    <h3>Produktet</h3>
    <table>
      <thead>
        <tr>
          <th>Produkti</th>
          <th>Sasia</th>
          <th>Çmimi</th>
          <th>Totali</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="row"><span>Nëntotali</span><span>€${Number(order.subtotal).toFixed(2)}</span></div>
    ${order.delivery_fee ? `<div class="row"><span>Transporti</span><span>€${Number(order.delivery_fee).toFixed(2)}</span></div>` : ''}
    ${order.discount_amount ? `<div class="row"><span>Zbritje${order.coupon_code ? ' (' + order.coupon_code + ')' : ''}</span><span>-€${Number(order.discount_amount).toFixed(2)}</span></div>` : ''}
    <div class="row"><span>Tarifë platforme</span><span>€${Number(order.platform_fee || 1).toFixed(2)}</span></div>
    <div class="row grand"><span>TOTALI</span><span>€${Number(order.total).toFixed(2)}</span></div>
  </div>

  ${order.notes ? `<div class="section" style="margin-top:24px;"><h3>Shënime</h3><p>${order.notes}</p></div>` : ''}

  <div class="footer">
    <p>${business?.name || ''} ${business?.phone ? '• Tel: ' + business.phone : ''} ${business?.email ? '• ' + business.email : ''}</p>
    <p style="margin-top:4px;">${business?.address || ''}</p>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsExcel = () => {
    const headers = ['Nr. Porosisë', 'Klienti', 'Telefoni', 'Adresa', 'Qyteti', 'Statusi', 'Produktet', 'Nëntotali', 'Transport', 'Zbritje', 'Totali', 'Data', 'Shënime'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.customer?.full_name || '',
      o.customer?.phone || '',
      o.customer?.address || '',
      o.city || '',
      statusConfig[o.status].label,
      o.items.map(i => `${i.quantity}x ${i.product_name}`).join('; '),
      Number(o.subtotal).toFixed(2),
      Number(o.delivery_fee || 0).toFixed(2),
      Number(o.discount_amount || 0).toFixed(2),
      Number(o.total).toFixed(2),
      format(new Date(o.created_at), 'dd/MM/yyyy HH:mm'),
      o.notes || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(csv, `porositë-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv;charset=utf-8');
    toast({ title: 'Sukses', description: 'Excel (CSV) u eksportua me sukses' });
  };

  const exportAsNotes = () => {
    const text = filteredOrders.map(o => {
      const items = o.items.map(i => `  • ${i.quantity}x ${i.product_name} — €${Number(i.total).toFixed(2)}`).join('\n');
      return `═══════════════════════════════════════
📦 Porosia #${o.order_number}
📅 ${format(new Date(o.created_at), 'dd MMMM yyyy, HH:mm', { locale: sq })}
📊 Status: ${statusConfig[o.status].label}
───────────────────────────────────────
👤 ${o.customer?.full_name || 'N/A'}
📞 ${o.customer?.phone || ''}
📍 ${o.customer?.address || ''}${o.city ? ', ' + o.city : ''}
───────────────────────────────────────
${items}
───────────────────────────────────────
  Nëntotali: €${Number(o.subtotal).toFixed(2)}
  Transport: €${Number(o.delivery_fee || 0).toFixed(2)}
  Zbritje:   €${Number(o.discount_amount || 0).toFixed(2)}
  TOTALI:    €${Number(o.total).toFixed(2)}
${o.notes ? `\n📝 ${o.notes}` : ''}`;
    }).join('\n\n');
    
    downloadFile(text, `porositë-${format(new Date(), 'yyyy-MM-dd')}.txt`, 'text/plain;charset=utf-8');
    toast({ title: 'Sukses', description: 'Shënimet u eksportuan me sukses' });
  };

  const exportAsPdf = () => {
    const rows = filteredOrders.map(o => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">#${o.order_number}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:500;">${o.customer?.full_name || 'N/A'}</div>
          <div style="font-size:12px;color:#6b7280;">${o.customer?.phone || ''}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${o.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:500;${
            o.status === 'delivered' ? 'background:#dcfce7;color:#166534;' :
            o.status === 'cancelled' ? 'background:#fee2e2;color:#991b1b;' :
            o.status === 'shipped' ? 'background:#ede9fe;color:#5b21b6;' :
            o.status === 'confirmed' ? 'background:#dbeafe;color:#1e40af;' :
            'background:#fef9c3;color:#854d0e;'
          }">${statusConfig[o.status].label}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">€${Number(o.total).toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${format(new Date(o.created_at), 'dd MMM yyyy')}</td>
      </tr>
    `).join('');

    const totalSum = filteredOrders.reduce((s, o) => s + Number(o.total), 0);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Raporti i Porosive</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; color:#111827; padding:40px; max-width:1100px; margin:auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px; padding-bottom:20px; border-bottom:3px solid #111827; }
  .header h1 { font-size:26px; letter-spacing:-0.5px; }
  .header .sub { color:#6b7280; font-size:14px; margin-top:4px; }
  .stats { display:flex; gap:24px; margin-bottom:28px; }
  .stat { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:16px 20px; flex:1; }
  .stat .label { font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#6b7280; }
  .stat .value { font-size:22px; font-weight:700; margin-top:4px; }
  table { width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
  th { text-align:left; padding:12px; background:#f9fafb; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#6b7280; border-bottom:2px solid #e5e7eb; }
  .footer { margin-top:32px; text-align:center; font-size:12px; color:#9ca3af; }
  @media print { body { padding:20px; } }
</style></head><body>
  <div class="header">
    <div>
      <h1>📊 Raporti i Porosive</h1>
      <div class="sub">${business?.name || ''} • Gjeneruar më ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: sq })}</div>
    </div>
    <div style="text-align:right;font-size:13px;color:#6b7280;">
      ${statusFilter !== 'all' ? `Filter: ${statusConfig[statusFilter as OrderStatus]?.label || statusFilter}` : 'Të gjitha porositë'}
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="label">Porosi gjithsej</div><div class="value">${filteredOrders.length}</div></div>
    <div class="stat"><div class="label">Totali i shitjeve</div><div class="value">€${totalSum.toFixed(2)}</div></div>
    <div class="stat"><div class="label">Mesatarja</div><div class="value">€${filteredOrders.length ? (totalSum / filteredOrders.length).toFixed(2) : '0.00'}</div></div>
  </div>
  <table>
    <thead><tr><th>Nr.</th><th>Klienti</th><th>Produktet</th><th>Statusi</th><th>Totali</th><th>Data</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer"><p>${business?.name || ''} ${business?.phone ? '• ' + business.phone : ''} ${business?.email ? '• ' + business.email : ''}</p></div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    toast({ title: 'Sukses', description: 'PDF u hap për printim' });
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Eksporto
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={exportAsPdf} className="gap-3 cursor-pointer">
              <FileText className="h-4 w-4 text-red-500" />
              <div>
                <div className="font-medium">PDF</div>
                <div className="text-xs text-muted-foreground">Raport për printim</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsExcel} className="gap-3 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">Excel (CSV)</div>
                <div className="text-xs text-muted-foreground">Spreadsheet format</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAsNotes} className="gap-3 cursor-pointer">
              <StickyNote className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="font-medium">Shënime (TXT)</div>
                <div className="text-xs text-muted-foreground">Tekst i thjeshtë</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Shiko"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ndrysho"
                            onClick={() => openEditDialog(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Printo faturën"
                            onClick={() => handlePrintInvoice(order)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
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
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Informacioni i klientit</h4>
                <p className="text-sm">{selectedOrder.customer?.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customer?.phone}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customer?.address}</p>
              </div>

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
                      <span>€{Number(selectedOrder.subtotal).toFixed(2)}</span>
                    </div>
                    {selectedOrder.delivery_fee ? (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Transporti</span>
                        <span>€{Number(selectedOrder.delivery_fee).toFixed(2)}</span>
                      </div>
                    ) : null}
                    {selectedOrder.discount_amount ? (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Zbritje{selectedOrder.coupon_code ? ` (${selectedOrder.coupon_code})` : ''}</span>
                        <span>-€{Number(selectedOrder.discount_amount).toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tarifë platforme</span>
                      <span>€{Number(selectedOrder.platform_fee || 1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Totali</span>
                      <span>€{Number(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium mb-2">Shënime</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}

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

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="gap-2 flex-1" onClick={() => handlePrintInvoice(selectedOrder)}>
                  <Printer className="h-4 w-4" />
                  Printo faturën
                </Button>
                <Button variant="outline" className="gap-2 flex-1" onClick={() => { setSelectedOrder(null); openEditDialog(selectedOrder); }}>
                  <Edit className="h-4 w-4" />
                  Ndrysho
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit order dialog */}
      <Dialog open={!!editOrder} onOpenChange={() => setEditOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ndrysho porosinë #{editOrder?.order_number}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Emri i klientit</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefoni</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresa</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Qyteti</Label>
              <Input
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Shënime</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Statusi</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as OrderStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>Anulo</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ruaj ndryshimet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
