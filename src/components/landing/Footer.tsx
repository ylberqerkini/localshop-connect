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

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produkti</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-background transition-colors">Karakteristikat</a></li>
              <li><a href="#cmimet" className="hover:text-background transition-colors">Çmimet</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Integrimi</a></li>
              <li><a href="#" className="hover:text-background transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Kompania</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-background transition-colors">Rreth nesh</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Karriera</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Press</a></li>
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
              <a href="#" className="hover:text-background transition-colors">Politika e privatësisë</a>
              <a href="#" className="hover:text-background transition-colors">Kushtet e shërbimit</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
