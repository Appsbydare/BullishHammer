"use server";

import { revalidatePath } from "next/cache";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(prevState: any, formData: FormData) {
  try {
    // Fake delay for smooth UX transition
    await new Promise(r => setTimeout(r, 500));
    
    // Auth.js will automatically handle the redirect on success
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid password. Please try again." };
        default:
          return { error: "Authentication failed." };
      }
    }
    throw error; // Rethrow necessary Next.js errors like NEXT_REDIRECT
  }
}

export async function approveDraft(formData: FormData) {
  const session = await auth();
  if (!session) return;
  const id = formData.get("id") as string;
  
  const { writeClient } = await import("@/sanity/write-client");
  await writeClient.patch(id).set({ status: 'published' }).commit();
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteDraft(formData: FormData) {
  const session = await auth();
  if (!session) return;
  const id = formData.get("id") as string;
  
  const { writeClient } = await import("@/sanity/write-client");
  await writeClient.delete(id);
  revalidatePath("/admin");
}

export async function updatePlacements(formData: FormData) {
  const session = await auth();
  if (!session) {
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
