"use client";

import { signInUser } from "@/app/auth/sign-in/action";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form-messages";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormData = z.infer<typeof schema>;

const SignInForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const [isVisible, setIsVisible] = useState(false);
  const [formState, setFormState] = useState<{
    success?: string;
    error?: string;
  }>({});

  const passwordId = useId();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setFormState({});
    const result = await signInUser(data);
    if (result.success) {
      setFormState({ success: result.success.reason });
      router.push("/admin/users");
    } else if (result.error) {
      setFormState({ error: result.error.reason });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormSuccess message={formState.success || ""} />
      <FormError message={formState.error || ""} />

      <div className="grid gap-2 mb-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex w-9 items-center justify-center text-muted-foreground/80">
            <Mail size={16} aria-hidden="true" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            className="ps-9"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <span className="text-xs text-red-500">{errors.email.message}</span>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor={passwordId}>Password</Label>
        </div>
        <div className="relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex w-9 items-center justify-center text-muted-foreground/80">
            <Lock size={16} aria-hidden="true" />
          </div>
          <Input
            id={passwordId}
            type={isVisible ? "text" : "password"}
            autoComplete="current-password"
            className="ps-9 pe-9"
            {...register("password")}
          />
          <button
            className="absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            type="button"
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
          >
            {isVisible ? (
              <EyeOffIcon size={16} aria-hidden="true" />
            ) : (
              <EyeIcon size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <span className="text-xs text-red-500">
            {errors.password.message}
          </span>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
};

export default SignInForm;
