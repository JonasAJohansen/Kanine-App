import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import KanineApp from "@/components/KanineApp";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <KanineApp />;
}