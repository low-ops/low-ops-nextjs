"use client";

import LoginForm from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GithubIcon, GoogleIcon } from "@/components/ui/icons";
import { signInWithGithub, signInWithGoogle } from "@/lib/auth-client";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";

const isGoogleEnabled = process.env.GOOGLE_CLIENT_ID !== undefined;
const isGithubEnabled = process.env.GITHUB_CLIENT_ID !== undefined;

const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <div className="flex flex-col items-center w-full max-w-md gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Zexa Better Auth
        </a>
        <Card className="w-full">
          <CardContent className="flex flex-col gap-4 pt-6">
            <LoginForm />
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
                    className="w-1/2 flex items-center justify-center cursor-pointer"
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
                    className="w-1/2 flex items-center justify-center cursor-pointer"
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
              Not registered?{" "}
              <Link
                href="/auth/register"
                className="text-primary underline hover:no-underline font-medium"
              >
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
