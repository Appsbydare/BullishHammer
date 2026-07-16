"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get("password");
  
  // Fake delay for smooth UX transition
  await new Promise(r => setTimeout(r, 500));
  
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    // For server actions that redirect after setting cookies, you don't actually need to return a redirect if the parent layout detects the cookie change.
    // However, revalidating the layout is necessary so it re-renders.
    revalidatePath("/admin");
    return { success: true };
  } else {
    return { error: "Invalid password. Please try again." };
  }
}

export async function approveDraft(formData: FormData) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") return;
  const id = formData.get("id") as string;
  
  const { writeClient } = await import("@/sanity/write-client");
  await writeClient.patch(id).set({ status: 'published' }).commit();
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteDraft(formData: FormData) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") return;
  const id = formData.get("id") as string;
  
  const { writeClient } = await import("@/sanity/write-client");
  await writeClient.delete(id);
  revalidatePath("/admin");
}

export async function updatePlacements(formData: FormData) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "true") {
    console.error("Unauthorized");
    return;
  }
  
  const articleId = formData.get("articleId") as string;
  const slot1 = formData.get("slot1") as string;
  const slot2 = formData.get("slot2") as string;
  
  if (!articleId) {
    console.error("Missing article ID");
    return;
  }

  const sponsorPlacements: any = {};
  
  if (slot1 && slot1 !== "none") {
    sponsorPlacements.slot1 = { _type: 'reference', _ref: slot1 };
  }
  
  if (slot2 && slot2 !== "none") {
    sponsorPlacements.slot2 = { _type: 'reference', _ref: slot2 };
  }

  const { writeClient } = await import("@/sanity/write-client");
  
  try {
    const patch = writeClient.patch(articleId);
    
    if (Object.keys(sponsorPlacements).length > 0) {
      patch.set({ sponsorPlacements });
    }
    
    const unsets = [];
    if (!slot1 || slot1 === "none") unsets.push('sponsorPlacements.slot1');
    if (!slot2 || slot2 === "none") unsets.push('sponsorPlacements.slot2');
    
    if (unsets.length > 0) {
      patch.unset(unsets);
    }
    
    await patch.commit();
    revalidatePath("/admin/sponsors");
    revalidatePath("/admin");
    revalidatePath("/");
  } catch (error: any) {
    console.error("Failed to update placements:", error.message);
  }
}
