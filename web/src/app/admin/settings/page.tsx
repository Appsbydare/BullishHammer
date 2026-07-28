import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAIConfig } from "@/lib/ai-config";
import SettingsForm from "./SettingsForm";

function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? "••••••••" : "Not set";
  return key.slice(0, 6) + "••••••••••••" + key.slice(-4);
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") {
    redirect("/admin");
  }

  const cfg = getAIConfig();

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>AI Settings</h1>
          <p style={{ margin: "0.5rem 0 0", color: "#666", fontSize: "0.9rem" }}>
            Configure your AI provider and model. Changes apply immediately without a server restart.
          </p>
        </div>
        <div className="settings-active-badge">
          <span className="settings-active-dot" />
          Active:{" "}
          <strong>
            {cfg.provider === "openrouter"
              ? `OpenRouter · ${cfg.openrouterModel}`
              : `Gemini · ${cfg.geminiModel}`}
          </strong>
        </div>
      </header>

      <section className="admin-section">
        <SettingsForm
          initialProvider={cfg.provider}
          initialOpenrouterModel={cfg.openrouterModel}
          initialGeminiModel={cfg.geminiModel}
          maskedOpenrouterKey={maskKey(cfg.openrouterKey)}
          maskedGeminiKey={maskKey(cfg.geminiKey)}
        />
      </section>

      {/* Info Card */}
      <section className="admin-section">
        <div className="settings-info-card">
          <h3>ℹ Provider Notes</h3>
          <ul>
            <li>
              <strong>OpenRouter</strong> — Aggregates 100+ models. Free models are marked with
              "free" in the model ID. Great for high-volume generation at zero cost.
            </li>
            <li>
              <strong>Google Gemini</strong> — Direct Google API. Flash models are fast and cheap;
              Pro models offer higher quality for long-form content.
            </li>
            <li>
              Settings are held in-memory. If you restart the dev server, they reset to
              the values in <code>.env.local</code>. Update that file to make them permanent.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
