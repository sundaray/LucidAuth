import { SignInWithGoogleForm } from "@/components/signin-with-google-form";
import { CredentialsSignUpForm } from "@/components/auth/credentials-signup-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignUp() {
  return (
    <div className="mx-auto my-36 max-w-[380px] px-4">
      <h2 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
        Create an account
      </h2>
      <p className="mt-1 text-center text-gray-600">Enter your details below</p>

      <div className="mt-10 grid gap-4">
        {/* Google form can likely be reused for Sign Up if the provider supports auto-creation */}
        <SignInWithGoogleForm />

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm text-gray-600">
            <span className="bg-white px-2">Or continue with</span>
          </div>
        </div>

        <CredentialsSignUpForm />

        <div className="mt-2 text-center text-sm">
          <span className="text-gray-500">Already have an account? </span>
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
