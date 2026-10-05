import "server-only";

import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/admin-auth";
import {
  verifyCloudflareImageTicket,
  type CloudflareImageTicket,
} from "@/lib/cloudflare-images";
import { db } from "@/lib/db";
import {
  isProductCategory,
  PRODUCT_CATEGORIES,
} from "@/lib/product-catalog";

const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "SOLD_OUT"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export function isProductStatus(value: string): value is ProductStatus {
  return PRODUCT_STATUSES.some((status) => status === value);
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function isImageTicket(value: unknown): value is CloudflareImageTicket {
  if (typeof value !== "object" || value === null) return false;
  const ticket = value as Record<string, unknown>;

  return (
    typeof ticket.id === "string" &&
    ticket.id.length > 0 &&
    ticket.id.length <= 100 &&
    typeof ticket.altText === "string" &&
    ticket.altText.length <= 200 &&
    typeof ticket.expiresAt === "number" &&
    typeof ticket.nonce === "string" &&
    typeof ticket.signature === "string"
  );
}

export async function createAdminProduct({
  name,
  category,
  description,
  priceInMinorUnits,
  quantity,
  currencyCode,
  status,
  imageTickets,
}: {
  name: string;
  category: string;
  description: string;
  priceInMinorUnits: number;
  quantity: number;
  currencyCode: string;
  status: string;
  imageTickets: unknown;
}) {
  if (!(await getAdminSession())) {
    throw new Error("UNAUTHORIZED");
  }

  if (
    !Array.isArray(imageTickets) ||
    !imageTickets.every(isImageTicket) ||
    imageTickets.length > 6 ||
    new Set(imageTickets.map((ticket) => ticket.id)).size !==
      imageTickets.length
  ) {
    throw new Error("PRODUCT_FORM:Image details are invalid. Please retry.");
  }

  if (
    !name.trim() ||
    !isProductCategory(category) ||
    !Number.isSafeInteger(priceInMinorUnits) ||
    priceInMinorUnits <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > 1_000_000 ||
    !["USD", "GBP", "EUR"].includes(currencyCode) ||
    !["DRAFT", "PUBLISHED"].includes(status)
  ) {
    throw new Error("PRODUCT_FORM:Some product details are invalid.");
  }

  if (status === "PUBLISHED" && imageTickets.length === 0) {
    throw new Error(
      "PRODUCT_FORM:Add at least one product image before publishing.",
    );
  }

  let images: Array<{
    cloudflareId: string;
    deliveryUrl: string;
    altText: string;
    displayOrder: number;
  }>;

  try {
    images = await Promise.all(
      imageTickets.map(async (ticket, displayOrder) => ({
        ...(await verifyCloudflareImageTicket(ticket)),
        displayOrder,
      })),
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PRODUCT_FORM:${error.message}`);
    }
    throw error;
  }

  const baseSlug = slugify(name) || "jewelry";
  let slug = baseSlug;

  if (await db.product.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${randomBytes(3).toString("hex")}`;
  }

  return db.product.create({
    data: {
      slug,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      priceInMinorUnits,
      quantity,
      currencyCode,
      status,
      images: { create: images },
    },
    select: { id: true, slug: true },
  });
}

export async function getAdminProductForEdit(id: string) {
  if (!(await getAdminSession())) {
    throw new Error("UNAUTHORIZED");
  }

  return db.product.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      priceInMinorUnits: true,
      quantity: true,
      currencyCode: true,
      status: true,
      images: {
        orderBy: { displayOrder: "asc" },
        select: { id: true, deliveryUrl: true, altText: true },
      },
    },
  });
}

export async function updateAdminProduct({
  id,
  name,
  category,
  description,
  priceInMinorUnits,
  quantity,
  currencyCode,
  status,
}: {
  id: string;
  name: string;
  category: string;
  description: string;
  priceInMinorUnits: number;
  quantity: number;
  currencyCode: string;
  status: string;
}) {
  if (!(await getAdminSession())) {
    throw new Error("UNAUTHORIZED");
  }

  if (
    !id ||
    name.trim().length < 2 ||
    name.trim().length > 100 ||
    !isProductCategory(category) ||
    description.trim().length > 3000 ||
    !Number.isSafeInteger(priceInMinorUnits) ||
    priceInMinorUnits <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > 1_000_000 ||
    !["USD", "GBP", "EUR"].includes(currencyCode) ||
    !["DRAFT", "PUBLISHED", "SOLD_OUT"].includes(status)
  ) {
    throw new Error("PRODUCT_FORM:Some product details are invalid.");
  }

  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, images: { select: { id: true }, take: 1 } },
  });

  if (!product) {
    throw new Error("PRODUCT_FORM:This product could not be found.");
  }

  if (status === "PUBLISHED" && product.images.length === 0) {
    throw new Error(
      "PRODUCT_FORM:Add at least one product image before publishing.",
    );
  }

  const baseSlug = slugify(name) || "jewelry";
  const matchingSlug = await db.product.findFirst({
    where: { slug: baseSlug, NOT: { id } },
    select: { id: true },
  });
  const slug = matchingSlug
    ? `${baseSlug}-${randomBytes(3).toString("hex")}`
    : baseSlug;

  return db.product.update({
    where: { id },
    data: {
      slug,
      name: name.trim(),
      category,
      description: description.trim(),
      priceInMinorUnits,
      quantity,
      currencyCode,
      status,
    },
    select: { id: true, slug: true },
  });
}

export async function getAdminProductDashboard({
  status,
  category,
  search,
  page,
  pageSize,
}: {
  status?: ProductStatus;
  category?: string;
  search?: string;
  page: number;
  pageSize: number;
}) {
  const conditions: Prisma.ProductWhereInput[] = [];

  if (status) {
    conditions.push({ status });
  }
  if (category) {
    conditions.push({ category });
  }
  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search } },
        { category: { contains: search } },
        { slug: { contains: search } },
      ],
    });
  }

  const where: Prisma.ProductWhereInput | undefined = conditions.length
    ? { AND: conditions }
    : undefined;

  const [total, published, drafts, soldOut, matchingCount] =
    await Promise.all([
      db.product.count(),
      db.product.count({ where: { status: "PUBLISHED" } }),
      db.product.count({ where: { status: "DRAFT" } }),
      db.product.count({ where: { status: "SOLD_OUT" } }),
      db.product.count({ where }),
    ]);
  const pageCount = Math.max(1, Math.ceil(matchingCount / pageSize));
  const currentPage = Math.min(page, pageCount);
  const products = await db.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      priceInMinorUnits: true,
      currencyCode: true,
      quantity: true,
      status: true,
      updatedAt: true,
      images: {
        orderBy: { displayOrder: "asc" },
        take: 1,
        select: { deliveryUrl: true, altText: true },
      },
    },
  });

  return {
    stats: { total, published, drafts, soldOut },
    matchingCount,
    currentPage,
    pageCount,
    products,
    categories: PRODUCT_CATEGORIES,
  };
}
