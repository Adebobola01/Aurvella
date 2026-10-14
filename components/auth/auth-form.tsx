"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

export function AuthForm({
  callbackURL,
  googleEnabled,
}: {
  callbackURL: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      if (mode === "sign-up") {
        const name = String(formData.get("name") ?? "").trim();
        const result = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: `${window.location.origin}/sign-in?verified=1`,
        });

        if (result.error) {
          setError(result.error.message || "We could not create your account.");
          return;
        }

        setMode("sign-in");
        setNotice(
          "Check your inbox for a verification link. You’ll be able to sign in after verifying your email.",
        );
        return;
      }

      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL,
      });

      if (result.error) {
        setError(result.error.message || "We could not sign you in.");
        return;
      }

      router.push(callbackURL);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle() {
    setError("");
    setPending(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
      if (result.error) {
        setError(result.error.message || "Google sign-in could not start.");
      }
    } catch {
      setError("Google sign-in could not start. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shop-auth-form">
      <div className="shop-auth-tabs" role="tablist" aria-label="Account access">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-in"}
          onClick={() => {
            setMode("sign-in");
            setError("");
            setNotice("");
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-up"}
          onClick={() => {
            setMode("sign-up");
            setError("");
            setNotice("");
          }}
        >
          Create account
        </button>
      </div>

      <form className="shop-auth-fields" onSubmit={handleSubmit}>
        {mode === "sign-up" && (
          <label>
            <span>Name</span>
            <input
              autoComplete="name"
              name="name"
              type="text"
              minLength={2}
              maxLength={100}
              required
            />
          </label>
        )}
        <label>
          <span>Email address</span>
          <input
            autoComplete="email"
            name="email"
            type="email"
            maxLength={254}
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        {mode === "sign-in" && (
          <Link href="/forgot-password" className="shop-auth-forgot">
            Forgot password?
          </Link>
        )}
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
          {pending
            ? mode === "sign-up"
              ? "Creating account…"
              : "Signing in…"
            : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <div className="shop-auth-divider">
        <span>or</span>
      </div>
      <button
        className="shop-auth-google"
        type="button"
        onClick={signInWithGoogle}
        disabled={pending || !googleEnabled}
        title={
          googleEnabled
            ? undefined
            : "Google sign-in will be available after OAuth credentials are configured."
        }
      >
        <GoogleMark />
        Continue with Google
      </button>
      {!googleEnabled && (
        <p className="shop-auth-hint">
          Google sign-in is ready to connect once OAuth credentials are added.
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="shop-google-mark">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.8a12 12 0 0 1 0-7.6V15H5.8a20 20 0 0 0 0 18Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3l5.8-5.8A19.5 19.5 0 0 0 24 4 20 20 0 0 0 5.8 15l6.8 5.2C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}
