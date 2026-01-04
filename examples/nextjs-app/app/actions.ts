"use server";

import { signIn, signUp, signOut, forgotPassword, resetPassword } from "@/auth";
import { LucidAuthError } from "lucidauth/core/errors";
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/schema";
import { rethrowIfRedirect } from "@/lib/next-redirect";

  export async function signInWithGoogle() {
    try {
      await signIn("google", { redirectTo: "/dashboard" });
    } catch (error) {
      rethrowIfRedirect(error);

      console.log("signInWithGoogle error: ", error);

      if (error instanceof LucidAuthError) {
        return { error: "Google sign-in failed. Please try again." };
      }
      return {
        error: "Something went wrong. Please try again.",
      };
    }
  }

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signInWithEmailAndPassword(next: string, data: unknown) {
  const parsed = signInSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid input data" };
  }

  try {
    await signIn("credential", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: `/${next}`,
    });
  } catch (error) {
    rethrowIfRedirect(error);

    console.log("signInWithEmailAndPassword error: ", error);

    if (error instanceof LucidAuthError) {
      switch (error.name) {
        case "AccountNotFoundError":
          return { error: "No account found with this email. Please sign up." };

        case "InvalidCredentialsError":
          return { error: "Invalid email or password." };

        default:
          return {
            error: "Sign-in failed. Please try again.",
          };
      }
    }
    return { error: "Something went wrong. Please try again." };
  }
}

// Sign Up Action
export async function signUpWithEmailAndPassword(data: unknown) {
  const parsed = signUpSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid input data" };
  }

  try {
    await signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
    });
  } catch (error) {
    rethrowIfRedirect(error);

    console.log("signUpWithEmailAndPassword error: ", error);

    if (error instanceof LucidAuthError) {
      switch (error.name) {
        case "AccountAlreadyExistsError":
          return {
            error: "An account with this email already exists. Please sign in.",
          };
        default:
          return {
            error: "Sign-up failed. Please try again.",
          };
      }
    }
    return { error: "Something went wrong. Please try again." };
  }
}

// Forgot Password Action
export async function forgotPasswordAction(email: string) {
  const parsed = forgotPasswordSchema.safeParse({ email });

  if (!parsed.success) {
    return { error: "Invalid email address" };
  }

  try {
    await forgotPassword(parsed.data.email);
  } catch (error) {
    rethrowIfRedirect(error);

    console.log("forgotPassword error: ", error);

    if (error instanceof LucidAuthError) {
      return {
        error: "Failed to process forgot password request. Please try again.",
      };
    }

    return { error: "Something went wrong. Please try again." };
  }
}

// Reset Password Action
export async function resetPasswordAction(token: string, newPassword: string) {
  const parsed = resetPasswordSchema.safeParse({
    password: newPassword,
    confirmPassword: newPassword,
  });

  if (!parsed.success) {
    return { error: "Invalid password" };
  }

  try {
    await resetPassword(token, parsed.data.password);
  } catch (error) {
    rethrowIfRedirect(error);

    console.log("resetPassword error: ", error);

    if (error instanceof LucidAuthError) {
      switch (error.name) {
        case "InvalidPasswordResetTokenError":
          return {
            error:
              "Invalid password reset token. Please request a new password reset link.",
          };
        case "ExpiredPasswordResetTokenError":
          return {
            error:
              "Password reset token has expired. Please request a new password reset link.",
          };
        default:
          return {
            error:
              "Failed to process password reset request. Please try again.",
          };
      }
    }

    return { error: "Something went wrong. Please try again." };
  }
}
