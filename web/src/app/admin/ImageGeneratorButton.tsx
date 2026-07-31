"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { generateImagePromptAction, applyImageToArticleAction, fetchImageFromPollinationsAction } from "./ai-actions";

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
  const [mounted, setMounted] = useState(false);

  // Needed for createPortal — ensure we only render after hydration
  useEffect(() => { setMounted(true); }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

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
      const res = await fetchImageFromPollinationsAction(prompt);
      if (!res.success || !res.dataUrl) {
        showError(res.error || "Image generation failed.");
        return;
      }
      setBase64Data(res.dataUrl);
      setImageUrl(res.dataUrl);
      setStage("preview");
    } catch (err: any) {
      showError("Unexpected error: " + (err?.message || "Unknown"));
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

  // Modal content rendered via createPortal to document.body
  // This bypasses ANY parent with transform/filter/will-change that breaks position:fixed
  const modalContent = isOpen && mounted ? createPortal(
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && stage !== "prompting" && stage !== "generating" && !isApplying) {
          closeModal();
        }
      }}
    >
      <div className="admin-modal">

        <button
          className="admin-modal-close"
          onClick={closeModal}
          aria-label="Close"
          disabled={isApplying || stage === "prompting" || stage === "generating"}
        >
          ✕
        </button>

        {stage === "prompting" && (
          <div className="admin-modal-loading" key="prompting">
            <div className="admin-loader-visual" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <h3>Analyzing Article</h3>
            <p>Generating custom visual prompt using AI.</p>
          </div>
        )}

        {stage === "generating" && (
          <div className="admin-modal-loading" key="generating">
            <div className="admin-loader-visual" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <h3>Generating Image</h3>
            <p>Creating high-quality cinematic cover.</p>
          </div>
        )}

        {stage === "error" && (
          <div className="admin-modal-error" key="error">
            <div className="admin-modal-error-icon">⚠</div>
            <h3>Something went wrong</h3>
            <p>{errorMessage}</p>
            <div className="admin-modal-actions">
              <button className="admin-btn" onClick={closeModal}>Close</button>
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
          <div className="admin-modal-preview" key="preview">
            <h3>Image Preview</h3>
            <div className="admin-modal-image-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Generated Cover" />
            </div>
            <div className="admin-modal-prompt">
              <p><strong>AI Prompt:</strong> {imagePrompt}</p>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn" onClick={closeModal} disabled={isApplying}>
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
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={startGeneration}
        className="admin-btn admin-btn-secondary admin-btn-compact"
      >
        Gen Image
      </button>
      {modalContent}
    </>
  );
}
