import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Container } from "./Container";
import { cn } from "@/lib/utils";

type NavLink = { to: string; label: string };

const PRIMARY_NAV: NavLink[] = [
  { to: "/academy", label: "Academy" },
  { to: "/global-education", label: "Global Hub" },
  { to: "/technologies", label: "Technologies" },
  { to: "/about", label: "About" },
  { to: "/blog", label: "Blog" },
  { to: "/careers", label: "Careers" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border/60"
      aria-label="Primary"
    >
      <Container className="h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link
            to="/"
            className="font-display font-semibold tracking-tight text-xl text-ink"
            aria-label="HIGAET — home"
          >
            HIGAET
          </Link>
          <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {PRIMARY_NAV.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="hover:text-ink transition-colors"
                  activeProps={{ className: "text-ink" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/auth/login"
            className="text-sm font-medium text-muted-foreground hover:text-ink transition-colors px-3 py-2"
          >
            Login
          </Link>
          <Link
            to="/auth/register"
            className="text-sm font-medium text-ink ring-1 ring-border hover:bg-muted/40 transition-colors px-3 py-2 rounded-md"
          >
            Sign Up
          </Link>
          <Link
            to="/contact"
            className={cn(
              "bg-ink text-surface text-sm font-medium py-2 pl-3 pr-3 inline-flex items-center gap-1.5 rounded-md ml-1",
              "ring-1 ring-ink hover:bg-ink/90 transition-colors",
            )}
          >
            Get Started
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center size-10 -mr-2 text-ink"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-surface">
          <Container className="py-4">
            <ul className="flex flex-col gap-3 text-sm font-medium">
              {PRIMARY_NAV.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="block py-2 text-muted-foreground hover:text-ink"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-border/60 mt-2 flex flex-col gap-2">
                <Link
                  to="/auth/login"
                  className="block py-2 text-muted-foreground hover:text-ink"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center py-2 px-3 rounded-md ring-1 ring-border text-ink text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  Sign Up
                </Link>
                <Link
                  to="/contact"
                  className="mt-1 inline-flex items-center gap-1.5 bg-ink text-surface text-sm font-medium py-2 px-3 rounded-md"
                  onClick={() => setOpen(false)}
                >
                  Get Started <ArrowRight className="size-4" />
                </Link>
              </li>
            </ul>
          </Container>
        </div>
      )}
    </nav>
  );
}
