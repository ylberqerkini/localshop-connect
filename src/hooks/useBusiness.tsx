import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Business {
  id: string;
  owner_id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  delivery_price: number;
  cash_on_delivery: boolean;
  accepts_online_payments: boolean;
  iban: string | null;
  bank_account_holder: string | null;
  bank_name: string | null;
  email_notifications: boolean;
  is_featured: boolean;
  business_category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BusinessContextType {
  business: Business | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateBusiness: (updates: Partial<Business>) => Promise<{ error: Error | null }>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = async () => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setBusiness(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch business');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, [user]);

  const updateBusiness = async (updates: Partial<Business>) => {
    if (!business) return { error: new Error('No business found') };

    try {
      const { error: updateError } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', business.id);

      if (updateError) throw updateError;
      await fetchBusiness();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Update failed') };
    }
  };

  return (
    <BusinessContext.Provider value={{ business, loading, error, refetch: fetchBusiness, updateBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
