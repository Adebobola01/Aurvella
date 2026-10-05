"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label
          className="mb-2 block text-sm font-medium"
          htmlFor="admin-email"
        >
          Email address
        </label>
        <input
          autoComplete="username"
          className="h-12 w-full border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
          id="admin-email"
          name="email"
          type="email"
          defaultValue={state.email}
          required
          maxLength={254}
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-medium"
          htmlFor="admin-password"
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="h-12 w-full border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
          id="admin-password"
          name="password"
          type="password"
          required
          maxLength={1024}
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <button
        className="flex h-12 w-full items-center justify-center bg-black px-4 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-neutral-500"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
