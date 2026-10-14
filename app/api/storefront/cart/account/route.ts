import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

const MAX_CART_LINES = 50;
const MAX_CART_QUANTITY = 999;

type CartInput = { productId: string; quantity: number }[];

function parseItems(value: unknown): CartInput | null {
  if (!Array.isArray(value) || value.length > MAX_CART_LINES) return null;
  const lines = new Map<string, number>();

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("productId" in item) ||
      typeof item.productId !== "string" ||
      item.productId.length === 0 ||
      item.productId.length > 100 ||
      !("quantity" in item) ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_CART_QUANTITY
    ) {
      return null;
    }

    lines.set(
      item.productId,
      Math.min(
        MAX_CART_QUANTITY,
        (lines.get(item.productId) ?? 0) + item.quantity,
      ),
    );
  }

  return Array.from(lines, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

async function readItems(request: Request) {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !("items" in body)) {
      return null;
    }
    return parseItems(body.items);
  } catch {
    return null;
  }
}

async function saveCart(
  tx: Prisma.TransactionClient,
  userId: string,
  requestedItems: CartInput,
  mergeExisting: boolean,
) {
  const existingItems = mergeExisting
    ? await tx.customerCartItem.findMany({
        where: { userId },
        select: { productId: true, quantity: true },
      })
    : [];

  const quantities = new Map<string, number>();
  for (const item of existingItems) {
    quantities.set(item.productId, item.quantity);
  }
  for (const item of requestedItems) {
    quantities.set(
      item.productId,
      Math.min(
        MAX_CART_QUANTITY,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      ),
    );
  }

  const productIds = [...quantities.keys()];
  const products = await tx.product.findMany({
    where: { id: { in: productIds }, status: "PUBLISHED", quantity: { gt: 0 } },
    select: { id: true, quantity: true },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));
  const items = productIds.flatMap((productId) => {
    const product = productsById.get(productId);
    const requestedQuantity = quantities.get(productId);
    if (!product || requestedQuantity === undefined) return [];
    return [
      {
        userId,
        productId,
        quantity: Math.min(requestedQuantity, product.quantity),
      },
    ];
  });

  await tx.customerCartItem.deleteMany({ where: { userId } });
  if (items.length) {
    await tx.customerCartItem.createMany({ data: items });
  }

  return items.map(({ productId, quantity }) => ({ productId, quantity }));
}

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "Sign in to access your saved cart." }, { status: 401 });
  }

  const items = await db.customerCartItem.findMany({
    where: { userId },
    select: { productId: true, quantity: true },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ items });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "Sign in to sync your cart." }, { status: 401 });
  }

  const items = await readItems(request);
  if (!items) {
    return Response.json({ error: "Invalid cart data." }, { status: 400 });
  }

  const mergedItems = await db.$transaction((tx) =>
    saveCart(tx, userId, items, true),
  );

  return Response.json({ items: mergedItems });
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "Sign in to update your saved cart." }, { status: 401 });
  }

  const items = await readItems(request);
  if (!items) {
    return Response.json({ error: "Invalid cart data." }, { status: 400 });
  }

  const updatedItems = await db.$transaction((tx) =>
    saveCart(tx, userId, items, false),
  );

  return Response.json({ items: updatedItems });
}
