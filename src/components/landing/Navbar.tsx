import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

const Navbar = () => {
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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
              Dyqanet
            </Link>
            <a href="#si-funksionon" className="text-muted-foreground hover:text-foreground transition-colors">
              Si funksionon
            </a>
            <a href="#benefitet" className="text-muted-foreground hover:text-foreground transition-colors">
              Benefitet
            </a>
            <a href="#cmimet" className="text-muted-foreground hover:text-foreground transition-colors">
              Çmimet
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/auth">Hyr</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth?mode=signup">Fillo falas</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
