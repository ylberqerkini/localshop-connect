import { Badge } from '@/components/ui/badge';
import { Sparkles, Flame, Clock } from 'lucide-react';

const BADGE_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  new: { label: 'I ri', icon: Sparkles, className: 'bg-success text-success-foreground' },
  bestseller: { label: 'Bestseller', icon: Flame, className: 'bg-accent text-accent-foreground' },
  limited: { label: 'I limituar', icon: Clock, className: 'bg-destructive text-destructive-foreground' },
};

export function ProductBadge({ badge }: { badge: string | null }) {
  if (!badge || !BADGE_CONFIG[badge]) return null;
  const config = BADGE_CONFIG[badge];
  const Icon = config.icon;

  return (
    <span className={`absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
