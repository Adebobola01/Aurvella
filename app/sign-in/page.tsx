import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import Logo from "@/components/Logo";

type SearchParams = Promise<{
  callbackURL?: string | string[];
  verified?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function safeCallbackPath(value: string) {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/account";
  }
  return value;
}

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await (searchParams as SearchParams);
  const callbackURL = safeCallbackPath(firstValue(params.callbackURL));
  const verified = firstValue(params.verified) === "1";
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="shop-auth-page">
      <section className="shop-auth-card">
        <Link href="/" className="shop-auth-wordmark">
          <Logo />
        </Link>
        <p className="shop-kicker">YOUR AURVELLA ACCOUNT</p>
        <h1>Welcome to your little corner.</h1>
        <p className="shop-auth-intro">
          Sign in or create an account to keep your favorites close.
        </p>
        {verified && (
          <p className="shop-auth-notice" role="status">
            Your email is verified. You can now sign in.
          </p>
        )}
        <AuthForm callbackURL={callbackURL} googleEnabled={googleEnabled} />
        <Link className="shop-auth-back" href="/">
          Back to Aurvella
        </Link>
      </section>
    </main>
  );
}
