import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.png";

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left animate-fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Platforma #1 për biznese lokale
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Shitje online për{" "}
              <span className="text-gradient-primary">bizneset lokale</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              Krijo dyqanin tënd online dhe prano porosi automatikisht. Pa nevojë për njohuri teknike.
            </p>

            {/* Feature list */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              {["Pa setup teknik", "Subdomain falas", "0% komision"].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" className="group">
                Fillo falas
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="hero-outline" size="xl" className="group">
                <Play className="w-5 h-5" />
                Shiko demo
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-10 pt-8 border-t border-border/50">
              <div className="flex items-center justify-center lg:justify-start gap-8">
                <div>
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">Biznese aktive</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="text-2xl font-bold text-foreground">10,000+</div>
                  <div className="text-sm text-muted-foreground">Porosi ditore</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="text-2xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground">Të kënaqur</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right content - Dashboard preview */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              {/* Main dashboard image */}
              <div className="relative rounded-2xl overflow-hidden shadow-soft-lg border border-border/50">
                <img
                  src={heroDashboard}
                  alt="eblej.com Dashboard"
                  className="w-full h-auto"
                />
              </div>

              {/* Floating notification card */}
              <div className="absolute -left-4 top-1/4 animate-float bg-card rounded-xl p-4 shadow-soft-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Porosi e re!</div>
                    <div className="text-xs text-muted-foreground">Pak sekonda më parë</div>
                  </div>
                </div>
              </div>

              {/* Floating stats card */}
              <div className="absolute -right-4 bottom-1/4 animate-float bg-card rounded-xl p-4 shadow-soft-lg border border-border/50" style={{ animationDelay: "2s" }}>
                <div className="text-xs text-muted-foreground mb-1">Shitjet sot</div>
                <div className="text-2xl font-bold text-foreground">€1,234</div>
                <div className="text-xs text-success font-medium">↑ 12% nga dje</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
