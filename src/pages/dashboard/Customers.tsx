import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Phone, MapPin } from 'lucide-react';
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

export default function Customers() {
  const { business } = useBusiness();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!business) return;
    fetchCustomers();
  }, [business]);

  const fetchCustomers = async () => {
    if (!business) return;
    
    try {
      // Fetch customers
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch order counts and totals for each customer
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

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Klientët</h1>
        <p className="text-muted-foreground mt-1">
          Shiko listën e klientëve që kanë porositur
        </p>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kërko sipas emrit, telefonit ose emailit..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers table */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">Duke ngarkuar...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nuk ka klientë</h3>
              <p className="text-muted-foreground mt-1">
                Klientët do të shfaqen këtu pasi të porosisin
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klienti</TableHead>
                  <TableHead>Kontakti</TableHead>
                  <TableHead>Porosi</TableHead>
                  <TableHead>Total shpenzuar</TableHead>
                  <TableHead>Regjistruar më</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {customer.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{customer.full_name}</p>
                          {customer.email && (
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {customer.phone}
                        </div>
                        {customer.address && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{customer.orders_count}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">
                        €{customer.total_spent.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: sq })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
