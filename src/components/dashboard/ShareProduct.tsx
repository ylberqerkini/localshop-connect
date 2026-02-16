import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareProductProps {
  productName: string;
  productPrice: number;
  productImage: string | null;
  storeUrl: string;
}

export function ShareProduct({ storeUrl }: ShareProductProps) {
  const { toast } = useToast();

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: 'Linku u kopjua!', description: storeUrl });
  };

  return (
    <Button variant="ghost" size="icon" title="Kopjo linkun" onClick={copyLink}>
      <LinkIcon className="h-4 w-4" />
    </Button>
  );
}
