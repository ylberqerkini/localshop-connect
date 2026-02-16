import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Search,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  ShoppingBasket,
  Pill,
  Sparkles,
  Wrench,
  MoreHorizontal,
} from "lucide-react";

const categories = [
  { key: "restaurant", label: "Restorante", icon: UtensilsCrossed },
  { key: "clothing", label: "Veshje", icon: Shirt },
  { key: "electronics", label: "Elektronikë", icon: Smartphone },
  { key: "market", label: "Market", icon: ShoppingBasket },
  { key: "pharmacy", label: "Farmaci", icon: Pill },
  { key: "beauty", label: "Bukuri", icon: Sparkles },
  { key: "services", label: "Shërbime", icon: Wrench },
  { key: "other", label: "Të tjera", icon: MoreHorizontal },
];

const CategorySearch = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate("/marketplace");
    }
  };

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search box */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kërko dyqane, produkte ose kategori..."
              className="pl-12 pr-4 h-14 text-base rounded-2xl border-border/80 bg-card shadow-soft focus-visible:ring-primary"
            />
          </div>
        </form>

        {/* Category grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 max-w-4xl mx-auto">
          {categories.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => navigate(`/marketplace?category=${key}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-soft transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySearch;
