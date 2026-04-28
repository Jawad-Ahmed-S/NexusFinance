import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientLayoutWrapper from "./components/ClientWrapperLayout";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <ClientLayoutWrapper session={session}>
      {children}
    </ClientLayoutWrapper>
  );
}