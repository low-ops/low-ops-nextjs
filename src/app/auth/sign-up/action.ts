"use server";

import { auth } from "@/lib/auth";
import { DEFAULT_SIGN_IN_REDIRECT } from "@/lib/config";
import { isEmailVerificationEnabled } from "@/lib/email";
import { isRegistrationEnabled } from "@/lib/founding-admins";
import { ActionResult, signUpSchema, SignUpSchema } from "@/lib/schemas";
import { isAPIError } from "better-auth/api";

function getErrorMessage(error: unknown, fallback: string) {
  if (isAPIError(error)) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

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
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: DEFAULT_SIGN_IN_REDIRECT,
      },
    });

    if (!result?.user) {
      return {
        success: null,
        error: { reason: "Failed to create account." },
      };
    }

    const emailVerificationEnabled = isEmailVerificationEnabled();

    return {
      success: {
        reason: emailVerificationEnabled
          ? "Sign up successful! Check your email to confirm your account."
          : "Account created successfully!",
      },
      error: null,
      data: {
        user: { id: result.user.id, email: result.user.email },
        redirectTo: emailVerificationEnabled
          ? "/auth/sign-in"
          : DEFAULT_SIGN_IN_REDIRECT,
      },
    };
  } catch (error) {
    if (isAPIError(error)) {
      console.error("Sign up failed", {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        body: error.body,
      });
    } else {
      console.error("Sign up failed", error);
    }

    return {
      success: null,
      error: { reason: getErrorMessage(error, "Something went wrong.") },
    };
  }
}
