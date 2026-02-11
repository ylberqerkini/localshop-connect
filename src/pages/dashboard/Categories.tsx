import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';

export default function Categories() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('business_id', business.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const createMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const { error } = await supabase.from('categories').insert({
        name: categoryName,
        business_id: business!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Kategoria u krijua me sukses' });
      closeDialog();
    },
    onError: () => toast({ title: 'Gabim gjatë krijimit', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name: newName }: { id: string; name: string }) => {
      const { error } = await supabase.from('categories').update({ name: newName }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Kategoria u përditësua me sukses' });
      closeDialog();
    },
    onError: () => toast({ title: 'Gabim gjatë përditësimit', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Kategoria u fshi me sukses' });
      setDeleteId(null);
    },
    onError: () => toast({ title: 'Gabim gjatë fshirjes', variant: 'destructive' }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setName('');
  };

  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setDialogOpen(true);
  };

  const openEdit = (cat: { id: string; name: string }) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name: name.trim() });
    } else {
      createMutation.mutate(name.trim());
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategoritë</h1>
          <p className="text-muted-foreground">Menaxho kategoritë e produkteve</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Shto Kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Të gjitha kategoritë ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nuk ka kategori ende</p>
              <p className="text-sm">Krijo kategorinë e parë për të organizuar produktet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emri</TableHead>
                  <TableHead className="w-[120px] text-right">Veprimet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Ndrysho Kategorinë' : 'Kategori e Re'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Emri i kategorisë"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Anulo
              </Button>
              <Button type="submit" disabled={!name.trim() || isBusy}>
                {isBusy ? 'Duke ruajtur...' : editingCategory ? 'Ruaj' : 'Krijo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fshi Kategorinë?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Kjo veprim nuk mund të kthehet mbrapsht. Produktet në këtë kategori nuk do të fshihen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Anulo
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Duke fshirë...' : 'Fshi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
