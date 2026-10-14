import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";
import { sendAuthEmail } from "@/lib/auth-email";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
  throw new Error(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be configured.",
  );
}

const socialProviders =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          prompt: "select_account" as const,
        },
      }
    : undefined;

export const googleSignInEnabled = socialProviders !== undefined;

export const auth = betterAuth({
  appName: "Aurvella",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset your Aurvella password",
        heading: "Choose a new password",
        message: "Use the secure link below to reset your Aurvella password.",
        actionLabel: "Reset password",
        actionUrl: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Verify your Aurvella email",
        heading: `Welcome to Aurvella, ${user.name}`,
        message: "Confirm your email address to finish creating your account.",
        actionLabel: "Verify email",
        actionUrl: url,
      });
    },
  },
  ...(socialProviders ? { socialProviders } : {}),
});
