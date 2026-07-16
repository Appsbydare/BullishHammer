"use client";
import { useState, useEffect } from "react";

export default function SlideMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }, [isOpen]);

  return (
    <>
      <button className="hamburger-btn" onClick={() => setIsOpen(true)}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && <div className="menu-overlay animate-fade-in" onClick={() => setIsOpen(false)}></div>}

      {/* Sidebar */}
      <div className={`slide-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">Bullish Hammer</div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
        </div>
        <div className="sidebar-search">
          <input type="text" placeholder="Search..." />
        </div>
        <nav className="sidebar-nav">
          <a href="#">Homepages</a>
          <a href="#">Latest</a>
          <a href="#">Trending</a>
          <a href="#">Inner Pages</a>
        </nav>
        <div className="sidebar-footer">
          <a href="#">Sign In</a>
          <a href="#">Create an account</a>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <span style={{cursor: 'pointer'}}>𝕏</span>
            <span style={{cursor: 'pointer'}}>IG</span>
            <span style={{cursor: 'pointer'}}>YT</span>
          </div>
        </div>
      </div>
    </>
  );
}
