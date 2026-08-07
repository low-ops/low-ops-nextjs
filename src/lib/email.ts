import { Resend } from "resend";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** When Resend is configured, signup requires email verification. Otherwise users are auto-verified. */
export function isEmailVerificationEnabled() {
  return isEmailConfigured();
}

export async function sendEmail(payload: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!isEmailConfigured()) {
    console.warn(
      "[email] RESEND_API_KEY is not set. Skipping email send.",
      { to: payload.to, subject: payload.subject },
    );
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: "Low-Ops <no-reply@low-ops.com>",
      ...payload,
    });

    if (response.error) {
      console.warn("[email] Failed to send email:", response.error);
      return false;
    }

    return Boolean(response.data);
  } catch (error) {
    console.warn("[email] Failed to send email:", error);
    return false;
  }
}
