"use server";

import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { ActionResult } from "@/lib/schemas";
import { signUpSchema, SignUpSchema } from "@/lib/schemas";
import { DEFAULT_SIGN_IN_REDIRECT } from "@/lib/config";
import { isEmailVerificationEnabled } from "@/lib/email";

export async function signUpUser(
  formData: SignUpSchema,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: null,
      error: { reason: parsed.error.issues[0]?.message || "Invalid input" },
    };
  }

  const { email, password, name } = parsed.data;

  try {
    const { user } = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: DEFAULT_SIGN_IN_REDIRECT,
      },
    });

    return {
      success: {
        reason: isEmailVerificationEnabled()
          ? "Sign up successful! Check your email to confirm your account, then sign in."
          : "Sign up successful! Please sign in to continue.",
      },
      error: null,
      data: { user: { id: user.id, email: user.email } },
    };
  } catch (error) {
    if (error instanceof APIError) {
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
