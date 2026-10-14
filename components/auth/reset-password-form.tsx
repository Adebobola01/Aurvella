"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const password = String(new FormData(event.currentTarget).get("password") ?? "");

    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message || "This reset link could not be used.");
      } else {
        setComplete(true);
      }
    } catch {
      setError("Something went wrong. Please request a new reset link.");
    } finally {
      setPending(false);
    }
  }

  if (complete) {
    return (
      <div className="shop-auth-fields">
        <p className="shop-auth-notice" role="status">
          Your password has been changed. You can now sign in.
        </p>
        <Link href="/sign-in" className="shop-auth-submit-link">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="shop-auth-fields" onSubmit={handleSubmit}>
      <label>
        <span>New password</span>
        <input
          autoComplete="new-password"
          name="password"
          type="password"
          minLength={8}
          maxLength={128}
          required
        />
      </label>
      {error && (
        <p className="shop-auth-error" role="alert">
          {error}
        </p>
      )}
      <button className="shop-auth-submit" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
