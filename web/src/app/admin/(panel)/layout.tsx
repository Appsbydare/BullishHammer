import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "Scanner" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/symbols", label: "Symbols" },
  { href: "/admin/affiliates", label: "Affiliates" },
  { href: "/admin/brokers", label: "Broker reviews" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/" className="admin-brand">
          Bullish<span>Hammer</span>
        </Link>
        <nav>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <button className="btn btn-ghost btn-sm">Sign out</button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
