"use client";

import { signUpUser } from "@/app/auth/sign-up/action";
import PasswordInput from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/form-messages";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_SIGN_IN_REDIRECT } from "@/lib/config";
import { signUpSchema, SignUpSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";

const SignUpForm = () => {
  const router = useRouter();
  const [formState, setFormState] = React.useState<{
    success?: string;
    error?: string;
  }>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpSchema) => {
    setFormState({});
    const result = await signUpUser(data);
    if (result.success) {
      setFormState({ success: result.success.reason });
      router.push(result.data?.redirectTo ?? DEFAULT_SIGN_IN_REDIRECT);
    } else if (result.error) {
      setFormState({ error: result.error.reason });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
    >
      <FormSuccess message={formState.success || ""} />
      <FormError message={formState.error || ""} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          autoComplete="name"
          {...register("name")}
        />
        {errors.name && (
          <span className="text-xs text-red-500">{errors.name.message}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <span className="text-xs text-red-500">{errors.email.message}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              value={field.value}
              onChange={field.onChange}
              id="password"
            />
          )}
        />
        {errors.password && (
          <span className="text-xs text-red-500">
            {errors.password.message}
          </span>
        )}
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing up..." : "Sign up"}
      </Button>
    </form>
  );
};

export default SignUpForm;
