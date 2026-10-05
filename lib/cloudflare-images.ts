import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
const IMAGE_DELIVERY_HOST = "https://imagedelivery.net/";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type CloudflareImageTicket = {
  id: string;
  altText: string;
  expiresAt: number;
  nonce: string;
  signature: string;
};

type CloudflareResult<T> = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: T;
};

type CloudflareImage = {
  id?: string;
  uploaded?: string;
  variants?: string[];
  metadata?: Record<string, unknown>;
};

function getCloudflareConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !accountHash || !apiToken) {
    throw new Error(
      "Configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCOUNT_HASH, and CLOUDFLARE_API_TOKEN to upload product images.",
    );
  }

  return { accountId, accountHash, apiToken };
}

function getTicketSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  }

  return secret;
}

function signTicket(id: string, nonce: string, expiresAt: number) {
  return createHmac("sha256", getTicketSecret())
    .update(`${id}.${nonce}.${expiresAt}`)
    .digest("base64url");
}

function isValidTicket(ticket: CloudflareImageTicket) {
  if (
    !ticket.id ||
    !ticket.nonce ||
    !/^[A-Za-z0-9_-]{43}$/.test(ticket.signature) ||
    !Number.isInteger(ticket.expiresAt) ||
    ticket.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const expected = Buffer.from(
    signTicket(ticket.id, ticket.nonce, ticket.expiresAt),
    "base64url",
  );
  const supplied = Buffer.from(ticket.signature, "base64url");

  return (
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied)
  );
}

export async function createCloudflareUpload({
  altText,
}: {
  altText: string;
}) {
  const { accountId, accountHash, apiToken } = getCloudflareConfig();
  const nonce = randomUUID();
  const formData = new FormData();
  formData.set("requireSignedURLs", "false");
  formData.set(
    "metadata",
    JSON.stringify({ source: "aurvella-admin", uploadNonce: nonce }),
  );

  const response = await fetch(
    `${CLOUDFLARE_API}/accounts/${accountId}/images/v2/direct_upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}` },
      body: formData,
      cache: "no-store",
    },
  );

  const body = (await response.json()) as CloudflareResult<{
    id?: string;
    uploadURL?: string;
  }>;

  if (!response.ok || body.success !== true || !body.result?.id || !body.result.uploadURL) {
    console.error("Cloudflare direct upload URL request failed.", {
      status: response.status,
      errors: body.errors,
    });
    throw new Error("Cloudflare could not prepare an image upload.");
  }

  const id = body.result.id;
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
  const ticket: CloudflareImageTicket = {
    id,
    altText,
    expiresAt,
    nonce,
    signature: signTicket(id, nonce, expiresAt),
  };

  return {
    uploadURL: body.result.uploadURL,
    ticket,
    deliveryURL: `${IMAGE_DELIVERY_HOST}${accountHash}/${id}/public`,
  };
}

export async function verifyCloudflareImageTicket(ticket: CloudflareImageTicket) {
  if (!isValidTicket(ticket)) {
    throw new Error("An image upload expired. Please select the image again.");
  }

  const { accountId, accountHash, apiToken } = getCloudflareConfig();
  const response = await fetch(
    `${CLOUDFLARE_API}/accounts/${accountId}/images/v1/${encodeURIComponent(ticket.id)}`,
    {
      headers: { Authorization: `Bearer ${apiToken}` },
      cache: "no-store",
    },
  );
  const body = (await response.json()) as CloudflareResult<CloudflareImage>;
  const image = body.result;

  if (!response.ok || body.success !== true || !image) {
    console.error("Cloudflare image verification failed.", {
      status: response.status,
      imageId: ticket.id,
      errors: body.errors,
    });
    throw new Error("Cloudflare could not verify an uploaded product image.");
  }

  if (
    image.id !== ticket.id ||
    !image.uploaded ||
    image.metadata?.source !== "aurvella-admin" ||
    image.metadata?.uploadNonce !== ticket.nonce
  ) {
    throw new Error(
      "A selected image has not finished uploading. Please try again.",
    );
  }

  const deliveryURL = image.variants?.find(
    (variant) =>
      variant.startsWith(`${IMAGE_DELIVERY_HOST}${accountHash}/${ticket.id}/`) &&
      variant.endsWith("/public"),
  );

  if (!deliveryURL) {
    throw new Error("Cloudflare did not return a public delivery URL.");
  }

  return {
    cloudflareId: ticket.id,
    deliveryUrl: deliveryURL,
    altText: ticket.altText,
  };
}

export function isAllowedProductImage({
  contentType,
  byteSize,
}: {
  contentType: string;
  byteSize: number;
}) {
  return (
    ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
      contentType,
    ) &&
    Number.isInteger(byteSize) &&
    byteSize > 0 &&
    byteSize <= MAX_IMAGE_BYTES
  );
}
