import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto my-36 max-w-[380px] px-4">
      <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
        Forgot your password?
      </h2>
      <p className="mt-1 text-center text-gray-600">
        Enter your email and we'll send you a reset link
      </p>

      <div className="mt-10">
        <ForgotPasswordForm />

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-500">Remember your password? </span>
          <Link
            href="/signin"
            className="font-medium text-sky-600 hover:underline hover:underline-offset-2"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
