import {
  Zap,
  Globe,
  BarChart3,
  Shield,
  Smartphone,
  HeadphonesIcon,
} from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Setup i shpejtë",
    description: "Pa njohuri teknike. Dyqani yt online gati në 10 minuta.",
  },
  {
    icon: Globe,
    title: "Subdomain falas",
    description: "Merr adresën tënde: biznesi.eblej.com, ose lidh domain-in tënd.",
  },
  {
    icon: BarChart3,
    title: "Analitikë të detajuara",
    description: "Shiko shitjet, produktet më të shitura, dhe metrika të tjera.",
  },
  {
    icon: Shield,
    title: "I sigurt",
    description: "Të dhënat tuaja dhe të klientëve janë të mbrojtura 24/7.",
  },
  {
    icon: Smartphone,
    title: "Responsive",
    description: "Dyqani duket perfekt në telefon, tablet dhe desktop.",
  },
  {
    icon: HeadphonesIcon,
    title: "Suport",
    description: "Ekipi ynë është gjithmonë gati për të ndihmuar.",
  },
];

const Benefits = () => {
  return (
    <section id="benefitet" className="py-20 lg:py-32 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Pse eblej.com?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Gjithçka që të duhet për të{" "}
            <span className="text-gradient-accent">shitur online</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Platforma e plotë për bizneset lokale që duan të rriten online.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group bg-card rounded-2xl p-6 lg:p-8 border border-border/50 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center mb-5 shadow-glow group-hover:scale-110 transition-transform">
                <benefit.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
