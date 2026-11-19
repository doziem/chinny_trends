import { Instagram, Facebook, Mail, ArrowUpRight } from "lucide-react";
import { Brand } from "./Brand";
import { Link } from "react-router-dom";

export default function Footer() {
  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || "";
  return (
    <footer className="footer" id="contact">
      <div className="container footer-grid">
        <div>
          <Brand light />
          <p className="footer-copy">
            A celebration of African creativity, craftsmanship and contemporary
            style.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/shop">All designs</Link>
          <Link to="/collections">Collections</Link>
          <Link to="/#story">Our story</Link>
        </div>
        <div>
          <h4>Get in touch</h4>
          <a href="mailto:chinnytrends@gmail.com">
            <Mail size={15} /> Email the atelier
          </a>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp us <ArrowUpRight size={15} />
            </a>
          )}
          <a
            href="https://instagram.com/chinny_trends_fashion_world"
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={15} /> Instagram
          </a>
          <a
            href="https://facebook.com/Chinny_Trends"
            target="_blank"
            rel="noreferrer"
          >
            <Facebook size={15} /> Facebook
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Chinny Trends Fashion World.</span>
        <span>Made with intention.</span>
      </div>
    </footer>
  );
}
