import { SignUpPageContent } from "@/components/auth/sign-up-page-content";
import { isRegistrationEnabled } from "@/lib/founding-admins";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const SignUpPage = async () => {
  if (!(await isRegistrationEnabled())) {
    redirect("/auth/sign-in");
  }

  return <SignUpPageContent />;
};

export default SignUpPage;
