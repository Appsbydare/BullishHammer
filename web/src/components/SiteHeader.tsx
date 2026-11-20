"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "@/lib/site";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = (href: string) => (pathname === href || pathname.startsWith(href + "/") ? "page" : undefined);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Bullish Hammer home">
          <Image src="/logo-mark.png" alt="" width={36} height={36} priority />
          <span className="brand-name">
            Bullish<span>Hammer</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/scanner" className="btn btn-gold btn-sm header-cta">
          Live scanner
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
