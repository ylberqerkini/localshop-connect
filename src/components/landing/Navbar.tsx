import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Menu, X, User, Moon, Sun } from "lucide-react";
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

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src={eblejLogo}
              alt="eblej"
              className="h-10 sm:h-11 lg:h-12 w-auto max-w-[180px] object-contain"
            />
          </div>

          {/* Desktop Navigation Links */}
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
              <></>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {onViewChange && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sm"
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
          <div className="flex md:hidden items-center gap-2">
            {onViewChange && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => onViewChange(isBusiness ? "buyer" : "business")}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {isBusiness ? "Blerës" : "Biznese"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
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
                <Link to="/#si-funksionon" onClick={closeMenu} className="block px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors">
                  Si funksionon
                </Link>
                <Link to="/#benefitet" onClick={closeMenu} className="block px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors">
                  Benefitet
                </Link>
                <Link to="/#cmimet" onClick={closeMenu} className="block px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors">
                  Çmimet
                </Link>
              </>
            ) : (
              <></>
            )}

            {isBusiness && (
              <div className="pt-3 mt-3 border-t border-border/50 flex flex-col gap-2">
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <Link to="/auth" onClick={closeMenu}>Hyr</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth?mode=signup" onClick={closeMenu}>Regjistro biznesin</Link>
                </Button>
              </div>
            )}
            {!isBusiness && (
              <div className="pt-3 mt-3 border-t border-border/50 flex flex-col gap-2">
                {user ? (
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
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
