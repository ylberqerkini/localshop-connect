import { useState, useMemo } from 'react';
import { usePlatformCategories, buildCategoryTree } from '@/hooks/usePlatformCategories';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ChevronRight, Tag, X } from 'lucide-react';

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function CategorySelector({ selected, onChange }: Props) {
  const { data: categories = [] } = usePlatformCategories();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { roots, children } = useMemo(() => buildCategoryTree(categories), [categories]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    return categories.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    );
  };

  const selectedNames = categories.filter(c => selected.includes(c.id));

  const renderCategory = (catId: string, catName: string, isChild = false) => (
    <label
      key={catId}
      className={`flex items-center gap-2 px-3 py-2 hover:bg-accent/50 rounded-md cursor-pointer text-sm ${isChild ? 'pl-8' : 'font-medium'}`}
    >
      <Checkbox
        checked={selected.includes(catId)}
        onCheckedChange={() => toggle(catId)}
      />
      <span className="truncate">{catName}</span>
    </label>
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2 h-auto min-h-10 py-2">
            <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selectedNames.length === 0 ? (
              <span className="text-muted-foreground">Zgjidh kategoritë...</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedNames.slice(0, 3).map(c => (
                  <Badge key={c.id} variant="secondary" className="text-xs">
                    {c.name}
                  </Badge>
                ))}
                {selectedNames.length > 3 && (
                  <Badge variant="secondary" className="text-xs">+{selectedNames.length - 3}</Badge>
                )}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Kërko kategori..."
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {filtered ? (
                filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nuk u gjet</p>
                ) : (
                  filtered.map(c => renderCategory(c.id, c.name, !!c.parent_id))
                )
              ) : (
                roots.map(root => (
                  <div key={root.id}>
                    <div className="flex items-center gap-1 px-2 pt-2 pb-1">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{root.name}</span>
                    </div>
                    {children(root.id).map(sub => renderCategory(sub.id, sub.name, true))}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          {selected.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => onChange([])}
              >
                <X className="h-3 w-3 mr-1" /> Pastro të gjitha
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
