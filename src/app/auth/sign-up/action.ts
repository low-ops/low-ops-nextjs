"use server";

import { auth } from "@/lib/auth";
import { DEFAULT_SIGN_IN_REDIRECT } from "@/lib/config";
import { isEmailVerificationEnabled } from "@/lib/email";
import { isRegistrationEnabled } from "@/lib/founding-admins";
import { ActionResult, signUpSchema, SignUpSchema } from "@/lib/schemas";
import { APIError } from "better-auth/api";

export async function signUpUser(formData: SignUpSchema): Promise<
  ActionResult<{
    user: { id: string; email: string };
    redirectTo: string;
  }>
> {
  const parsed = signUpSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: null,
      error: { reason: parsed.error.issues[0]?.message || "Invalid input" },
    };
  }

  const { email, password, name } = parsed.data;

  if (!(await isRegistrationEnabled())) {
    return {
      success: null,
      error: { reason: "Registration is currently disabled." },
    };
  }

  try {
    const { user } = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: DEFAULT_SIGN_IN_REDIRECT,
      },
    });

    const emailVerificationEnabled = isEmailVerificationEnabled();

    return {
      success: {
        reason: emailVerificationEnabled
          ? "Sign up successful! Check your email to confirm your account."
          : "Account created successfully!",
      },
      error: null,
      data: {
        user: { id: user.id, email: user.email },
        redirectTo: emailVerificationEnabled
          ? "/auth/sign-in"
          : DEFAULT_SIGN_IN_REDIRECT,
      },
    };
  } catch (error) {
    if (error instanceof APIError) {
      console.error(error?.message ?? JSON.stringify(error));
      switch (error.status) {
        case "UNPROCESSABLE_ENTITY":
          return { error: { reason: "User already exists." }, success: null };
        case "BAD_REQUEST":
          return { error: { reason: "Invalid email." }, success: null };
        default:
          return { error: { reason: "Something went wrong." }, success: null };
      }
    }

    return { error: { reason: "Something went wrong." }, success: null };
  }
}
