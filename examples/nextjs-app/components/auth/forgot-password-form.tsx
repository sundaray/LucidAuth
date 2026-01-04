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

import { forgotPasswordAction } from "@/app/actions";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/schema";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setServerError(null);

    const result = await forgotPasswordAction(data.email);

    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {serverError && <FormErrorMessage error={serverError} />}

        {/* Email Field */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
              <Input
                {...field}
                id="forgot-password-email"
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

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="mt-2 h-10 w-full rounded-full"
        >
          {form.formState.isSubmitting ? (
            <>
              <Icons.spinner className="mr-2 size-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
