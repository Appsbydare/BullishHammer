"use client";

import { useFormStatus } from "react-dom";
import { ReactNode } from "react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  pendingText?: string;
}

export default function SubmitButton({ children, pendingText, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`${className || ""} ${pending ? "is-loading" : ""}`}
    >
      {pending && (
        <svg className="admin-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
        </svg>
      )}
      <span className="btn-content" style={{ opacity: pending ? 0 : 1 }}>
        {children}
      </span>
      {pending && pendingText && (
        <span className="btn-pending-text" style={{ position: 'absolute' }}>
          {pendingText}
        </span>
      )}
    </button>
  );
}
