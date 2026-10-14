import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StoreHeader } from "@/components/storefront/store-header";
import Footer from "@/components/Footer";
import { getCustomerSession } from "@/lib/customer-session";

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/sign-in?callbackURL=%2Faccount");

  return (
    <div className="storefront">
      <StoreHeader />
      <main className="shop-account-page shop-content">
        <p className="shop-kicker">YOUR AURVELLA ACCOUNT</p>
        <h1>Welcome, {session.user.name}</h1>
        <p className="shop-account-email">{session.user.email}</p>
        <div className="shop-account-actions">
          <Link href="/cart" className="shop-button shop-button-dark">
            View your shopping bag
          </Link>
          <SignOutButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}
