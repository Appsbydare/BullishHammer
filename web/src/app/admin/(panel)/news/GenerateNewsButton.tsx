"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateNewsAction } from "../../actions";
import type { NewsRunResult } from "@/lib/news/generate";

export default function GenerateNewsButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<NewsRunResult | null>(null);
  const router = useRouter();

  return (
    <div style={{ textAlign: "right", maxWidth: 420 }}>
      <button
        className="btn btn-gold"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setResult(await generateNewsAction());
            router.refresh();
          })
        }
      >
        {pending ? "Researching and writing… (2–5 min)" : "Generate article now"}
      </button>
      {result && (
        <p className="small" style={{ marginTop: 6, color: result.status === "error" ? "var(--bear)" : "var(--muted)" }}>
          {result.status === "success" ? (
            <>
              {result.published ? "Published" : "Draft saved"} (${result.costUsd.toFixed(2)}).{" "}
              <Link href={`/admin/news/${result.articleId}`}>Review it →</Link>
            </>
          ) : (
            `${result.status}: ${result.error ?? ""}`
          )}
        </p>
      )}
    </div>
  );
}
