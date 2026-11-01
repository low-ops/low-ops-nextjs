import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
};

const AdminPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (isAdminRole(session?.user.role)) {
    redirect("/admin/users");
  }

  redirect("/admin/settings");
};

export default AdminPage;
