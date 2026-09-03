import { Link } from "@tanstack/react-router";
import { Container } from "./Container";

const DIVISION_LINKS = [
  { to: "/academy", label: "HIGAET Academy" },
  { to: "/global-education", label: "Global Education Hub" },
  { to: "/technologies", label: "HIGAET Technologies" },
] as const;

const COMPANY_LINKS = [
  { to: "/about", label: "About" },
  { to: "/careers", label: "Careers" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
] as const;

const LEGAL_LINKS = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/cookies", label: "Cookie Policy" },
] as const;

export function Footer() {
  return (
    <footer className="pt-24 pb-12 px-6 border-t border-border bg-surface">
      <Container className="px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
          <div className="col-span-1">
            <Link
              to="/"
              className="font-display font-semibold text-xl tracking-tight block mb-6 text-ink"
            >
              HIGAET
            </Link>
            <p className="text-sm text-muted-foreground max-w-[28ch] leading-relaxed">
              Helen Institute of Gen AI Engineering &amp; Technology. The global benchmark for AI
              education and engineering excellence.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:hello@higaet.com" className="hover:text-ink transition-colors">
                  hello@higaet.com
                </a>
              </li>
              <li>
                <a href="mailto:info@higaet.com" className="hover:text-ink transition-colors">
                  info@higaet.com
                </a>
              </li>
              <li>
                <a href="tel:+917780686821" className="hover:text-ink transition-colors">
                  +91 7780686821
                </a>
              </li>
              <li>
                <a href="tel:+919491927094" className="hover:text-ink transition-colors">
                  +91 9491927094
                </a>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 col-span-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 block mb-6">
                Divisions
              </span>
              <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                {DIVISION_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="hover:text-ink transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 block mb-6">
                Company
              </span>
              <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="hover:text-ink transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Helen Institute of Gen AI Engineering &amp; Technology. All
            rights reserved.
          </span>
          <div className="flex gap-6 text-xs text-muted-foreground">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-ink transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
