import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export function usePlatformCategories() {
  return useQuery({
    queryKey: ['platform-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as PlatformCategory[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function buildCategoryTree(categories: PlatformCategory[]) {
  const roots = categories.filter(c => !c.parent_id);
  const children = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
  return { roots, children };
}
