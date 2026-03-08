import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import eblejLogo from "@/assets/eblej.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src={eblejLogo}
                alt="eblej - Kthehu në faqen kryesore"
                className="h-10 sm:h-12 w-auto max-w-[200px] object-contain"
              />
            </Link>
            <p className="text-muted-foreground text-sm mb-6">
              Platforma e shitjeve online për bizneset lokale në Kosovë dhe Shqipëri.
            </p>
          </div>

          {/* Buyer Links */}
          <div>
            <h4 className="font-semibold mb-4">Për blerës</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/marketplace" className="hover:text-background transition-colors">Eksploro produktet</Link></li>
              <li><Link to="/" className="hover:text-background transition-colors">Kryefaqja</Link></li>
              <li><Link to="/auth?role=buyer" className="hover:text-background transition-colors">Krijo llogari</Link></li>
            </ul>
          </div>

          {/* Business Links */}
          <div>
            <h4 className="font-semibold mb-4">Për biznese</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/?view=business" className="hover:text-background transition-colors">Si funksionon</Link></li>
              <li><Link to="/?view=business#cmimet" className="hover:text-background transition-colors">Çmimet</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-background transition-colors">Regjistro biznesin</Link></li>
              <li><Link to="/auth" className="hover:text-background transition-colors">Hyr në panel</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@eblej.com" className="hover:text-background transition-colors">info@eblej.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+38344123456" className="hover:text-background transition-colors">+383 44 123 456</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Prishtinë, Kosovë</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-muted-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} eblej.com. Të gjitha të drejtat e rezervuara.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-background transition-colors">Politika e privatësisë</Link>
              <Link to="/terms" className="hover:text-background transition-colors">Kushtet e shërbimit</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
