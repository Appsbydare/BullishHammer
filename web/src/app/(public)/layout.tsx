import Link from "next/link";
import Preloader from "@/components/Preloader";
import ThemeToggle from "@/components/ThemeToggle";
import { getNavCategories } from "@/lib/navigation";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getNavCategories();

  return (
    <>
      <Preloader />
      <header className="animate-slide-down" style={{ animationDelay: '1.2s', opacity: 0, animationFillMode: 'forwards' }}>
        <div className="container top-header">
          <div className="header-left">
            <Link href="/">Home</Link>
            <Link href="/topics">Topics</Link>
          </div>
          <div className="logo-center">
            <Link href="/"><h1>Bullish Hammer</h1></Link>
          </div>
          <div className="header-right">
            <ThemeToggle />
          </div>
        </div>
        <div className="nav-bar-wrapper">
          <nav className="nav-bar container" aria-label="Sections">
            <Link href="/">Home</Link>
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`}>
                {cat.title}
              </Link>
            ))}
            <Link href="/topics">Topics</Link>
          </nav>
        </div>
      </header>
      <main className="main-content animate-fade-in" style={{ animationDelay: '1.6s', opacity: 0, animationFillMode: 'forwards' }}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">Bullish Hammer</span>
            <p>Premium retail FX trading and market analysis.</p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <Link href="/">Home</Link>
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/category/${cat.slug}`}>
                {cat.title}
              </Link>
            ))}
            <Link href="/topics">Topics</Link>
          </nav>
          <p className="footer-legal">
            &copy; {new Date().getFullYear()} Bullish Hammer. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
