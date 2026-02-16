import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Star, TrendingUp } from "lucide-react";

const BuyerHero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <ShoppingBag className="w-4 h-4" />
            Zbulo dyqanet lokale online
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Bli online nga{" "}
            <span className="text-gradient-primary">bizneset lokale</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
            Gjej restorante, dyqane veshjesh, elektronikë dhe më shumë. Porosit lehtë dhe shpejt.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" className="group" asChild>
              <Link to="/marketplace">
                Shiko dyqanet
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-border/50">
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
