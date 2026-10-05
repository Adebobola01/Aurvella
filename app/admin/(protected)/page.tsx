import Link from "next/link";
import { logout } from "../actions";
import {
  getAdminProductDashboard,
  isProductStatus,
  type ProductStatus,
} from "@/data/admin-products";

type AdminSearchParams = {
  q?: string | string[];
  status?: string | string[];
  category?: string | string[];
  page?: string | string[];
  created?: string | string[];
  updated?: string | string[];
};

const PAGE_SIZE = 20;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatPrice(priceInMinorUnits: number, currencyCode: string) {
  const formatter = new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
  });
  const fractionDigits =
    formatter.resolvedOptions().maximumFractionDigits ?? 2;

  return formatter.format(priceInMinorUnits / 10 ** fractionDigits);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "PUBLISHED"
      ? "bg-neutral-100 text-neutral-800"
      : status === "SOLD_OUT"
        ? "bg-black text-white"
        : "border border-neutral-200 text-neutral-600";
  const label =
    status === "PUBLISHED"
      ? "Published"
      : status === "SOLD_OUT"
        ? "Sold out"
        : "Draft";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function ProductThumbnail({
  image,
  productName,
}: {
  image?: { deliveryUrl: string; altText: string };
  productName: string;
}) {
  if (image) {
    return (
      <div
        aria-label={image.altText || productName}
        className="h-12 w-12 shrink-0 rounded-sm bg-neutral-100 bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url("${image.deliveryUrl}")` }}
      />
    );
  }

  return (
    <div
      aria-label="No product image"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-neutral-100 text-neutral-400"
      role="img"
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M6 8.5 12 4l6 4.5v8L12 21l-6-4.5v-8Z"
          strokeLinejoin="round"
        />
        <path d="m6.5 8.75 5.5 4 5.5-4M12 13v7.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function pageHref(
  page: number,
  filters: { q: string; status?: ProductStatus; category: string },
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  params.set("page", String(page));
  return `/admin?${params.toString()}`;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const params = await searchParams;
  const rawSearch = firstValue(params.q) ?? "";
  const search = rawSearch.trim().slice(0, 100);
  const rawStatus = firstValue(params.status) ?? "";
  const status = isProductStatus(rawStatus) ? rawStatus : undefined;
  const rawCategory = firstValue(params.category) ?? "";
  const category = rawCategory.trim().slice(0, 80);
  const requestedPage = Number.parseInt(firstValue(params.page) ?? "1", 10);
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, requestedPage)
    : 1;

  const dashboard = await getAdminProductDashboard({
    status,
    category,
    search,
    page,
    pageSize: PAGE_SIZE,
  });
  const { currentPage, pageCount } = dashboard;
  const start = dashboard.matchingCount
    ? (currentPage - 1) * PAGE_SIZE + 1
    : 0;
  const end = Math.min(currentPage * PAGE_SIZE, dashboard.matchingCount);
  const hasFilters = Boolean(search || status || category);
  const productCreated = firstValue(params.created) === "1";
  const productUpdated = firstValue(params.updated) === "1";

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

        <nav aria-label="Admin navigation" className="mt-14 space-y-1">
          <Link
            aria-current="page"
            className="flex items-center gap-3 bg-black px-3 py-2.5 text-sm font-medium text-white"
            href="/admin"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
                strokeLinejoin="round"
              />
            </svg>
            Overview
          </Link>
          <a
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
            href="#products"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                d="M6 7.5h12l1 12H5l1-12ZM9 8V6a3 3 0 0 1 6 0v2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Products
          </a>
        </nav>

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
            Admin <span className="mx-2 text-neutral-300">/</span> Overview
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
            Jewelry catalog
          </p>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Your atelier
              </p>
              <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
                Product overview
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Keep your collection and product listings up to date.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 self-start bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:self-auto"
              href="/admin/products/new"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M12 5v14m-7-7h14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Add product
            </Link>
          </section>

          {productCreated && (
            <p
              className="mt-6 border border-neutral-200 bg-white px-4 py-3 text-sm"
              role="status"
            >
              Product created successfully.
            </p>
          )}
          {productUpdated && (
            <p
              className="mt-6 border border-neutral-200 bg-white px-4 py-3 text-sm"
              role="status"
            >
              Product updated successfully.
            </p>
          )}

          <section
            aria-label="Product statistics"
            className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            {[
              {
                label: "All products",
                value: dashboard.stats.total,
                detail: "In your catalog",
              },
              {
                label: "Published",
                value: dashboard.stats.published,
                detail: "Visible in store",
              },
              {
                label: "Drafts",
                value: dashboard.stats.drafts,
                detail: "Not yet published",
              },
              {
                label: "Sold out",
                value: dashboard.stats.soldOut,
                detail: "Currently unavailable",
              },
            ].map((stat) => (
              <article
                className="border border-neutral-200 bg-white p-4 sm:p-5"
                key={stat.label}
              >
                <p className="text-xs font-medium text-neutral-500">
                  {stat.label}
                </p>
                <p className="mt-4 text-3xl font-medium tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-neutral-400">{stat.detail}</p>
              </article>
            ))}
          </section>

          <section
            className="mt-8 border border-neutral-200 bg-white"
            id="products"
          >
            <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-lg font-medium">Products</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Browse and review your jewelry listings.
                </p>
              </div>
              <form
                action="/admin"
                className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_160px_160px_auto] xl:min-w-[700px]"
                method="get"
              >
                <label className="sr-only" htmlFor="product-search">
                  Search products
                </label>
                <input
                  autoComplete="off"
                  className="h-10 min-w-0 border border-neutral-300 px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
                  defaultValue={search}
                  id="product-search"
                  maxLength={100}
                  name="q"
                  placeholder="Search products"
                  type="search"
                />
                <label className="sr-only" htmlFor="product-status">
                  Filter by status
                </label>
                <select
                  className="h-10 border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  defaultValue={status ?? ""}
                  id="product-status"
                  name="status"
                >
                  <option value="">All statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SOLD_OUT">Sold out</option>
                </select>
                <label className="sr-only" htmlFor="product-category">
                  Filter by category
                </label>
                <select
                  className="h-10 border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  defaultValue={category}
                  id="product-category"
                  name="category"
                >
                  <option value="">All categories</option>
                  {dashboard.categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button
                  className="h-10 bg-black px-4 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  type="submit"
                >
                  Apply
                </button>
              </form>
            </div>

            {dashboard.products.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                        <th className="px-5 py-3.5 sm:px-6" scope="col">
                          Product
                        </th>
                        <th className="px-4 py-3.5" scope="col">
                          Category
                        </th>
                        <th className="px-4 py-3.5" scope="col">
                          Price
                        </th>
                        <th className="px-4 py-3.5" scope="col">
                          Stock
                        </th>
                        <th className="px-4 py-3.5" scope="col">
                          Status
                        </th>
                        <th className="px-5 py-3.5 sm:px-6" scope="col">
                          Last updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {dashboard.products.map((product) => (
                        <tr
                          className="transition hover:bg-neutral-50"
                          key={product.id}
                        >
                          <td className="px-5 py-3.5 sm:px-6">
                            <div className="flex items-center gap-3">
                              <ProductThumbnail
                                image={product.images[0]}
                                productName={product.name}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-black">
                                  {product.name}
                                </p>
                                <p className="mt-1 truncate text-xs text-neutral-400">
                                  {product.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-neutral-600">
                            {product.category}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-medium">
                            {formatPrice(
                              product.priceInMinorUnits,
                              product.currencyCode,
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-neutral-600">
                            {product.quantity}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={product.status} />
                          </td>
                          <td className="px-5 py-3.5 sm:px-6">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-neutral-500">
                                {formatDate(product.updatedAt)}
                              </span>
                              <Link
                                className="text-xs font-medium underline decoration-neutral-300 underline-offset-4 hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                href={`/admin/products/${product.id}/edit`}
                              >
                                Edit
                                <span className="sr-only">
                                  {" "}
                                  {product.name}
                                </span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-neutral-500">
                    Showing {start}–{end} of {dashboard.matchingCount} products
                  </p>
                  <nav aria-label="Product list pages" className="flex gap-2">
                    {currentPage > 1 ? (
                      <Link
                        className="border border-neutral-300 px-3 py-2 text-xs font-medium hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        href={pageHref(currentPage - 1, {
                          q: search,
                          status,
                          category,
                        })}
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed border border-neutral-200 px-3 py-2 text-xs text-neutral-300">
                        Previous
                      </span>
                    )}
                    {currentPage < pageCount ? (
                      <Link
                        className="border border-neutral-300 px-3 py-2 text-xs font-medium hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        href={pageHref(currentPage + 1, {
                          q: search,
                          status,
                          category,
                        })}
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="cursor-not-allowed border border-neutral-200 px-3 py-2 text-xs text-neutral-300">
                        Next
                      </span>
                    )}
                  </nav>
                </div>
              </>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M6 7.5h12l1 12H5l1-12ZM9 8V6a3 3 0 0 1 6 0v2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-medium">
                  {hasFilters
                    ? "No products match these filters"
                    : "Your collection starts here"}
                </h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-neutral-500">
                  {hasFilters
                    ? "Try another search or clear your filters to see more products."
                    : "Products you add to your catalog will appear here with their current price and publication status."}
                </p>
                {hasFilters && (
                  <Link
                    className="mt-4 text-sm font-medium underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
                    href="/admin"
                  >
                    Clear filters
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
