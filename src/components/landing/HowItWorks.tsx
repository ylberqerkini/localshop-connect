import { Store, Package, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Store,
    step: "01",
    title: "Krijo dyqanin",
    description: "Regjistrohu dhe zgjidh subdomain-in tënd. Dyqani yt do të jetë online brenda minutash.",
  },
  {
    icon: Package,
    step: "02",
    title: "Shto produktet",
    description: "Ngarko produktet me foto, çmime dhe përshkrime. Organizoji në kategori.",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Prano porosi",
    description: "Klientët porosisin online, ti merr notifikime dhe menaxhon gjithçka nga dashboard.",
  },
];

const HowItWorks = () => {
  return (
    <section id="si-funksionon" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
            Si funksionon
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Fillo në <span className="text-gradient-primary">3 hapa të thjeshtë</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Nga ideja te dyqani online, në më pak se 10 minuta.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-px bg-gradient-to-r from-border via-primary/30 to-border" />
              )}

              <div className="relative bg-card rounded-2xl p-8 border border-border/50 shadow-soft hover:shadow-soft-lg transition-all duration-300 group-hover:-translate-y-1">
                {/* Step number */}
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
