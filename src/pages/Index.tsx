import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import CategorySearch from "@/components/landing/CategorySearch";
import HowItWorks from "@/components/landing/HowItWorks";
import Benefits from "@/components/landing/Benefits";
import SubdomainPreview from "@/components/landing/SubdomainPreview";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import BuyerHero from "@/components/landing/BuyerHero";

const Index = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<"buyer" | "business">(
    searchParams.get("view") === "business" ? "business" : "buyer"
  );

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [location.hash]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar view={view} onViewChange={setView} />
      <main>
        {view === "buyer" ? (
          <>
            <BuyerHero />
            <CategorySearch />
          </>
        ) : (
          <>
            <HeroSection />
            <HowItWorks />
            <Benefits />
            <SubdomainPreview />
            <Pricing />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
