import { getUserSession } from "@/auth";

export default async function ServerPage() {
  const session = await getUserSession();

  return <h1 className="text-4xl mt-40">{session?.user.email}</h1>;
}
