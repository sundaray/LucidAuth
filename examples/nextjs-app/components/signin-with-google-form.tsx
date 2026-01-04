"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signInWithGoogle } from "@/app/actions";

export function SignInWithGoogleForm() {
  const [isPending, setIsPending] = useState(false);

  async function handleSignInWithGoogle() {
    try {
      setIsPending(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
      setIsPending(false);
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="lg"
        onClick={handleSignInWithGoogle}
        disabled={isPending}
        className="h-10 w-full border hover:border-zinc-300 text-base text-zinc-700"
      >
        <Icons.google className="inline-block size-5" />
        Sign in with Google
      </Button>
    </div>
  );
}
