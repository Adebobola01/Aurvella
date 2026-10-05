import Link from "next/link";
import { CreateProductForm } from "./product-form";

export default function NewProductPage() {
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
            Add a product
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Add the details, set a price, and choose whether to save a draft or
            publish your jewelry.
          </p>
        </div>

        <CreateProductForm />
      </div>
    </main>
  );
}
