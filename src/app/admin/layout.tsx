import DashboardLayout from "@/components/admin/dashboard-layout";
import { auth } from "@/lib/auth";
import { getDefaultAuthPath } from "@/lib/founding-admins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(await getDefaultAuthPath());
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
