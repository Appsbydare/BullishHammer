"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="admin-login-container">
      <form action={formAction} className={`admin-login-box ${state?.error ? 'shake error-border' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.8 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Bullish Hammer</h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#888', textAlign: 'center' }}>Enterprise Security Gateway</p>
        </div>
        
        <input 
          type="password" 
          name="password" 
          placeholder="Enter Administrative Password" 
          className={`admin-input ${state?.error ? 'input-error' : ''}`}
          required
          disabled={pending}
        />
        
        {state?.error && (
          <div className="error-message animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>{state.error}</span>
          </div>
        )}

        <button type="submit" className="admin-btn" disabled={pending} style={{ opacity: pending ? 0.7 : 1 }}>
          {pending ? 'Authenticating...' : 'Secure Login'}
        </button>
      </form>
    </div>
  );
}
