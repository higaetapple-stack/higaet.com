import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/lib/analytics";

/**
 * Minimal cookie consent banner.
 * Gates GA4, GTM, Meta Pixel, Clarity. Persists choice in localStorage.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === "unset") setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    setConsent("granted");
    setVisible(false);
  };
  const decline = () => {
    setConsent("denied");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      className="fixed z-[60] left-4 right-4 bottom-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md bg-ink text-surface p-5 rounded-2xl shadow-2xl"
    >
      <h2 id="cookie-title" className="font-display text-base font-medium mb-2">
        We use cookies
      </h2>
      <p className="text-sm text-surface/70 mb-4 leading-relaxed">
        HIGAET uses cookies for analytics (Google Analytics, Meta Pixel) to improve the site. You can
        decline non-essential cookies. See our{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
        .
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={accept}
          className="bg-surface text-ink text-sm font-medium px-4 py-2 rounded-md hover:bg-surface/90 transition-colors"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={decline}
          className="ring-1 ring-surface/30 text-surface text-sm font-medium px-4 py-2 rounded-md hover:bg-surface/10 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
