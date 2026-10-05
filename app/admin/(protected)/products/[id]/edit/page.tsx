import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProductForEdit } from "@/data/admin-products";
import { UpdateProductForm } from "./update-product-form";
import { normalizeProductCategory } from "@/lib/product-catalog";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  const product = await getAdminProductForEdit(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-8 text-black sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          className="text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-4 hover:text-black hover:decoration-black"
          href="/admin"
        >
          Back to products
        </Link>

        <div className="mt-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            Product management
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Edit product
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Update the listing details, price, inventory, or visibility.
          </p>
        </div>

        <UpdateProductForm
          product={{
            ...product,
            category: normalizeProductCategory(product.category),
            price: (product.priceInMinorUnits / 100).toFixed(2),
            quantity: String(product.quantity),
          }}
        />
      </div>
    </main>
  );
}
