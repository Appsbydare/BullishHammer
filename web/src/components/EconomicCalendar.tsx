"use client";

import { useEffect, useRef } from "react";

/**
 * TradingView economic calendar widget (free embed). The script reads its JSON config from its own
 * body and renders an iframe into the container, so it is injected after mount.
 */
export default function EconomicCalendar({ height = 640 }: { height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: false,
      width: "100%",
      height,
      locale: "en",
      importanceFilter: "0,1",
      countryFilter: "us,eu,gb,jp,au,ca,ch,nz,cn,de",
    });
    host.appendChild(script);
    return () => {
      host.innerHTML = "";
    };
  }, [height]);

  return (
    <div className="calendar-frame" style={{ minHeight: height }}>
      <div className="tradingview-widget-container" ref={ref} />
      <noscript>Turn on JavaScript to see the economic calendar.</noscript>
    </div>
  );
}
