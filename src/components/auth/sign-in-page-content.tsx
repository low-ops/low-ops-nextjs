"use client";

import SignInForm from "@/components/auth/sign-in-form";
import { Button } from "@/components/ui/button";
import { GithubIcon, GoogleIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { signInWithGithub, signInWithGoogle } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";

const isGoogleEnabled = process.env.GOOGLE_CLIENT_ID !== undefined;
const isGithubEnabled = process.env.GITHUB_CLIENT_ID !== undefined;

type SignInPageContentProps = {
  registrationEnabled: boolean;
};

export function SignInPageContent({
  registrationEnabled,
}: SignInPageContentProps) {
  return (
    <div className="grid min-h-svh xl:grid-cols-2">
      <div className="bg-muted relative hidden xl:flex xl:items-center xl:justify-center rounded-r-3xl overflow-hidden">
        <Image
          src="/auth-illustration.png"
          alt="Sign in illustration"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          fill
        />
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10">
        <Logo />

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm mb-48">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 mb-4">
                <h1 className="text-2xl font-bold">Sign in to your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  {registrationEnabled
                    ? "Create the first admin account or sign in if one already exists"
                    : "Enter your email below to sign in to your account"}
                </p>
              </div>

              <SignInForm />

              {(isGoogleEnabled || isGithubEnabled) && (
                <>
                  <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {isGithubEnabled && (
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={signInWithGithub}
                      >
                        <GithubIcon className="mr-2" />
                        Sign in with GitHub
                      </Button>
                    )}
                    {isGoogleEnabled && (
                      <Button
                        variant="outline"
                        className="w-full"
                        type="button"
                        onClick={signInWithGoogle}
                      >
                        <GoogleIcon className="mr-2" />
                        Sign in with Google
                      </Button>
                    )}
                  </div>
                </>
              )}

              {registrationEnabled && (
                <p className="text-center text-sm text-muted-foreground">
                  Need to set up this app?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Create admin account
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
