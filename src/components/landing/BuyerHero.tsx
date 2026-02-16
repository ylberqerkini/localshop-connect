import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ShoppingBag, Star, TrendingUp, Search } from "lucide-react";
import { usePlatformCategories, buildCategoryTree } from "@/hooks/usePlatformCategories";
import { getCategoryIcon } from "@/lib/categoryIcons";

const BuyerHero = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: categories = [] } = usePlatformCategories();
  const { roots } = buildCategoryTree(categories);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query.trim() ? `/marketplace?search=${encodeURIComponent(query.trim())}` : "/marketplace");
  };

  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <ShoppingBag className="w-4 h-4" />
            Zbulo dyqanet lokale online
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-4">
            Bli online nga{" "}
            <span className="text-gradient-primary">bizneset lokale</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
            Gjej restorante, dyqane veshjesh, elektronikë dhe më shumë.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
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

          {/* Category icons from DB */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3 max-w-4xl mx-auto mb-12">
            {roots.slice(0, 8).map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/marketplace?category=${cat.slug}`)}
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-soft transition-all group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* More categories link */}
          {roots.length > 8 && (
            <Button variant="link" className="text-primary mb-8" onClick={() => navigate('/marketplace')}>
              Shiko të gjitha kategoritë <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {/* Stats */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-foreground">500+</div>
                  <div className="text-xs text-muted-foreground">Dyqane</div>
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-foreground">10,000+</div>
                  <div className="text-xs text-muted-foreground">Produkte</div>
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-success" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-foreground">4.8</div>
                  <div className="text-xs text-muted-foreground">Vlerësim mesatar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuyerHero;
