"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createProduct,
  type CreateProductState,
} from "../actions";
import { PRODUCT_CATEGORIES } from "@/lib/product-catalog";

const initialState: CreateProductState = {
  currencyCode: "USD",
  status: "DRAFT",
  imageTickets: "[]",
  quantity: "0",
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 6;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type UploadTicket = {
  id: string;
  altText: string;
  expiresAt: number;
  nonce: string;
  signature: string;
};

type SelectedImage = {
  file: File;
  altText: string;
  previewURL: string;
  ticket?: UploadTicket;
  deliveryURL?: string;
};

type UploadResponse = {
  uploadURL: string;
  ticket: UploadTicket;
  deliveryURL: string;
  error?: string;
};

export function CreateProductForm() {
  const [state, formAction, isPending] = useActionState(
    createProduct,
    initialState,
  );
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const continueSubmitRef = useRef(false);
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewURL));
    },
    [],
  );

  async function uploadImages() {
    setUploading(true);
    setUploadError("");
    const uploadedImages = [...images];

    try {
      for (let index = 0; index < uploadedImages.length; index += 1) {
        const image = uploadedImages[index];

        if (image.ticket && image.deliveryURL) {
          continue;
        }

        setUploadProgress(`Uploading image ${index + 1} of ${images.length}...`);
        const ticketResponse = await fetch("/api/admin/images/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: image.file.type,
            byteSize: image.file.size,
            altText: image.altText,
          }),
        });
        const upload = (await ticketResponse.json()) as UploadResponse;

        if (!ticketResponse.ok || !upload.uploadURL) {
          throw new Error(upload.error ?? "Could not prepare the image upload.");
        }

        const body = new FormData();
        body.set("file", image.file);
        const imageResponse = await fetch(upload.uploadURL, {
          method: "POST",
          body,
        });
        const imageResult = (await imageResponse.json()) as {
          success?: boolean;
        };

        if (!imageResponse.ok || imageResult.success !== true) {
          throw new Error(
            `Cloudflare could not upload ${image.file.name}. Please try again.`,
          );
        }

        uploadedImages[index] = {
          ...image,
          ticket: upload.ticket,
          deliveryURL: upload.deliveryURL,
        };
        setImages([...uploadedImages]);
      }

      const tickets = uploadedImages.flatMap((image) =>
        image.ticket ? [image.ticket] : [],
      );
      const hiddenInput = formRef.current?.elements.namedItem("imageTickets");

      if (!(hiddenInput instanceof HTMLInputElement)) {
        throw new Error("Image upload form data is missing.");
      }

      hiddenInput.value = JSON.stringify(tickets);
      setUploadProgress("");
      continueSubmitRef.current = true;
      formRef.current?.requestSubmit();
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Image upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (continueSubmitRef.current) {
      continueSubmitRef.current = false;
      return;
    }

    if (images.length > 0 && images.some((image) => !image.ticket)) {
      event.preventDefault();
      await uploadImages();
      return;
    }

    const hiddenInput = formRef.current?.elements.namedItem("imageTickets");
    if (hiddenInput instanceof HTMLInputElement) {
      hiddenInput.value = JSON.stringify(
        images.flatMap((image) => (image.ticket ? [image.ticket] : [])),
      );
    }
  }

  function addImages(fileList: FileList | null) {
    if (!fileList) return;
    setUploadError("");
    const additions = Array.from(fileList);

    if (images.length + additions.length > MAX_IMAGES) {
      setUploadError(`Choose no more than ${MAX_IMAGES} images.`);
      return;
    }

    const invalidFile = additions.find(
      (file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES,
    );
    if (invalidFile) {
      setUploadError(
        `${invalidFile.name} must be a JPEG, PNG, WebP, or AVIF image up to 10 MB.`,
      );
      return;
    }

    setImages([
      ...images,
      ...additions.map((file) => ({
        file,
        altText: "",
        previewURL: URL.createObjectURL(file),
      })),
    ]);
  }

  function updateAltText(index: number, altText: string) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? { ...image, altText } : image,
      ),
    );
  }

  function removeImage(index: number) {
    const removed = images[index];
    if (removed) URL.revokeObjectURL(removed.previewURL);
    setImages((current) => {
      return current.filter((_, imageIndex) => imageIndex !== index);
    });
  }

  return (
    <form
      action={formAction}
      className="mt-8 space-y-6"
      key={
        state.error
          ? JSON.stringify([state.error, state.status, state.price])
          : "new-product"
      }
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <input
        defaultValue={state.imageTickets ?? "[]"}
        name="imageTickets"
        type="hidden"
      />

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
              placeholder="e.g. Sculpted Gold Signet Ring"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="category">
              Category
            </label>
            <select
              className="h-11 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              defaultValue={state.category ?? ""}
              id="category"
              name="category"
              required
            >
              <option disabled value="">
                Select a category
              </option>
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
              defaultValue={state.status ?? "DRAFT"}
              id="status"
              name="status"
            >
              <option value="DRAFT">Save as draft</option>
              <option value="PUBLISHED">Publish product</option>
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
              placeholder="Describe the materials, craftsmanship, and details of this piece."
              rows={5}
            />
            <p className="mt-1.5 text-xs text-neutral-500">
              Optional. Up to 3,000 characters.
            </p>
          </div>
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5 sm:p-7">
        <h2 className="text-base font-medium">Inventory</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Set the number of pieces currently available.
        </p>
        <div className="mt-5 max-w-xs">
          <label className="mb-2 block text-sm font-medium" htmlFor="quantity">
            Quantity in stock
          </label>
          <input
            className="h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            defaultValue={state.quantity ?? "0"}
            id="quantity"
            max="1000000"
            min="0"
            name="quantity"
            required
            step="1"
            type="number"
          />
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5 sm:p-7">
        <h2 className="text-base font-medium">Price</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Enter the amount in the selected currency.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_160px]">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="price">
              Price
            </label>
            <input
              className="h-11 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
              id="price"
              inputMode="decimal"
              max="9999999.99"
              min="0.01"
              defaultValue={state.price}
              name="price"
              placeholder="0.00"
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
              id="currencyCode"
              name="currencyCode"
              defaultValue={state.currencyCode ?? "USD"}
            >
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5 sm:p-7">
        <div>
          <h2 className="text-base font-medium">Product images</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Add up to six JPEG, PNG, WebP, or AVIF images, up to 10 MB each.
            Images upload securely to Cloudflare when you save the product.
          </p>
        </div>

        <label
          className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-5 py-6 text-center transition hover:border-neutral-500 hover:bg-neutral-100"
          htmlFor="images"
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="mt-3 text-sm font-medium">Choose product images</span>
          <span className="mt-1 text-xs text-neutral-500">
            JPEG, PNG, WebP, or AVIF
          </span>
        </label>
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          id="images"
          multiple
          onChange={(event) => {
            addImages(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
          type="file"
        />

        {images.length > 0 && (
          <ul className="mt-4 divide-y divide-neutral-100 border border-neutral-200">
            {images.map((image, index) => (
              <li
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center"
                key={`${image.file.name}-${image.file.lastModified}-${index}`}
              >
                <div
                  aria-label={image.file.name}
                  className="h-16 w-16 shrink-0 bg-neutral-100 bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url("${image.previewURL}")` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {image.file.name}
                    {image.ticket && (
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        Uploaded
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {(image.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <label className="sr-only" htmlFor={`alt-text-${index}`}>
                    Alt text for {image.file.name}
                  </label>
                  <input
                    className="mt-2 h-9 w-full border border-neutral-300 px-2.5 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
                    disabled={Boolean(image.ticket)}
                    id={`alt-text-${index}`}
                    maxLength={200}
                    onChange={(event) =>
                      updateAltText(index, event.target.value)
                    }
                    placeholder="Image description (optional)"
                    value={image.altText}
                  />
                </div>
                <button
                  className="self-start text-xs font-medium text-neutral-600 underline underline-offset-4 hover:text-black sm:self-center"
                  onClick={() => removeImage(index)}
                  type="button"
                >
                  Remove
                  <span className="sr-only"> {image.file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {uploadProgress && (
          <p className="mt-3 text-sm text-neutral-600" role="status">
            {uploadProgress}
          </p>
        )}
        {uploadError && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {uploadError}
          </p>
        )}
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
        <button
          className="h-11 border border-neutral-300 bg-white px-5 text-sm font-medium transition hover:border-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          onClick={() => history.back()}
          type="button"
        >
          Cancel
        </button>
        <button
          className="h-11 bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-neutral-500"
          disabled={isPending || uploading}
          type="submit"
        >
          {uploading
            ? "Uploading images..."
            : isPending
              ? "Saving product..."
              : "Save product"}
        </button>
      </div>
    </form>
  );
}
