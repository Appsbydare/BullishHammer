import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container" style={{ padding: "80px 16px", textAlign: "center" }}>
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="muted">That page doesn&apos;t exist or has moved.</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/scanner" className="btn btn-gold">
            Open the scanner
          </Link>
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
