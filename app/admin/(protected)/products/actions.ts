"use server";

import { redirect } from "next/navigation";
import {
  createAdminProduct,
  updateAdminProduct,
} from "@/data/admin-products";
import { isProductCategory } from "@/lib/product-catalog";

export type CreateProductState = {
  error?: string;
  name?: string;
  category?: string;
  description?: string;
  price?: string;
  quantity?: string;
  currencyCode?: string;
  status?: string;
  imageTickets?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createProduct(
  _previousState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const values = {
    name: getString(formData, "name"),
    category: getString(formData, "category"),
    description: getString(formData, "description"),
    price: getString(formData, "price"),
    quantity: getString(formData, "quantity"),
    currencyCode: getString(formData, "currencyCode"),
    status: getString(formData, "status"),
    imageTickets: getString(formData, "imageTickets"),
  };

  const priceMatch = /^(?:\d{1,7})(?:\.\d{1,2})?$/.test(values.price);
  const parsedPrice = priceMatch ? Number(values.price) : NaN;
  const quantityMatch = /^\d{1,7}$/.test(values.quantity);
  const parsedQuantity = quantityMatch ? Number(values.quantity) : NaN;

  if (values.name.length < 2 || values.name.length > 100) {
    return { ...values, error: "Name must be between 2 and 100 characters." };
  }
  if (!isProductCategory(values.category)) {
    return { ...values, error: "Choose a category from the list." };
  }
  if (values.description.length > 3000) {
    return { ...values, error: "Description must be 3,000 characters or less." };
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return {
      ...values,
      error: "Enter a price greater than zero with up to two decimal places.",
    };
  }
  if (
    !Number.isSafeInteger(parsedQuantity) ||
    parsedQuantity < 0 ||
    parsedQuantity > 1_000_000
  ) {
    return {
      ...values,
      error: "Quantity must be a whole number between 0 and 1,000,000.",
    };
  }
  if (!["USD", "GBP", "EUR"].includes(values.currencyCode)) {
    return { ...values, error: "Choose a supported currency." };
  }
  if (!["DRAFT", "PUBLISHED"].includes(values.status)) {
    return { ...values, error: "Choose draft or published status." };
  }

  let imageTickets: unknown;
  try {
    imageTickets = JSON.parse(values.imageTickets || "[]");
  } catch {
    return { ...values, error: "Image details are invalid. Please retry." };
  }

  if (!Array.isArray(imageTickets) || imageTickets.length > 6) {
    return { ...values, error: "Add no more than six product images." };
  }
  if (values.status === "PUBLISHED" && imageTickets.length === 0) {
    return {
      ...values,
      error: "Add at least one product image before publishing.",
    };
  }

  try {
    await createAdminProduct({
      name: values.name,
      category: values.category,
      description: values.description,
      priceInMinorUnits: Math.round(parsedPrice * 100),
      quantity: parsedQuantity,
      currencyCode: values.currencyCode,
      status: values.status,
      imageTickets,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/admin/login");
    }
    if (error instanceof Error && error.message.startsWith("PRODUCT_FORM:")) {
      return { ...values, error: error.message.slice("PRODUCT_FORM:".length) };
    }
    console.error("Failed to create an admin product.", error);
    return {
      ...values,
      error: "The product could not be saved. Please try again.",
    };
  }

  redirect("/admin?created=1");
}

export type UpdateProductState = CreateProductState;

export async function updateProduct(
  _previousState: UpdateProductState,
  formData: FormData,
): Promise<UpdateProductState> {
  const values = {
    id: getString(formData, "id"),
    name: getString(formData, "name"),
    category: getString(formData, "category"),
    description: getString(formData, "description"),
    price: getString(formData, "price"),
    quantity: getString(formData, "quantity"),
    currencyCode: getString(formData, "currencyCode"),
    status: getString(formData, "status"),
  };
  const priceMatch = /^(?:\d{1,7})(?:\.\d{1,2})?$/.test(values.price);
  const parsedPrice = priceMatch ? Number(values.price) : NaN;
  const quantityMatch = /^\d{1,7}$/.test(values.quantity);
  const parsedQuantity = quantityMatch ? Number(values.quantity) : NaN;

  if (!values.id) {
    return { ...values, error: "This product could not be found." };
  }
  if (values.name.length < 2 || values.name.length > 100) {
    return { ...values, error: "Name must be between 2 and 100 characters." };
  }
  if (!isProductCategory(values.category)) {
    return { ...values, error: "Choose a category from the list." };
  }
  if (values.description.length > 3000) {
    return { ...values, error: "Description must be 3,000 characters or less." };
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return {
      ...values,
      error: "Enter a price greater than zero with up to two decimal places.",
    };
  }
  if (
    !Number.isSafeInteger(parsedQuantity) ||
    parsedQuantity < 0 ||
    parsedQuantity > 1_000_000
  ) {
    return {
      ...values,
      error: "Quantity must be a whole number between 0 and 1,000,000.",
    };
  }
  if (!["USD", "GBP", "EUR"].includes(values.currencyCode)) {
    return { ...values, error: "Choose a supported currency." };
  }
  if (!["DRAFT", "PUBLISHED", "SOLD_OUT"].includes(values.status)) {
    return { ...values, error: "Choose a valid listing status." };
  }

  try {
    await updateAdminProduct({
      ...values,
      priceInMinorUnits: Math.round(parsedPrice * 100),
      quantity: parsedQuantity,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/admin/login");
    }
    if (error instanceof Error && error.message.startsWith("PRODUCT_FORM:")) {
      return { ...values, error: error.message.slice("PRODUCT_FORM:".length) };
    }
    console.error("Failed to update an admin product.", error);
    return {
      ...values,
      error: "The product could not be updated. Please try again.",
    };
  }

  redirect("/admin?updated=1");
}
