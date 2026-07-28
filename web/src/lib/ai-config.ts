/**
 * ai-config.ts
 * Runtime in-memory AI provider configuration.
 * Initialised from .env.local on server boot.
 * Can be changed at runtime via saveSettingsAction() — no restart required.
 */

export type AIProvider = "openrouter" | "gemini";

export interface AIConfig {
  provider: AIProvider;
  openrouterKey: string;
  openrouterModel: string;
  geminiKey: string;
  geminiModel: string;
}

// ── Singleton ────────────────────────────────────────────────────────────────
// Use globalThis so Hot-Module-Reload doesn't create a fresh instance every time.
const g = globalThis as typeof globalThis & { __aiConfig?: AIConfig };

if (!g.__aiConfig) {
  g.__aiConfig = {
    provider: (process.env.AI_PROVIDER as AIProvider) || "openrouter",
    openrouterKey: process.env.OPENROUTER_API_KEY || "",
    openrouterModel:
      process.env.OPENROUTER_MODEL ||
      "meta-llama/llama-3.3-8b-instruct:free",
    geminiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  };
}

export function getAIConfig(): AIConfig {
  return g.__aiConfig!;
}

export function setAIConfig(patch: Partial<AIConfig>): void {
  g.__aiConfig = { ...g.__aiConfig!, ...patch };
}
