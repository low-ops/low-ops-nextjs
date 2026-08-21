"use server";

import { auth } from "@/lib/auth";
import { isAPIError } from "better-auth/api";
import { ActionResult } from "@/lib/schemas";

function getErrorMessage(error: unknown, fallback: string) {
  if (isAPIError(error)) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function signInUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<ActionResult<{ user: { id: string; email: string } }>> {
  try {
    await auth.api.signInEmail({ body: { email, password } });

    return {
      success: { reason: "Signed in successfully" },
      error: null,
      data: undefined,
    };
  } catch (err) {
    console.error("Sign in failed", err);

    return {
      error: { reason: getErrorMessage(err, "Something went wrong.") },
      success: null,
    };
  }
}
