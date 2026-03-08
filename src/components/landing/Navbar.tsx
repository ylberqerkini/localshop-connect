import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Menu, X, User, Moon, Sun, ShoppingBag, Search, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import eblejLogo from "@/assets/eblej.png";

interface NavbarProps {
  view?: "buyer" | "business";
  onViewChange?: (view: "buyer" | "business") => void;
}

const Navbar = ({ view = "buyer", onViewChange }: NavbarProps) => {
  const isBusiness = view === "business";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const closeMenu = () => setMobileOpen(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      isActive(path)
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground"
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block px-3 py-2.5 rounded-lg transition-colors ${
      isActive(path)
        ? "text-primary bg-primary/5 font-medium"
        : "text-foreground hover:bg-muted"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src={eblejLogo}
              alt="eblej"
              className="h-10 sm:h-11 lg:h-12 w-auto max-w-[180px] object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {isBusiness ? (
              <>
                <Link to="/#si-funksionon" className={navLinkClass("/#si-funksionon")}>
                  Si funksionon
                </Link>
                <Link to="/#benefitet" className={navLinkClass("/#benefitet")}>
                  Benefitet
                </Link>
                <Link to="/#cmimet" className={navLinkClass("/#cmimet")}>
                  Çmimet
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className={navLinkClass("/")}>
                  Kryefaqja
                </Link>
                <Link to="/marketplace" className={navLinkClass("/marketplace")}>
                  Marketplace
                </Link>
              </>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Ndrysho temën" className="h-9 w-9">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {!isBusiness && (
              <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                <Link to="/marketplace" aria-label="Kërko produkte">
                  <Search className="w-4 h-4" />
                </Link>
              </Button>
            )}

            {onViewChange && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => onViewChange(isBusiness ? "buyer" : "business")}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {isBusiness ? "Për blerës" : "Për biznese"}
              </Button>
            )}

            {isBusiness && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Hyr</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth?mode=signup">Regjistro biznesin</Link>
                </Button>
              </>
            )}

            {!isBusiness && (
              user ? (
                <Button variant="ghost" size="sm" className="gap-2" asChild>
                  <Link to="/account">
                    <User className="w-4 h-4" />
                    Llogaria
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth?role=buyer">Hyr</Link>
                  </Button>
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/auth?mode=signup&role=buyer">Regjistrohu</Link>
                  </Button>
                </>
              )
            )}
          </div>

          {/* Mobile: toggle + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Ndrysho temën" className="h-8 w-8">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {!isBusiness && (
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link to="/marketplace" aria-label="Kërko">
                  <Search className="w-4 h-4" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="h-8 w-8">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg animate-fade-up">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {isBusiness ? (
              <>
                <Link to="/#si-funksionon" onClick={closeMenu} className={mobileNavLinkClass("/#si-funksionon")}>
                  Si funksionon
                </Link>
                <Link to="/#benefitet" onClick={closeMenu} className={mobileNavLinkClass("/#benefitet")}>
                  Benefitet
                </Link>
                <Link to="/#cmimet" onClick={closeMenu} className={mobileNavLinkClass("/#cmimet")}>
                  Çmimet
                </Link>
              </>
            ) : (
              <>
                <Link to="/" onClick={closeMenu} className={mobileNavLinkClass("/")}>
                  🏠 Kryefaqja
                </Link>
                <Link to="/marketplace" onClick={closeMenu} className={mobileNavLinkClass("/marketplace")}>
                  🛍️ Marketplace
                </Link>
              </>
            )}

            {/* View toggle */}
            {onViewChange && (
              <button
                onClick={() => { onViewChange(isBusiness ? "buyer" : "business"); closeMenu(); }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                {isBusiness ? "Kalo te blerësi" : "Kalo te bizneset"}
              </button>
            )}

            {/* Auth section */}
            <div className="pt-3 mt-3 border-t border-border/50 flex flex-col gap-2">
              {isBusiness ? (
                <>
                  <Button variant="ghost" size="sm" className="justify-start" asChild>
                    <Link to="/auth" onClick={closeMenu}>Hyr</Link>
                  </Button>
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/auth?mode=signup" onClick={closeMenu}>Regjistro biznesin</Link>
                  </Button>
                </>
              ) : user ? (
                <Button variant="ghost" size="sm" className="justify-start gap-2" asChild>
                  <Link to="/account" onClick={closeMenu}>
                    <User className="w-4 h-4" />
                    Llogaria ime
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="justify-start" asChild>
                    <Link to="/auth?role=buyer" onClick={closeMenu}>Hyr</Link>
                  </Button>
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/auth?mode=signup&role=buyer" onClick={closeMenu}>Regjistrohu</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
