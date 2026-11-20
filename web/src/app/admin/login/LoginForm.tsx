"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="admin-form">
      <label htmlFor="pw" className="sr-only">
        Password
      </label>
      <input id="pw" name="password" type="password" className="input" placeholder="Password" autoFocus required />
      {state?.error && <p className="admin-error">{state.error}</p>}
      <button className="btn btn-gold" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
