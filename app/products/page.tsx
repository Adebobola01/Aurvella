import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { ProductTile } from "@/components/storefront/product-tile";
import { StoreHeader } from "@/components/storefront/store-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStorefrontProducts } from "@/data/storefront-products";
import { PRODUCT_CATEGORIES, isProductCategory } from "@/lib/product-catalog";

type SearchParams = Promise<{
  q?: string | string[];
  category?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function pageUrl(page: number, search: string, category: string, sort: string) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (category) params.set("category", category);
  if (sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/products${query ? `?${query}` : ""}`;
}

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const params = await (searchParams as SearchParams);
  const rawSearch = firstValue(params.q).trim();
  const search = rawSearch.slice(0, 100);
  const selectedCategory = firstValue(params.category);
  const category = isProductCategory(selectedCategory) ? selectedCategory : "";
  const requestedSort = firstValue(params.sort);
  const sort = ["price-low", "price-high"].includes(requestedSort)
    ? requestedSort
    : "newest";
  const parsedPage = Number.parseInt(firstValue(params.page), 10);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, 100_000)
    : 1;
  const result = await getStorefrontProducts({ search, category, sort, page });
  const currentPage = Math.min(page, result.pageCount);
  const products =
    currentPage === page
      ? result.products
      : (await getStorefrontProducts({
          search,
          category,
          sort,
          page: currentPage,
        })).products;

  return (
    <div className="storefront">
      <StoreHeader />
      <main className="shop-catalog shop-content">
        <nav className="shop-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><span>Jewelry</span>
        </nav>
        <div className="shop-catalog-heading">
          <div>
            <p className="shop-kicker">AURVELLA JEWELRY</p>
            <h1>{category || "Shop all jewelry"}</h1>
          </div>
          <p>Find your new everyday favorite, from the little details to the statement pieces.</p>
        </div>
        <nav className="shop-category-nav" aria-label="Jewelry categories">
          <Link href="/products" aria-current={!category ? "page" : undefined}>All jewelry</Link>
          {PRODUCT_CATEGORIES.filter((item) => item !== "Other").map((item) => (
            <Link
              href={`/products?category=${encodeURIComponent(item)}`}
              aria-current={category === item ? "page" : undefined}
              key={item}
            >
              {item}
            </Link>
          ))}
        </nav>
        <form className="shop-filter-bar" action="/products">
          <label className="shop-search-field">
            <Search aria-hidden="true" />
            <Input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search jewelry"
              aria-label="Search products"
            />
          </label>
          <label className="shop-filter-select">
            <span className="sr-only">Category</span>
            <select name="category" defaultValue={category}>
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="shop-filter-select">
            <span className="sr-only">Sort products</span>
            <select name="sort" defaultValue={sort}>
              <option value="newest">Newest arrivals</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
          <Button type="submit" size="lg" className="shop-filter-submit">Apply filters</Button>
        </form>
        <div className="shop-results">
          <span>{result.total} {result.total === 1 ? "piece" : "pieces"} to discover</span>
          {(search || category) && (
            <Link href="/products" className="shop-clear-filters">Clear filters</Link>
          )}
        </div>
        {products.length ? (
          <div className="shop-product-grid">
            {products.map((product, index) => (
              <ProductTile key={product.id} product={product} priority={index === 0} />
            ))}
          </div>
        ) : (
          <div className="shop-catalog-empty">
            <span className="shop-kicker">AURVELLA COLLECTION</span>
            <h2>{search || category ? "No pieces found" : "New pieces are on the way"}</h2>
            <p>
              {search || category
                ? "Try another search or remove the filters to browse the full collection."
                : "We are adding to the collection. Check back soon to discover your next favorite."}
            </p>
            {(search || category) && (
              <Button
                nativeButton={false}
                render={<Link href="/products" />}
                variant="outline"
                size="lg"
                className="shop-filter-submit"
              >
                <ArrowLeft aria-hidden="true" /> Shop all jewelry
              </Button>
            )}
          </div>
        )}
        {result.pageCount > 1 && (
          <nav className="shop-pagination" aria-label="Product pages">
            {currentPage > 1 ? (
              <Link href={pageUrl(currentPage - 1, search, category, sort)}>
                <ArrowLeft aria-hidden="true" /> Previous
              </Link>
            ) : <span />}
            <span>{currentPage} / {result.pageCount}</span>
            {currentPage < result.pageCount ? (
              <Link href={pageUrl(currentPage + 1, search, category, sort)}>
                Next <ArrowRight aria-hidden="true" />
              </Link>
            ) : <span />}
          </nav>
        )}
      </main>
      <footer className="shop-footer">
        <div className="shop-footer-main shop-content">
          <div><Link href="/" className="shop-wordmark">aurvella<span>®</span></Link></div>
          <nav aria-label="Shop jewelry">
            <Link href="/products">All jewelry</Link>
            <Link href="/products?category=Necklaces">Necklaces</Link>
            <Link href="/products?category=Rings">Rings</Link>
            <Link href="/products?category=Earrings">Earrings</Link>
            <Link href="/products?category=Bracelets">Bracelets</Link>
          </nav>
        </div>
        <div className="shop-footer-bottom shop-content">
          <span>© {new Date().getFullYear()} Aurvella</span>
          <span>Jewelry to make your own.</span>
        </div>
      </footer>
    </div>
  );
}
