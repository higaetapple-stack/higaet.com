import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Top-level page shell shared across the entire HIGAET ecosystem.
 * Children render between sticky header and footer.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-4 focus:left-4 focus:bg-ink focus:text-surface focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
