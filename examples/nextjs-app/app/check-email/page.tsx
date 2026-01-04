import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Your Email",
};

export default function CheckEmailPage() {
  return (
    <div className="mx-auto my-36 max-w-[420px] px-4 text-center">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
        Check your email
      </h2>
      <p className="mt-4 text-gray-600">
        We've sent a password reset link to your email address. Please check
        your inbox and click the link to reset your password.
      </p>
      <p className="mt-4 text-sm text-gray-500">
        The link will expire in 30 minutes for security reasons.
      </p>

      <div className="mt-8">
        <Link
          href="/signin"
          className="text-sm font-medium text-sky-600 hover:underline hover:underline-offset-2"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
