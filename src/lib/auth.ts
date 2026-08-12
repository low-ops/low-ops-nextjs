import { db } from "@/db";
import * as schema from "@/db/schema";
import { getAuthBaseUrlConfig, getAuthConfig, getTrustedOrigins } from "@/lib/env";
import {
  applyFoundingAdminToNewUser,
  getExistingUserCount,
  isRegistrationEnabled,
  isSignUpUserCreation,
} from "@/lib/founding-admins";
import { sendEmail, isEmailVerificationEnabled } from "@/lib/email";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const authConfig = getAuthConfig();

const socialProviders: Record<string, { clientId: string; clientSecret: string; prompt?: string }> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    prompt: "select_account",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  secret: authConfig.secret,
  baseURL: getAuthBaseUrlConfig(),
  trustedOrigins: getTrustedOrigins(),
  advanced: {
    trustedProxyHeaders: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.user,
    },
  }),
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: isEmailVerificationEnabled(),
    resetPasswordTokenExpiresIn: 60 * 60,
  },
  ...(isEmailVerificationEnabled()
    ? {
        emailVerification: {
          sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
              to: user.email,
              subject: "Verify your email address",
              text: `Click the link to verify your email: ${url}`,
            });
          },
          sendOnSignUp: true,
          autoSignInAfterVerification: false,
        },
      }
    : {}),
  socialProviders,
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      if (!(await isRegistrationEnabled())) {
        throw new APIError("BAD_REQUEST", {
          message: "Registration is currently disabled.",
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData, ctx) => {
          if (!isSignUpUserCreation(ctx)) {
            return { data: userData };
          }

          const existingUserCount = await getExistingUserCount();

          if (existingUserCount > 0) {
            throw new APIError("BAD_REQUEST", {
              message: "Registration is currently disabled.",
            });
          }

          let data = applyFoundingAdminToNewUser(userData, existingUserCount);

          if (!isEmailVerificationEnabled()) {
            data = { ...data, emailVerified: true };
          }

          return { data };
        },
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
});
