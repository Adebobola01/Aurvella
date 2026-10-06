import "server-only";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type ProductImageUploadTicket = {
  key: string;
  altText: string;
  contentType: string;
  byteSize: number;
  expiresAt: number;
  nonce: string;
  signature: string;
};

let cachedClient: S3Client | undefined;

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicUrl
  ) {
    throw new Error(
      "Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL.",
    );
  }

  let publicOrigin: URL;
  try {
    publicOrigin = new URL(publicUrl);
  } catch {
    throw new Error("R2_PUBLIC_URL must be a valid HTTPS URL.");
  }

  if (
    publicOrigin.protocol !== "https:" ||
    publicOrigin.username ||
    publicOrigin.password ||
    publicOrigin.search ||
    publicOrigin.hash
  ) {
    throw new Error(
      "R2_PUBLIC_URL must be an HTTPS URL without credentials, query, or fragment.",
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl: publicUrl.replace(/\/+$/, ""),
  };
}

function getS3Client() {
  if (cachedClient) return cachedClient;

  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

function getTicketSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  }

  return secret;
}

function signTicket(ticket: Omit<ProductImageUploadTicket, "signature">) {
  return createHmac("sha256", getTicketSecret())
    .update(
      JSON.stringify([
        ticket.key,
        ticket.altText,
        ticket.contentType,
        ticket.byteSize,
        ticket.expiresAt,
        ticket.nonce,
      ]),
    )
    .digest("base64url");
}

function isValidTicket(ticket: ProductImageUploadTicket) {
  if (
    !ticket.key ||
    !ticket.nonce ||
    !ALLOWED_CONTENT_TYPES.has(ticket.contentType) ||
    !isAllowedProductImage({
      contentType: ticket.contentType,
      byteSize: ticket.byteSize,
    }) ||
    ticket.altText.length > 200 ||
    !/^[A-Za-z0-9_-]{43}$/.test(ticket.signature) ||
    !Number.isInteger(ticket.expiresAt) ||
    ticket.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  if (
    ticket.key !==
    `products/${ticket.nonce}.${getExtension(ticket.contentType)}`
  ) {
    return false;
  }

  const expected = Buffer.from(signTicket(ticket), "base64url");
  const supplied = Buffer.from(ticket.signature, "base64url");

  return (
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied)
  );
}

function getExtension(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      throw new Error("Unsupported product image type.");
  }
}

function getPublicUrl(publicUrl: string, key: string) {
  return `${publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function createProductImageUpload({
  contentType,
  byteSize,
  altText,
}: {
  contentType: string;
  byteSize: number;
  altText: string;
}) {
  const { bucketName, publicUrl } = getR2Config();
  if (!isAllowedProductImage({ contentType, byteSize })) {
    throw new Error("Choose a supported image up to 10 MB.");
  }

  const nonce = randomUUID();
  const key = `products/${nonce}.${getExtension(contentType)}`;
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
  const unsignedTicket = {
    key,
    altText,
    contentType,
    byteSize,
    expiresAt,
    nonce,
  };
  const ticket: ProductImageUploadTicket = {
    ...unsignedTicket,
    signature: signTicket(unsignedTicket),
  };
  const uploadURL = await getSignedUrl(
    getS3Client(),
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentLength: byteSize,
      ContentType: contentType,
      Metadata: { source: "aurvella-admin", nonce },
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return {
    uploadURL,
    uploadHeaders: {
      "Content-Type": contentType,
      "x-amz-meta-source": "aurvella-admin",
      "x-amz-meta-nonce": nonce,
    },
    ticket,
    deliveryURL: getPublicUrl(publicUrl, key),
  };
}

export async function verifyProductImageUpload(
  ticket: ProductImageUploadTicket,
) {
  if (!isValidTicket(ticket)) {
    throw new Error("An image upload expired. Please select the image again.");
  }

  const { bucketName, publicUrl } = getR2Config();
  const result = await getS3Client().send(
    new HeadObjectCommand({ Bucket: bucketName, Key: ticket.key }),
  );

  if (
    result.ContentLength !== ticket.byteSize ||
    result.ContentType !== ticket.contentType ||
    result.Metadata?.source !== "aurvella-admin" ||
    result.Metadata?.nonce !== ticket.nonce
  ) {
    throw new Error("The uploaded image could not be verified. Please try again.");
  }

  return {
    cloudflareId: ticket.key,
    deliveryUrl: getPublicUrl(publicUrl, ticket.key),
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
    ALLOWED_CONTENT_TYPES.has(contentType) &&
    Number.isInteger(byteSize) &&
    byteSize > 0 &&
    byteSize <= MAX_IMAGE_BYTES
  );
}
