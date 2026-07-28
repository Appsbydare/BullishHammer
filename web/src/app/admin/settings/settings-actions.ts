"use server";

import { cookies } from "next/headers";
import { setAIConfig, AIProvider } from "@/lib/ai-config";

export async function saveSettingsAction(formData: FormData) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") {
    return { error: "Unauthorized" };
  }

  const provider = formData.get("provider") as AIProvider;
  const openrouterKey = (formData.get("openrouterKey") as string)?.trim();
  const openrouterModel = (formData.get("openrouterModel") as string)?.trim();
  const geminiKey = (formData.get("geminiKey") as string)?.trim();
  const geminiModel = (formData.get("geminiModel") as string)?.trim();

  if (!provider || !["openrouter", "gemini"].includes(provider)) {
    return { error: "Invalid provider." };
  }

  setAIConfig({
    provider,
    ...(openrouterKey && { openrouterKey }),
    ...(openrouterModel && { openrouterModel }),
    ...(geminiKey && { geminiKey }),
    ...(geminiModel && { geminiModel }),
  });

  return { success: true };
}
