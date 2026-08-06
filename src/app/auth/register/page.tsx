"use client";

import RegisterForm from "@/components/auth/register-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GithubIcon, GoogleIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { signInWithGithub, signInWithGoogle } from "@/lib/auth-client";
import Link from "next/link";

const isGoogleEnabled = process.env.GOOGLE_CLIENT_ID !== undefined;
const isGithubEnabled = process.env.GITHUB_CLIENT_ID !== undefined;

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <div className="flex flex-col items-center w-full max-w-md gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium text-lg"
        >
          <Logo size={24} />
          Low-Ops Nextjs Template
        </Link>
        <Card className="w-full mb-16 md:mb-48">
          <CardContent className="flex flex-col gap-4 pt-6">
            <RegisterForm />
            <div className="flex items-center my-2">
              <div className="flex-1 h-px bg-muted-foreground/30" />
              <span className="mx-3 text-muted-foreground text-xs font-medium">
                OR
              </span>
              <div className="flex-1 h-px bg-muted-foreground/30" />
            </div>
            {(isGoogleEnabled || isGithubEnabled) && (
              <div className="flex flex-row gap-2 w-full">
                {isGoogleEnabled && (
                  <Button
                    variant="outline"
                    className="w-1/2 flex items-center justify-center"
                    type="button"
                    onClick={signInWithGoogle}
                  >
                    <GoogleIcon className="mr-2" />
                    Google
                  </Button>
                )}
                {isGithubEnabled && (
                  <Button
                    variant="outline"
                    className="w-1/2 flex items-center justify-center"
                    type="button"
                    onClick={signInWithGithub}
                  >
                    <GithubIcon className="mr-2" />
                    GitHub
                  </Button>
                )}
              </div>
            )}
            <div className="text-center text-sm mt-4">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary underline hover:no-underline font-medium"
              >
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
