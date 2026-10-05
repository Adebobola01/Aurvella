import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import LoginForm from "./login-form";

export default async function AdminLoginPage() {
  if (await getAdminSession()) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12 text-black">
      <section className="w-full max-w-md">
        <Link
          className="text-xs font-semibold uppercase tracking-[0.3em]"
          href="/"
        >
          Aurvella
        </Link>
        <p className="mt-12 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Administration
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight">
          Sign in to your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Enter your administrator credentials to manage the marketplace.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
