"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Icons } from "@/components/icons";
import { FormErrorMessage } from "@/components/auth/form-error-message";

import { signInWithEmailAndPassword } from "@/app/actions"; // Your server action
import { signInSchema, type SignInValues } from "@/lib/schema";

export function CredentialsSignInForm({ next }: { next: string }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInValues) {
    setServerError(null);

    // Call your server action
    const result = await signInWithEmailAndPassword(next, data);

    if (result?.error) {
      setServerError(result.error);
    } else {
      // On success, Next.js redirect in action handles navigation,
      // but purely for client-side safety/refresh:
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {/* Server Error Display */}
        {serverError && <FormErrorMessage error={serverError} />}

        {/* Email Field */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signin-email">Email</FieldLabel>
              <Input
                {...field}
                id="signin-email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error?.message]} />
              )}
            </Field>
          )}
        />

        {/* Password Field */}
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="signin-password">Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-sky-600 hover:underline hover:underline-offset-2"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  {...field}
                  id="signin-password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center rounded-r-md text-gray-500 transition-colors hover:text-gray-600 focus:z-10 focus:outline-none focus:ring-2 focus:ring-sky-600 disabled:opacity-50"
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordVisible ? (
                    <Icons.eyeOff className="size-4" />
                  ) : (
                    <Icons.eye className="size-4" />
                  )}
                </button>
              </div>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error?.message]} />
              )}
            </Field>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="mt-2 h-10 w-full rounded-full"
        >
          {form.formState.isSubmitting ? (
            <>
              <Icons.spinner className="mr-2 size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
