import type { Metadata } from "next";
import { headers } from "next/headers";

import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import { UsersTable } from "@/components/admin/users-table";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage users in the admin dashboard",
};

export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!isAdminRole(session?.user.role)) {
    return <AdminAccessDenied />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <UsersTable />
    </div>
  );
}
