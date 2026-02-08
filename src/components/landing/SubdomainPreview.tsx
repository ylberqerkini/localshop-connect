import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingBag, Star } from "lucide-react";

const SubdomainPreview = () => {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-6">
              Shembull dyqani
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Dyqani yt,{" "}
              <span className="text-gradient-primary">brendi yt</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Çdo biznes merr subdomain-in e vet. Klientët mund të porosisin 
              lehtësisht pa nevojë për llogari.
            </p>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary border border-border/50 mb-8">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Shembull URL</div>
                <div className="text-lg font-semibold text-foreground">
                  kaferistori.eblej.com
                </div>
              </div>
            </div>

            <Button variant="hero" size="lg">
              Krijo dyqanin tënd
            </Button>
          </div>

          {/* Right content - Mock shop preview */}
          <div className="relative">
            <div className="bg-card rounded-2xl border border-border/50 shadow-soft-lg overflow-hidden">
              {/* Browser header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/70" />
                  <div className="w-3 h-3 rounded-full bg-accent/70" />
                  <div className="w-3 h-3 rounded-full bg-success/70" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1.5 text-sm text-muted-foreground text-center">
                    kaferistori.eblej.com
                  </div>
                </div>
              </div>

              {/* Mock shop content */}
              <div className="p-6">
                {/* Shop header */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
                  <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Kaferi Stori</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span>4.9</span>
                      <span>•</span>
                      <span>Prishtinë</span>
                    </div>
                  </div>
                </div>

                {/* Products grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Kafe Turke", price: "€1.50" },
                    { name: "Kapuçino", price: "€2.00" },
                    { name: "Latte", price: "€2.50" },
                    { name: "Espreso", price: "€1.20" },
                  ].map((product) => (
                    <div
                      key={product.name}
                      className="bg-secondary rounded-xl p-4 hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <div className="w-full h-20 bg-muted rounded-lg mb-3" />
                      <div className="text-sm font-medium text-foreground">{product.name}</div>
                      <div className="text-sm text-primary font-semibold">{product.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubdomainPreview;
