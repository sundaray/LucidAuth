"use client";

import { useUserSession } from "lucidauth/react";

export default function ClientPage() {
  const { isLoading, isError, isAuthenticated, session } = useUserSession();

  if (isLoading) {
    return <h1 className="text-2xl">Loading...</h1>;
  }

  if (isError) {
    return <h1>Error fetching user session.</h1>;
  }

  if (!isAuthenticated) {
    return <h1>Please sign in.</h1>;
  }

  return <h1 className="text-4xl mt-40">{session?.user.email}</h1>;
}
