"use client";

import { useState } from "react";
import { fetchNewsAction, generateArticlePreviewAction, saveArticleDraftAction } from "./ai-actions";

export default function AiGeneratorForm() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("Forex");
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(new Set());
  const [customInstructions, setCustomInstructions] = useState("");
  
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories = ["All Latest News", "Forex", "Crypto", "Tech Stocks", "Commodities", "Global Economy"];

  async function handleFetchNews(e: React.FormEvent) {
    e.preventDefault();
    setIsFetching(true);
    setError(null);
    const res = await fetchNewsAction(category);
    if (res.error) {
      setError(res.error);
    } else {
      setNewsItems(res.data || []);
      // Auto-select top 3
      const top3 = (res.data || []).slice(0, 3).map((n: any) => n.uuid);
      setSelectedNewsIds(new Set(top3));
      setStep(2);
    }
    setIsFetching(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (selectedNewsIds.size === 0) {
      setError("Please select at least one news article.");
      return;
    }
    
    setIsGenerating(true);
    setIsPreviewOpen(true);
    setPreviewData(null);
    setError(null);
    
    const selectedNewsData = newsItems.filter(n => selectedNewsIds.has(n.uuid));
    
    const res = await generateArticlePreviewAction(selectedNewsData, customInstructions);
    if (res.error) {
      setError(res.error);
      setIsGenerating(false);
      setIsPreviewOpen(false);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setPreviewData(res.payload);
        setIsGenerating(false);
        setIsTransitioning(false);
      }, 400);
    }
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    const res = await saveArticleDraftAction(previewData);
    setIsSaving(false);

    if (res.error) {
      alert("Failed to save draft: " + res.error);
    } else {
      setIsPreviewOpen(false);
      setStep(1);
      setNewsItems([]);
      setCustomInstructions("");
    }
  }

  function toggleSelection(uuid: string) {
    const newSet = new Set(selectedNewsIds);
    if (newSet.has(uuid)) {
      newSet.delete(uuid);
    } else {
      newSet.add(uuid);
    }
    setSelectedNewsIds(newSet);
  }

  return (
    <div className="ai-generator-container">
      {error && <div className="error-message shake">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleFetchNews} className="ai-fetch-card">
          <div className="ai-fetch-head">
            <div>
              <h2>Article generator</h2>
              <p>Market source</p>
            </div>
            <span>{category}</span>
          </div>

          <div className="ai-topic-row" aria-label="Market category">
            {categories.map(c => (
              <button
                key={c}
                type="button"
                className={`ai-topic-pill ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="ai-form-row">
            <input
              list="news-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="admin-input ai-select"
              placeholder="Custom market topic"
            />
            <datalist id="news-categories">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
            <button type="submit" className={`admin-btn admin-btn-primary ${isFetching ? 'is-loading' : ''}`} disabled={isFetching}>
              {isFetching && <svg className="admin-spinner" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" /></svg>}
              <span className="btn-content" style={{ opacity: isFetching ? 0 : 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                Fetch News
              </span>
              {isFetching && <span className="btn-pending-text">Fetching...</span>}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleGenerate} className="ai-step-2 animate-fade-in">
          <div className="ai-news-list">
            <div className="ai-news-header">
              <div>
                <h4>{category}</h4>
                <p>{selectedNewsIds.size} of {newsItems.length} selected</p>
              </div>
              <button type="button" className="ai-link-button" onClick={() => setStep(1)} disabled={isGenerating}>Change source</button>
            </div>
            {newsItems.length === 0 ? <p>No news found.</p> : null}
            {newsItems.map(item => (
              <label key={item.uuid} className={`ai-news-item ${selectedNewsIds.has(item.uuid) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedNewsIds.has(item.uuid)}
                  onChange={() => toggleSelection(item.uuid)}
                />
                <div className="ai-news-content">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="ai-custom-instructions">
            <label>Custom Instructions for AI (Optional)</label>
            <textarea
              className="admin-input"
              rows={3}
              placeholder="e.g. Focus on the impact of interest rates..."
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
            />
          </div>

          <div className="ai-step-actions">
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-compact" onClick={() => setStep(1)} disabled={isGenerating}>Cancel</button>
            <button type="submit" className={`admin-btn admin-btn-success admin-btn-compact ${isGenerating ? 'is-loading' : ''}`} disabled={isGenerating || selectedNewsIds.size === 0}>
              <span className="btn-content">Generate Article</span>
            </button>
          </div>
        </form>
      )}

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-wide">

            {isGenerating && (
              <div className={`admin-modal-loading ${isTransitioning ? 'fade-out' : ''}`}>
                <div className="admin-loader-visual" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <h3>Drafting Article</h3>
                <p>Synthesizing news and generating a professional financial post.</p>
              </div>
            )}

            {!isGenerating && previewData && (
              <div className="admin-modal-preview fade-down-in">
                <h3>Review Generated Draft</h3>

                <div className="admin-modal-review">
                   <h2>{previewData.title}</h2>
                   <p className="admin-modal-excerpt">{previewData.excerpt}</p>

                   {previewData.coverImageBase64 ? (
                      <div className="admin-modal-image-container">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={`data:${previewData.coverImageMimeType};base64,${previewData.coverImageBase64}`} alt="Cover" />
                     </div>
                   ) : (
                      <div className="admin-modal-empty-image">
                        No Cover Image Generated
                      </div>
                    )}

                    <div className="admin-modal-body">
                       {previewData.body}
                    </div>
                 </div>

                 <div className="admin-modal-actions admin-modal-actions-sticky">
                  <button
                    className="admin-btn"
                    onClick={() => setIsPreviewOpen(false)}
                    disabled={isSaving}
                  >
                    Discard
                  </button>
                  <button
                    className="admin-btn admin-btn-success"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Approve & Save Draft"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
