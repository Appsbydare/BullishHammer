import { createClient } from "next-sanity";

export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2026-07-15",
  useCdn: false, // Must be false for writes
  token: process.env.SANITY_API_WRITE_TOKEN,
});
