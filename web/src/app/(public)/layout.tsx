import Preloader from "@/components/Preloader";
import ThemeToggle from "@/components/ThemeToggle";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Preloader />
      <header className="animate-slide-down" style={{ animationDelay: '1.2s', opacity: 0, animationFillMode: 'forwards' }}>
        <div className="container top-header">
          <div className="header-left">
            <span>Home</span>
            <span>Topics</span>
          </div>
          <div className="logo-center">
            <a href="/"><h1>Bullish Hammer</h1></a>
          </div>
          <div className="header-right">
            <ThemeToggle />
          </div>
        </div>
        <div className="nav-bar-wrapper">
          <div className="nav-bar container">
            <a href="/" className="active">Home</a>
            <a href="#">Markets</a>
            <a href="#">Economy</a>
            <a href="#">Analysis</a>
            <a href="#">Podcasts</a>
            <a href="#">TV</a>
          </div>
        </div>
      </header>
      <main className="main-content animate-fade-in" style={{ animationDelay: '1.6s', opacity: 0, animationFillMode: 'forwards' }}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Bullish Hammer. All rights reserved.</p>
        </div>
      </footer>

    </>
  );
}
