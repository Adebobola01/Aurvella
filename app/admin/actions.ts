"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  deleteAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export type LoginState = {
  error?: string;
  email?: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 254 ||
    password.length === 0 ||
    password.length > 1024
  ) {
    return { error: "Enter a valid email and password." };
  }

  const isValid = await verifyAdminCredentials(email, password);

  if (!isValid) {
    return {
      error: "The email or password you entered is incorrect.",
      email,
    };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logout() {
  await deleteAdminSession();
  redirect("/admin/login");
}
