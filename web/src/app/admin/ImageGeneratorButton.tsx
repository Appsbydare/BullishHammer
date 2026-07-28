"use client";

import { useState } from "react";
import { generateImagePromptAction, applyImageToArticleAction } from "./ai-actions";

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
  const [stage, setStage] = useState<"idle" | "prompting" | "generating" | "preview">("idle");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [base64Data, setBase64Data] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const startGeneration = async () => {
    setIsOpen(true);
    setStage("prompting");

    // 1. Generate Prompt via AI
    const promptRes = await generateImagePromptAction(title, excerpt);
    if (!promptRes.success || !promptRes.prompt) {
      alert("Failed to generate prompt: " + promptRes.error);
      setIsOpen(false);
      setStage("idle");
      return;
    }
    
    setImagePrompt(promptRes.prompt);
    
    // 2. Fetch from Pollinations
    await fetchImage(promptRes.prompt);
  };

  const fetchImage = async (prompt: string) => {
    setStage("generating");
    try {
      const seed = Math.floor(Math.random() * 2000000000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&model=sana&nologo=true&enhance=true&seed=${seed}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Image generation failed");
      
      const blob = await res.blob();
      
      // Convert to base64 for preview and upload
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setBase64Data(base64);
        setImageUrl(base64); // Data URL
        
        setIsTransitioning(true);
        setTimeout(() => {
          setStage("preview");
          setIsTransitioning(false);
        }, 400);
      };
      reader.readAsDataURL(blob);
      
    } catch (err: any) {
      alert("Error generating image: " + err.message);
      setIsOpen(false);
      setStage("idle");
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    const res = await applyImageToArticleAction(articleId, base64Data, "image/jpeg");
    setIsApplying(false);
    
    if (res.success) {
      setIsOpen(false);
      setStage("idle");
    } else {
      alert("Failed to apply: " + res.error);
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
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            
            {stage === "prompting" && (
              <div className={`admin-modal-loading ${isTransitioning ? 'fade-out' : ''}`}>
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
              <div className={`admin-modal-loading ${isTransitioning ? 'fade-out' : ''}`}>
                <div className="admin-loader-visual" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <h3>Generating Image</h3>
                <p>Creating high-quality cinematic cover.</p>
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
                    onClick={() => { setIsOpen(false); setStage("idle"); }}
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
