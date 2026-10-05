import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({
  children,
}: LayoutProps<"/admin">) {
  if (!(await getAdminSession())) {
    redirect("/admin/login");
  }

  return children;
}
