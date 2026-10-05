import "server-only";

import { createHmac, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "aurvella-admin-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const PASSWORD_HASH_PATTERN = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/i;

type AdminSession = {
  sub: "admin";
  iat: number;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  }

  return secret;
}

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const match = passwordHash?.match(PASSWORD_HASH_PATTERN);

  if (!email || !match) {
    throw new Error(
      "Set ADMIN_EMAIL and a valid scrypt ADMIN_PASSWORD_HASH before signing in.",
    );
  }

  return {
    email,
    salt: Buffer.from(match[1], "hex"),
    passwordHash: Buffer.from(match[2], "hex"),
  };
}

function derivePasswordHash(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

function signSession(payload: AdminSession) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const credentials = getAdminCredentials();
  const passwordHash = await derivePasswordHash(password, credentials.salt);
  const passwordMatches = timingSafeEqual(passwordHash, credentials.passwordHash);
  const emailMatches = email.trim().toLowerCase() === credentials.email;

  return emailMatches && passwordMatches;
}

export async function createAdminSession() {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_DURATION_SECONDS;
  const token = signSession({ sub: "admin", iat: now, exp: expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature, extraPart] = token.split(".");

  if (!encodedPayload || !encodedSignature || extraPart !== undefined) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();

  let actualSignature: Buffer;
  try {
    actualSignature = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }

  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    const now = Math.floor(Date.now() / 1000);

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("sub" in payload) ||
      payload.sub !== "admin" ||
      !("iat" in payload) ||
      typeof payload.iat !== "number" ||
      !("exp" in payload) ||
      typeof payload.exp !== "number" ||
      payload.exp <= now ||
      payload.iat > now + 60
    ) {
      return null;
    }

    return { sub: "admin", iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
