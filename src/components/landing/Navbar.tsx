import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ArrowLeftRight } from "lucide-react";

interface NavbarProps {
  view?: "buyer" | "business";
  onViewChange?: (view: "buyer" | "business") => void;
}

const Navbar = ({ view = "buyer", onViewChange }: NavbarProps) => {
  const isBusiness = view === "business";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">eblej.com</span>
          </div>

          {/* Navigation Links - change based on view */}
          <div className="hidden md:flex items-center gap-8">
            {isBusiness ? (
              <>
                <Link to="/#si-funksionon" className="text-muted-foreground hover:text-foreground transition-colors">
                  Si funksionon
                </Link>
                <Link to="/#benefitet" className="text-muted-foreground hover:text-foreground transition-colors">
                  Benefitet
                </Link>
                <Link to="/#cmimet" className="text-muted-foreground hover:text-foreground transition-colors">
                  Çmimet
                </Link>
              </>
            ) : (
              <>
                <Link to="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dyqanet
                </Link>
                <Link to="/marketplace?sort=trending" className="text-muted-foreground hover:text-foreground transition-colors">
                  Trending
                </Link>
              </>
            )}
          </div>

          {/* Right side: view toggle + CTA */}
          <div className="flex items-center gap-3">
            {/* View toggle */}
            {onViewChange && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs sm:text-sm"
                onClick={() => onViewChange(isBusiness ? "buyer" : "business")}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isBusiness ? "Për blerës" : "Për biznese"}
                </span>
                <span className="sm:hidden">
                  {isBusiness ? "Blerës" : "Biznese"}
                </span>
              </Button>
            )}

            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/auth">Hyr</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth?mode=signup">
                {isBusiness ? "Regjistro biznesin" : "Fillo falas"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
