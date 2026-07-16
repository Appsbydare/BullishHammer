import "./admin.css";
import { cookies } from "next/headers";
import AdminNav from "./AdminNav";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isAuthenticated = session?.value === "true";

  if (!isAuthenticated) {
    return (
      <div className="admin-layout-wrapper admin-login-bg">
        {children}
      </div>
    );
  }

  return (
    <div className="admin-layout-wrapper">
      <aside className="admin-sidebar animate-slide-right">
        <div className="admin-logo">
          <a href="/admin">Bullish Hammer</a>
        </div>
        <AdminNav />
      </aside>
      <main className="admin-main-content animate-fade-in">
        {children}
      </main>
    </div>
  );
}
