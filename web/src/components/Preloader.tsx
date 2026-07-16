"use client";
import { useEffect, useState } from "react";

export default function Preloader() {
  const [state, setState] = useState<"loading" | "fading" | "done">("loading");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setState("fading"), 800);
    const doneTimer = setTimeout(() => setState("done"), 1600); 
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, []);

  if (state === "done") return null;

  return (
    <div className={`preloader ${state === "fading" ? "fade-out" : ""}`}>
      <div className="preloader-content animate-fade-in-slow">
        <h1 className="preloader-logo">Bullish Hammer</h1>
      </div>
    </div>
  );
}
