import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default async function ResetPasswordPage() {
  return (
    <div className="mx-auto my-36 max-w-[380px] px-4">
      <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
        Reset your password
      </h2>
      <p className="mt-1 text-center text-gray-600">
        Enter your new password below
      </p>

      <div className="mt-10">
        <ResetPasswordForm />

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
