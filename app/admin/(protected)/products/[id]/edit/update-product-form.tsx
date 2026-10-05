"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  updateProduct,
  type UpdateProductState,
} from "../../actions";
import { PRODUCT_CATEGORIES } from "@/lib/product-catalog";

type EditableProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
  currencyCode: string;
  status: string;
  images: Array<{
    id: string;
    deliveryUrl: string;
    altText: string;
  }>;
};

export function UpdateProductForm({ product }: { product: EditableProduct }) {
  const initialState: UpdateProductState = {
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    quantity: product.quantity,
    currencyCode: product.currencyCode,
    status: product.status,
  };
  const [state, formAction, isPending] = useActionState(
    updateProduct,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input name="id" type="hidden" value={product.id} />

      {product.images.length > 0 && (
        <section className="border border-neutral-200 bg-white p-5 sm:p-7">
          <h2 className="text-base font-medium">Product images</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Images attached to this product remain unchanged when you save
            details.
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {product.images.map((image) => (
              <li key={image.id}>
                <div
                  aria-label={image.altText || product.name}
                  className="h-24 w-24 bg-neutral-100 bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url("${image.deliveryUrl}")` }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border border-neutral-200 bg-white p-5 sm:p-7">
        <h2 className="text-base font-medium">Product details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium" htmlFor="name">
              Product name
            </label>
            <input
              className="h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              defaultValue={state.name}
              id="name"
              maxLength={100}
              minLength={2}
              name="name"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="category">
              Category
            </label>
            <select
              className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              defaultValue={state.category}
              id="category"
              name="category"
              required
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="status">
              Listing status
            </label>
            <select
              className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              defaultValue={state.status}
              id="status"
              name="status"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SOLD_OUT">Sold out</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              className="min-h-32 w-full resize-y border border-neutral-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-black focus:ring-1 focus:ring-black"
              defaultValue={state.description}
              id="description"
              maxLength={3000}
              name="description"
              rows={5}
            />
          </div>
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5 sm:p-7">
        <h2 className="text-base font-medium">Price and inventory</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="price">
              Price
            </label>
            <input
              className="h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              defaultValue={state.price}
              id="price"
              inputMode="decimal"
              max="9999999.99"
              min="0.01"
              name="price"
              required
              step="0.01"
              type="number"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="currencyCode"
            >
              Currency
            </label>
            <select
              className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              defaultValue={state.currencyCode}
              id="currencyCode"
              name="currencyCode"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="quantity">
              Quantity in stock
            </label>
            <input
              className="h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              defaultValue={state.quantity}
              id="quantity"
              max="1000000"
              min="0"
              name="quantity"
              required
              step="1"
              type="number"
            />
          </div>
        </div>
      </section>

      {state.error && (
        <p
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-col-reverse justify-end gap-3 pb-8 sm:flex-row">
        <Link
          className="flex h-11 items-center justify-center border border-neutral-300 bg-white px-5 text-sm font-medium transition hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          href="/admin"
        >
          Cancel
        </Link>
        <button
          className="h-11 bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-neutral-500"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving changes..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
