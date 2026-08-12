import { SignInPageContent } from "@/components/auth/sign-in-page-content";
import {
  getDefaultAuthPath,
  isRegistrationEnabled,
} from "@/lib/founding-admins";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const SignInPage = async () => {
  const registrationEnabled = await isRegistrationEnabled();

  if (registrationEnabled) {
    redirect(await getDefaultAuthPath());
  }

  return <SignInPageContent registrationEnabled={registrationEnabled} />;
};

export default SignInPage;
