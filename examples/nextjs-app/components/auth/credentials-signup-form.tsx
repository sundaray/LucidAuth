"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { signUpWithEmailAndPassword } from "@/app/actions";
import { signUpSchema, type SignUpValues } from "@/lib/schema";

export function CredentialsSignUpForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignUpValues) {
    setServerError(null);
    setSuccessMessage(null);

    const result = await signUpWithEmailAndPassword(data);

    if (result?.error) {
      setServerError(result.error);
    } else if (result?.success) {
      setSuccessMessage(
        result.message || "Verification email sent! Please check your inbox."
      );
      form.reset();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {serverError && <FormErrorMessage error={serverError} />}

        {successMessage && (
          <div
            className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded-r-md flex items-center gap-3 text-sm shadow-sm animate-in fade-in-0 slide-in-from-top-1"
            role="alert"
          >
            <Icons.check className="size-4 shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Name Field */}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-name">Name</FieldLabel>
              <Input
                {...field}
                id="signup-name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error?.message]} />
              )}
            </Field>
          )}
        />

        {/* Email Field */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input
                {...field}
                id="signup-email"
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
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="signup-password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="new-password"
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
              Creating account...
            </>
          ) : (
            "Sign up"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
