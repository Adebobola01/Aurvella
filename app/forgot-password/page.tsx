import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="shop-auth-page">
      <section className="shop-auth-card">
        <Link href="/" className="shop-auth-wordmark">
          Aurvella
        </Link>
        <p className="shop-kicker">ACCOUNT HELP</p>
        <h1>Reset your password</h1>
        <p className="shop-auth-intro">
          Enter your email and we’ll send a secure password reset link.
        </p>
        <ForgotPasswordForm />
        <Link href="/sign-in" className="shop-auth-back">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
