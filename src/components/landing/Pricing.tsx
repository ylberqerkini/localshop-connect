import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Falas",
    price: "€0",
    period: "/muaj",
    description: "Perfekt për të filluar",
    features: [
      "Deri në 20 produkte",
      "Subdomain falas",
      "Porosi të pakufizuara",
      "Suport via email",
    ],
    cta: "Fillo falas",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "€19",
    period: "/muaj",
    description: "Për biznese në rritje",
    features: [
      "Produkte të pakufizuara",
      "Domain i personalizuar",
      "Analitikë të avancuara",
      "Suport prioritar",
      "Eksport të të dhënave",
      "Pa reklamë eblej",
    ],
    cta: "Fillo Pro",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Biznes",
    price: "€49",
    period: "/muaj",
    description: "Për biznese të mëdha",
    features: [
      "Gjithçka në Pro",
      "Disa dyqane",
      "API access",
      "Integrime të personalizuara",
      "Account manager",
      "SLA 99.9%",
    ],
    cta: "Kontakto",
    variant: "outline" as const,
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="cmimet" className="py-20 lg:py-32 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Çmimet
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Plani i duhur për{" "}
            <span className="text-gradient-primary">çdo biznes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Fillo falas dhe upgrade kur të jesh gati.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 border shadow-soft ${
                plan.popular
                  ? "border-primary shadow-glow scale-105 z-10"
                  : "border-border/50"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-gradient-accent text-accent-foreground text-sm font-semibold shadow-accent-glow">
                    Më popullor
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button variant={plan.variant} size="lg" className="w-full" asChild>
                <Link to="/auth?mode=signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
