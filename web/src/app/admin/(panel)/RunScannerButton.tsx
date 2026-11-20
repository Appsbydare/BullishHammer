"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runScannerAction } from "../actions";
import type { RunSummary } from "@/lib/scanner/run";

export default function RunScannerButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<RunSummary | null>(null);
  const router = useRouter();

  return (
    <div style={{ textAlign: "right" }}>
      <button
        className="btn btn-gold"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setResult(await runScannerAction());
            router.refresh();
          })
        }
      >
        {pending ? "Scanning… (~70s)" : "Run scanner now"}
      </button>
      {result && (
        <p className="small muted" style={{ marginTop: 6 }}>
          {result.status}: {result.symbolsScanned} symbols, {result.signalsFound} new signals
          {result.errors.length ? `, ${result.errors.length} errors` : ""}
        </p>
      )}
    </div>
  );
}
