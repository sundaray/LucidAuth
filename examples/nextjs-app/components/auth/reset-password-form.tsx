"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";

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

import { resetPasswordAction } from "@/app/actions";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schema";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordValues) {
    setServerError(null);

    if (!token) {
      setServerError("Invalid reset link. Please request a new one.");
      return;
    }

    const result = await resetPasswordAction(token, data.password);

    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {serverError && <FormErrorMessage error={serverError} />}

        {/* Password Field */}
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-password">New Password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="new-password"
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

        {/* Confirm Password Field */}
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="confirm-password"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                  }
                  className="absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center rounded-r-md text-gray-500 transition-colors hover:text-gray-600 focus:z-10 focus:outline-none focus:ring-2 focus:ring-sky-600 disabled:opacity-50"
                  aria-label={
                    isConfirmPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isConfirmPasswordVisible ? (
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
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
