import { UserSettingsForm } from "@/components/admin/user-settings-form";
import { auth } from "@/lib/auth";
import { getDefaultAuthPath } from "@/lib/founding-admins";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings in the admin dashboard",
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(await getDefaultAuthPath());
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <UserSettingsForm
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          emailVerified: session.user.emailVerified,
          role: session.user.role,
          banned: session.user.banned,
          createdAt: session.user.createdAt,
        }}
      />
    </div>
  );
}
