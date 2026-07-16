"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="login-content">
      <div className="login-header">
        <div className="login-brand-line"></div>
        <h1>Bullish Hammer</h1>
        <p>Enterprise Security Gateway</p>
      </div>

      <form action={formAction} className="login-form">
        <div className="login-input-group">
          <input 
            type="password" 
            name="password" 
            placeholder="Enter Administrative Password" 
            className={`login-input ${state?.error ? 'has-error shake-minimal' : ''}`}
            required
            disabled={pending}
          />
          {state?.error && (
            <div className="login-error animate-fade-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>{state.error}</span>
            </div>
          )}
        </div>

        <button type="submit" className={`login-submit ${pending ? 'is-loading' : ''}`} disabled={pending}>
          <span>{pending ? 'Authenticating...' : 'Secure Login'}</span>
          {!pending && (
            <svg className="login-submit-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          )}
        </button>
      </form>
    </div>
  );
}
