import Image from "next/image";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <Image src="/logo-mark.png" alt="" width={56} height={56} />
        <h1>Bullish Hammer admin</h1>
        <LoginForm />
      </div>
    </div>
  );
}
