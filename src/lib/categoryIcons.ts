import {
  Shirt, Baby, Home, Sparkles, Cpu, UtensilsCrossed, Gift, Palette,
  Dumbbell, PawPrint, Car, BookOpen, Wrench, Monitor, Percent,
  Store, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  shirt: Shirt,
  baby: Baby,
  home: Home,
  sparkles: Sparkles,
  cpu: Cpu,
  'utensils-crossed': UtensilsCrossed,
  gift: Gift,
  palette: Palette,
  dumbbell: Dumbbell,
  'paw-print': PawPrint,
  car: Car,
  'book-open': BookOpen,
  wrench: Wrench,
  monitor: Monitor,
  percent: Percent,
};

export function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Store;
  return iconMap[iconName] || Store;
}
