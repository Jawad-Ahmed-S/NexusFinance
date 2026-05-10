import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ClientWrapperLayout from "./components/ClientWrapperLayout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = String((session.user as { role?: string } | undefined)?.role ?? "").toLowerCase();
  if (role !== "admin") {
    redirect("/dashboard");
  }

  return <ClientWrapperLayout>{children}</ClientWrapperLayout>;
}