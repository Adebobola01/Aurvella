import Link from "next/link";
import { logout } from "../../actions";
import { AdminNavigation } from "@/components/admin/admin-navigation";

const metrics = [
  { label: "Gross sales", detail: "Revenue before refunds" },
  { label: "Orders", detail: "Orders placed" },
  { label: "Average order value", detail: "Sales per order" },
  { label: "Items sold", detail: "Units across all orders" },
];

export default function AdminSalesPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-neutral-200 bg-white px-6 py-7 lg:flex">
        <Link
          className="text-sm font-semibold uppercase tracking-[0.28em]"
          href="/"
        >
          Aurvella
        </Link>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-400">
          Atelier administration
        </p>
        <AdminNavigation active="sales" />
        <div className="mt-auto border-t border-neutral-200 pt-5">
          <p className="truncate text-xs text-neutral-500">Administrator</p>
          <form action={logout} className="mt-3">
            <button
              className="text-sm font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition hover:text-black hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="flex h-[72px] items-center justify-between border-b border-neutral-200 bg-white px-5 sm:px-8 lg:px-10">
          <Link
            className="text-xs font-semibold uppercase tracking-[0.28em] lg:hidden"
            href="/"
          >
            Aurvella
          </Link>
          <div className="hidden text-xs text-neutral-500 lg:block">
            Admin <span className="mx-2 text-neutral-300">/</span> Sales
          </div>
          <form action={logout} className="lg:hidden">
            <button
              className="text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
              type="submit"
            >
              Sign out
            </button>
          </form>
          <p className="hidden text-xs text-neutral-500 sm:block">
            Sales &amp; performance
          </p>
        </header>
        <AdminNavigation active="sales" mobile />

        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Your atelier
              </p>
              <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
                Sales overview
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Monitor revenue, orders, and sales performance.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 self-start border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-500 sm:self-auto"
              href="/admin#products"
            >
              Manage products
              <span aria-hidden="true">→</span>
            </Link>
          </section>

          <section
            aria-label="Sales reporting status"
            className="mt-8 border border-neutral-200 bg-white p-5 sm:p-6"
          >
            <p className="text-sm font-medium">Sales reporting is not available yet</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
              Checkout is not connected, so the store does not yet record
              orders or payments. These metrics will populate once sales are
              captured; no estimates are shown.
            </p>
          </section>

          <section
            aria-label="Sales key performance indicators"
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {metrics.map((metric) => (
              <article
                className="border border-neutral-200 bg-white p-5"
                key={metric.label}
              >
                <p className="text-xs font-medium text-neutral-500">
                  {metric.label}
                </p>
                <p
                  aria-label={`${metric.label}: unavailable`}
                  className="mt-5 text-3xl font-medium tracking-tight text-neutral-400"
                >
                  —
                </p>
                <p className="mt-2 text-xs text-neutral-400">{metric.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 p-5 sm:p-6">
              <h2 className="text-lg font-medium">Recent orders</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Review and manage customer orders.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                    <th className="px-5 py-3 font-medium sm:px-6">Order</th>
                    <th className="px-5 py-3 font-medium sm:px-6">Date</th>
                    <th className="px-5 py-3 font-medium sm:px-6">Customer</th>
                    <th className="px-5 py-3 font-medium sm:px-6">Items</th>
                    <th className="px-5 py-3 font-medium sm:px-6">Total</th>
                    <th className="px-5 py-3 font-medium sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className="px-5 py-14 text-center text-sm text-neutral-500 sm:px-6"
                      colSpan={6}
                    >
                      No orders to display until checkout is connected.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
