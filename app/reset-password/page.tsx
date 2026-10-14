import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type SearchParams = Promise<{ token?: string | string[] }>;

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await (searchParams as SearchParams);
  const token = Array.isArray(params.token)
    ? (params.token[0] ?? "")
    : (params.token ?? "");

  return (
    <main className="shop-auth-page">
      <section className="shop-auth-card">
        <Link href="/" className="shop-auth-wordmark">
          Aurvella
        </Link>
        <p className="shop-kicker">ACCOUNT HELP</p>
        <h1>Choose a new password</h1>
        <p className="shop-auth-intro">
          {token
            ? "Create a new password for your account."
            : "Open the reset link from your email to continue."}
        </p>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Link href="/forgot-password" className="shop-auth-submit-link">
            Request another reset link
          </Link>
        )}
        <Link href="/sign-in" className="shop-auth-back">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
