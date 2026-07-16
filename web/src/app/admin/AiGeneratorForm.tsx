"use client";

import { useState } from "react";
import { fetchNewsAction, generateArticleAction } from "./ai-actions";

export default function AiGeneratorForm() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("Forex");
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [selectedNewsIds, setSelectedNewsIds] = useState<Set<string>>(new Set());
  const [customInstructions, setCustomInstructions] = useState("");
  
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    
    const selectedNewsData = newsItems.filter(n => selectedNewsIds.has(n.uuid));
    
    const res = await generateArticleAction(selectedNewsData, customInstructions);
    if (res.error) {
      setError(res.error);
      setIsGenerating(false);
    } else {
      // Success! Reset state
      setStep(1);
      setNewsItems([]);
      setCustomInstructions("");
      setIsGenerating(false);
      // The server action already calls revalidatePath, so the dashboard will update automatically
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
      {error && <div className="error-message shake" style={{ marginBottom: '1rem' }}>{error}</div>}
      
      {step === 1 && (
        <form onSubmit={handleFetchNews} className="ai-step-1" style={{ display: 'flex', gap: '12px' }}>
          <input 
            list="news-categories"
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="admin-input ai-select"
            style={{ width: '250px', padding: '0.6rem 1.2rem' }}
            placeholder="Select or type a topic..."
          />
          <datalist id="news-categories">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
          <button type="submit" className={`admin-btn admin-btn-primary ${isFetching ? 'is-loading' : ''}`} disabled={isFetching} style={{ padding: '0.6rem 1.2rem', width: 'auto' }}>
            {isFetching && <svg className="admin-spinner" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" /></svg>}
            <span className="btn-content" style={{ opacity: isFetching ? 0 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Fetch News
            </span>
            {isFetching && <span className="btn-pending-text">Fetching...</span>}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleGenerate} className="ai-step-2 animate-fade-in" style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', padding: '2rem', borderRadius: '16px', marginTop: '1rem', width: '100%', maxWidth: '1000px' }}>
          <div className="ai-news-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', marginBottom: '2rem', paddingRight: '8px' }}>
            <h4 style={{ margin: 0, color: '#eee', fontFamily: 'Outfit, sans-serif' }}>Select News to Synthesize ({category})</h4>
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
          
          <div className="ai-custom-instructions" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem' }}>Custom Instructions for AI (Optional)</label>
            <textarea 
              className="admin-input" 
              rows={3} 
              placeholder="e.g. Focus on the impact of interest rates..."
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
            />
          </div>

          <div className="ai-step-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setStep(1)} disabled={isGenerating} style={{ width: 'auto', padding: '0.5rem 1rem' }}>Cancel</button>
            <button type="submit" className={`admin-btn admin-btn-success ${isGenerating ? 'is-loading' : ''}`} disabled={isGenerating || selectedNewsIds.size === 0} style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
              {isGenerating && <svg className="admin-spinner" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" /></svg>}
              <span className="btn-content" style={{ opacity: isGenerating ? 0 : 1 }}>Generate Article</span>
              {isGenerating && <span className="btn-pending-text">Generating...</span>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
