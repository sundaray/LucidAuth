import { SignInWithGoogleForm } from "@/components/signin-with-google-form";
import { CredentialsSignInForm } from "@/components/auth/credentials-signin-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ next: string }>;
}) {
  const resolvedParams = await searchParams;
  const next = resolvedParams.next || "/dashboard";

  return (
    <div className="mx-auto my-36 max-w-[380px] px-4">
      <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
        Welcome back
      </h2>
      <p className="mt-1 text-center text-gray-600">Sign in to your account</p>

      <div className="mt-10 grid gap-4">
        <SignInWithGoogleForm />

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm text-gray-600">
            <span className="bg-white px-2">Or continue with</span>
          </div>
        </div>

        <CredentialsSignInForm next={next} />

        <div className="mt-2 text-center text-sm">
          <span className="text-gray-500">Don&apos;t have an account? </span>
          <Link
            href="/signup"
            className="font-medium text-sky-600 hover:underline hover:underline-offset-2"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
