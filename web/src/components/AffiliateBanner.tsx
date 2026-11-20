"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  broker: string;
  name: string;
  src: string;
  width: number;
  height: number;
  blockedCountries: string[];
};

let geoPromise: Promise<string | null> | null = null;
/** Visitor country (ISO-2) from Vercel's geo header, fetched once per page load. */
export function visitorCountry(): Promise<string | null> {
  geoPromise ??= fetch("/api/geo")
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => (j?.country as string) ?? null)
    .catch(() => null);
  return geoPromise;
}

/**
 * Affiliate network banner (iframe). The network chooses the creative and risk
 * wording for the visitor's country. We only hide it where the broker is blocked.
 * Clicks inside a cross-origin iframe can't be observed directly, so a click is
 * inferred when the window loses focus to this iframe.
 */
export default function AffiliateBanner({ broker, name, src, width, height, blockedCountries }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (blockedCountries.length === 0) return;
    let live = true;
    visitorCountry().then((c) => {
      if (live && c && blockedCountries.includes(c)) setHidden(true);
    });
    return () => {
      live = false;
    };
  }, [blockedCountries]);

  useEffect(() => {
    const onBlur = () => {
      if (document.activeElement !== ref.current) return;
      const body = JSON.stringify({ broker, page: pathname });
      if (!navigator.sendBeacon?.("/api/track-click", new Blob([body], { type: "application/json" }))) {
        fetch("/api/track-click", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
      }
      // Return focus so a later click on the banner is counted too.
      setTimeout(() => window.focus(), 0);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [broker, pathname]);

  if (hidden) return null;
  return (
    <div className="banner-box">
      <span className="banner-label">Sponsored</span>
      <iframe
        ref={ref}
        src={src}
        width={width}
        height={height}
        title={`${name} advertisement`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        scrolling="no"
      />
    </div>
  );
}
