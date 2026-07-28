"use client";

import { useState, useEffect, useTransition } from "react";
import { saveSettingsAction } from "./settings-actions";
import { AIProvider } from "@/lib/ai-config";

interface Model {
  id: string;
  name: string;
  context: number | null;
  description: string;
}

const GEMINI_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash 8B" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  { id: "gemini-2.5-flash-preview-05-20", name: "Gemini 2.5 Flash Preview" },
  { id: "gemini-2.5-pro-preview-06-05", name: "Gemini 2.5 Pro Preview" },
];

interface Props {
  initialProvider: AIProvider;
  initialOpenrouterModel: string;
  initialGeminiModel: string;
  maskedOpenrouterKey: string;
  maskedGeminiKey: string;
}

export default function SettingsForm({
  initialProvider,
  initialOpenrouterModel,
  initialGeminiModel,
  maskedOpenrouterKey,
  maskedGeminiKey,
}: Props) {
  const [provider, setProvider] = useState<AIProvider>(initialProvider);
  const [orModel, setOrModel] = useState(initialOpenrouterModel);
  const [geminiModel, setGeminiModel] = useState(initialGeminiModel);
  const [orKey, setOrKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  const [orModels, setOrModels] = useState<Model[]>([]);
  const [orLoading, setOrLoading] = useState(false);
  const [orError, setOrError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState("");

  // Load OpenRouter free models on mount / when provider switches to openrouter
  useEffect(() => {
    if (provider !== "openrouter") return;
    setOrLoading(true);
    setOrError(null);
    fetch("/api/openrouter-models")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrModels(data.models || []);
      })
      .catch((e) => setOrError(e.message))
      .finally(() => setOrLoading(false));
  }, [provider]);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaveStatus("idle");

    startTransition(async () => {
      const res = await saveSettingsAction(fd);
      if (res?.error) {
        setSaveStatus("error");
        setSaveMsg(res.error);
      } else {
        setSaveStatus("success");
        setSaveMsg("Settings saved! Active for this server session.");
        setTimeout(() => setSaveStatus("idle"), 4000);
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="settings-form">

      {/* ── Provider selector ──────────────────────────────── */}
      <input type="hidden" name="provider" value={provider} />
      <div className="settings-group">
        <label className="settings-label">AI Provider</label>
        <div className="settings-provider-tabs">
          <button
            type="button"
            className={`settings-tab ${provider === "openrouter" ? "active" : ""}`}
            onClick={() => setProvider("openrouter")}
          >
            <span className="settings-tab-icon">🔀</span>
            OpenRouter
            <span className="settings-tab-badge free">Free Models</span>
          </button>
          <button
            type="button"
            className={`settings-tab ${provider === "gemini" ? "active" : ""}`}
            onClick={() => setProvider("gemini")}
          >
            <span className="settings-tab-icon">✨</span>
            Google Gemini
          </button>
        </div>
      </div>

      {/* ── OpenRouter panel ───────────────────────────────── */}
      {provider === "openrouter" && (
        <div className="settings-panel animate-fade-in">
          <div className="settings-group">
            <label className="settings-label" htmlFor="or-key">
              OpenRouter API Key
            </label>
            <p className="settings-hint">Current: <code>{maskedOpenrouterKey}</code></p>
            <input
              id="or-key"
              name="openrouterKey"
              type="password"
              className="settings-input"
              placeholder="Leave blank to keep current key"
              value={orKey}
              onChange={(e) => setOrKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="settings-group">
            <label className="settings-label" htmlFor="or-model">
              Model
              <span className="settings-label-badge">Free only</span>
            </label>

            {orLoading && (
              <div className="settings-loading">
                <svg className="admin-spinner" viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, display: 'inline-block', marginRight: 8 }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                </svg>
                Fetching free models from OpenRouter…
              </div>
            )}

            {orError && (
              <div className="settings-error">⚠ {orError}</div>
            )}

            {!orLoading && !orError && orModels.length > 0 && (
              <>
                <select
                  id="or-model"
                  name="openrouterModel"
                  className="settings-select"
                  value={orModel}
                  onChange={(e) => setOrModel(e.target.value)}
                >
                  {orModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.context ? ` · ${(m.context / 1000).toFixed(0)}k ctx` : ""}
                    </option>
                  ))}
                </select>
                <p className="settings-hint">
                  {orModels.length} free models available · <strong>Selected:</strong> <code>{orModel}</code>
                </p>
              </>
            )}

            {!orLoading && !orError && orModels.length === 0 && (
              <div className="settings-hint">No free models found. Check your API key.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Gemini panel ────────────────────────────────────── */}
      {provider === "gemini" && (
        <div className="settings-panel animate-fade-in">
          <div className="settings-group">
            <label className="settings-label" htmlFor="gemini-key">
              Gemini API Key
            </label>
            <p className="settings-hint">Current: <code>{maskedGeminiKey}</code></p>
            <input
              id="gemini-key"
              name="geminiKey"
              type="password"
              className="settings-input"
              placeholder="Leave blank to keep current key"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="settings-group">
            <label className="settings-label" htmlFor="gemini-model">Model</label>
            <select
              id="gemini-model"
              name="geminiModel"
              className="settings-select"
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className="settings-hint">
              <strong>Selected:</strong> <code>{geminiModel}</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Save ─────────────────────────────────────────────── */}
      <div className="settings-footer">
        {saveStatus === "success" && (
          <div className="settings-toast success">✓ {saveMsg}</div>
        )}
        {saveStatus === "error" && (
          <div className="settings-toast error">⚠ {saveMsg}</div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className={`admin-btn admin-btn-primary settings-save-btn ${isPending ? "is-loading" : ""}`}
        >
          {isPending ? (
            <>
              <svg className="admin-spinner" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
              </svg>
              <span className="btn-pending-text">Saving…</span>
            </>
          ) : (
            <span className="btn-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Settings
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
