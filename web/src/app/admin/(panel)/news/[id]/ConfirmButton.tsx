"use client";

/** Submit button that asks for confirmation first. */
export default function ConfirmButton({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <button
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--bear)" }}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
