"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPending(true);
    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim();

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message || "We could not send a reset email.");
      } else {
        setNotice(
          "If an account exists for that email, a password reset link is on its way.",
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="shop-auth-fields" onSubmit={handleSubmit}>
      <label>
        <span>Email address</span>
        <input
          autoComplete="email"
          name="email"
          type="email"
          maxLength={254}
          required
        />
      </label>
      {error && (
        <p className="shop-auth-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="shop-auth-notice" role="status">
          {notice}
        </p>
      )}
      <button className="shop-auth-submit" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
