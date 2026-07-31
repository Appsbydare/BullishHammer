"use client";

import { useState, useCallback } from "react";
import { generateImagePromptAction, applyImageToArticleAction } from "./ai-actions";

type Stage = "idle" | "prompting" | "generating" | "preview" | "error";

export default function ImageGeneratorButton({
  articleId,
  title,
  excerpt,
}: {
  articleId: string;
  title: string;
  excerpt: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [base64Data, setBase64Data] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setStage("idle");
    setErrorMessage("");
    setImagePrompt("");
    setImageUrl("");
    setBase64Data("");
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setStage("error");
  }, []);

  const fetchImage = useCallback(async (prompt: string) => {
    setStage("generating");
    try {
      const seed = Math.floor(Math.random() * 2000000000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&model=sana&nologo=true&enhance=true&seed=${seed}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error("Pollinations returned " + res.status);

      const blob = await res.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBase64Data(base64);
        setImageUrl(base64);
        setStage("preview");
      };
      reader.onerror = () => showError("Failed to read image data.");
      reader.readAsDataURL(blob);
    } catch (err: any) {
      const msg = err?.name === "TimeoutError"
        ? "Image generation timed out. Please retry."
        : "Image generation failed: " + (err?.message || "Unknown error");
      showError(msg);
    }
  }, [showError]);

  const startGeneration = async () => {
    setIsOpen(true);
    setStage("prompting");
    setErrorMessage("");

    try {
      const promptRes = await generateImagePromptAction(title, excerpt);

      if (!promptRes.success || !promptRes.prompt) {
        showError("Failed to generate prompt: " + (promptRes.error || "Unknown error"));
        return;
      }

      const resolvedPrompt = promptRes.prompt;
      setImagePrompt(resolvedPrompt);
      await fetchImage(resolvedPrompt);
    } catch (err: any) {
      showError("Unexpected error: " + (err?.message || "Unknown error"));
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const res = await applyImageToArticleAction(articleId, base64Data, "image/jpeg");
      if (res.success) {
        closeModal();
      } else {
        showError("Failed to apply image: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      showError("Unexpected error: " + (err?.message || "Unknown error"));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={startGeneration}
        className="admin-btn admin-btn-secondary admin-btn-compact"
      >
        Gen Image
      </button>

      {isOpen && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isApplying) closeModal(); }}>
          <div className="admin-modal">

            {/* Close button always visible */}
            <button
              className="admin-modal-close"
              onClick={closeModal}
              aria-label="Close"
              disabled={isApplying}
            >
              ✕
            </button>

            {stage === "prompting" && (
              <div className="admin-modal-loading">
                <div className="admin-loader-visual" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <h3>Analyzing Article</h3>
                <p>Generating custom visual prompt using AI.</p>
              </div>
            )}

            {stage === "generating" && (
              <div className="admin-modal-loading">
                <div className="admin-loader-visual" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <h3>Generating Image</h3>
                <p>Creating high-quality cinematic cover.</p>
              </div>
            )}

            {stage === "error" && (
              <div className="admin-modal-error">
                <div className="admin-modal-error-icon">⚠</div>
                <h3>Something went wrong</h3>
                <p>{errorMessage}</p>
                <div className="admin-modal-actions">
                  <button className="admin-btn" onClick={closeModal}>
                    Close
                  </button>
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => {
                      setErrorMessage("");
                      startGeneration();
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {stage === "preview" && (
              <div className="admin-modal-preview fade-down-in">
                <h3>Image Preview</h3>
                <div className="admin-modal-image-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Generated Cover" />
                </div>

                <div className="admin-modal-prompt">
                  <p><strong>AI Prompt:</strong> {imagePrompt}</p>
                </div>

                <div className="admin-modal-actions">
                  <button
                    className="admin-btn"
                    onClick={closeModal}
                    disabled={isApplying}
                  >
                    Discard
                  </button>
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => fetchImage(imagePrompt)}
                    disabled={isApplying}
                  >
                    Retry
                  </button>
                  <button
                    className="admin-btn admin-btn-success"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? "Applying..." : "Apply"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
