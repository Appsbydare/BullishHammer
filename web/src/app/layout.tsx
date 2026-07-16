import type { Metadata } from "next";
import "./globals.css";
import Preloader from "@/components/Preloader";
import ThemeToggle from "@/components/ThemeToggle";
import LenisProvider from "@/components/LenisProvider";

export const metadata: Metadata = {
  title: "Bullish Hammer | Premium FX Insights",
  description: "Retail FX trading publication and news.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
