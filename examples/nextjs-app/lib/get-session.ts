import { cache } from "react";
import { getUserSession } from "@/auth";

async function getUser() {
  const session = await getUserSession();
  const user = session ? session.user : null;
  return { user };
}

export const getSession = cache(getUser);
