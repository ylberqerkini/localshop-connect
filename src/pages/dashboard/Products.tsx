import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/hooks/useBusiness';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2, Package, Loader2, Upload, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShareProduct } from '@/components/dashboard/ShareProduct';
import { CategorySelector } from '@/components/dashboard/CategorySelector';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  category_id: string | null;
  badge: string | null;
  tags: string[] | null;
  shipping_cost: number;
}

export default function Products() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock_quantity: '0',
    is_active: true,
    category_id: '',
    badge: '',
    tags: '',
    shipping_cost: '0',
    selectedCategories: [] as string[],
  });

  useEffect(() => {
    if (!business) return;
    fetchProducts();
  }, [business]);

  const fetchProducts = async () => {
    if (!business) return;
    
    try {
      const [prodRes, pcRes] = await Promise.all([
        supabase.from('products').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
        supabase.from('product_categories').select('product_id, category_id'),
      ]);

      if (prodRes.error) throw prodRes.error;
      setProducts(prodRes.data || []);

      // Build product -> categories map
      const map: Record<string, string[]> = {};
      (pcRes.data || []).forEach(pc => {
        if (!map[pc.product_id]) map[pc.product_id] = [];
        map[pc.product_id].push(pc.category_id);
      });
      setProductCategoryMap(map);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        image_url: product.image_url || '',
        stock_quantity: String(product.stock_quantity),
        is_active: product.is_active,
        category_id: product.category_id || '',
        badge: product.badge || '',
        tags: (product.tags || []).join(', '),
        shipping_cost: String(product.shipping_cost || 0),
        selectedCategories: productCategoryMap[product.id] || [],
      });
      setImagePreview(product.image_url || null);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        image_url: '',
        stock_quantity: '0',
        is_active: true,
        category_id: '',
        badge: '',
        tags: '',
        shipping_cost: '0',
        selectedCategories: [],
      });
      setImagePreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Gabim', description: 'Vetëm imazhe lejohen', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Gabim', description: 'Imazhi duhet të jetë më i vogël se 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${business.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Gabim', description: 'Nuk u ngarkua imazhi', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!business || !formData.name || !formData.price) {
      toast({
        title: 'Gabim',
        description: 'Plotësoni emrin dhe çmimin e produktit',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const productData = {
        business_id: business.id,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        image_url: formData.image_url || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        is_active: formData.is_active,
        category_id: formData.category_id || null,
        badge: formData.badge || null,
        tags,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
      };

      let productId: string;

      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;
        toast({ title: 'Sukses', description: 'Produkti u përditësua' });
      } else {
        const { data: newProd, error } = await supabase.from('products').insert(productData).select('id').single();
        if (error) throw error;
        productId = newProd.id;
        toast({ title: 'Sukses', description: 'Produkti u shtua' });
      }

      // Sync product_categories
      await supabase.from('product_categories').delete().eq('product_id', productId);
      if (formData.selectedCategories.length > 0) {
        await supabase.from('product_categories').insert(
          formData.selectedCategories.map(cid => ({ product_id: productId, category_id: cid }))
        );
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Gabim', description: 'Nuk u ruajt produkti', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Jeni i sigurt që doni të fshini këtë produkt?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
      toast({ title: 'Sukses', description: 'Produkti u fshi' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Gabim',
        description: 'Nuk u fshi produkti',
        variant: 'destructive'
      });
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Produktet</h1>
          <p className="text-muted-foreground mt-1">
            Menaxho produktet e dyqanit tënd
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Shto produkt
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kërko produktet..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products grid */}
      {loading ? (
        <div className="text-center py-12">Duke ngarkuar...</div>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nuk ka produkte</h3>
            <p className="text-muted-foreground mt-1">
              Shto produktin e parë për të filluar
            </p>
            <Button onClick={() => openDialog()} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Shto produkt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-0 shadow-soft overflow-hidden">
              <div className="aspect-square bg-muted relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="secondary">Joaktiv</Badge>
                    </div>
                  )}
                  {product.badge && (
                    <Badge className="absolute top-2 left-2 text-xs capitalize">{product.badge === 'new' ? 'I ri' : product.badge === 'bestseller' ? 'Bestseller' : 'I limituar'}</Badge>
                  )}
                  {product.stock_quantity <= 5 && product.stock_quantity > 0 && product.is_active && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-destructive/90 text-destructive-foreground rounded-full text-xs">
                      <AlertTriangle className="h-3 w-3" /> Stok i ulët
                    </div>
                  )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <p className="text-lg font-bold text-primary mt-1">
                      €{Number(product.price).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Stoku: {product.stock_quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShareProduct
                      productName={product.name}
                      productPrice={Number(product.price)}
                      productImage={product.image_url}
                      storeUrl={`${window.location.origin}/store/${business?.subdomain}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Aktiv</span>
                  <Switch
                    checked={product.is_active}
                    onCheckedChange={() => toggleProductStatus(product)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit product dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Përditëso produktin' : 'Shto produkt të ri'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Emri *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Emri i produktit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Përshkrimi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Përshkrimi i produktit"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Çmimi (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stoku</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="0"
                />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_cost">Kosto e postës (€)</Label>
              <Input
                id="shipping_cost"
                type="number"
                step="0.01"
                value={formData.shipping_cost}
                onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            </div>

            <div className="space-y-2">
              <Label>Imazhi i produktit</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={removeImage}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/40 bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Kliko për të ngarkuar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Kategoritë</Label>
              <CategorySelector
                selected={formData.selectedCategories}
                onChange={(ids) => setFormData({ ...formData, selectedCategories: ids })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiketa (tags)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="p.sh. organik, handmade, lokal (ndaj me presje)"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Produkt aktiv</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Badge (opsionale)</Label>
              <Select value={formData.badge} onValueChange={v => setFormData({ ...formData, badge: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Pa badge" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pa badge</SelectItem>
                  <SelectItem value="new">I ri</SelectItem>
                  <SelectItem value="bestseller">Bestseller</SelectItem>
                  <SelectItem value="limited">I limituar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anulo
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? 'Përditëso' : 'Shto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
