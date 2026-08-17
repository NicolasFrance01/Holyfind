import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientDashboardClient from "./ClientDashboardClient";

export default async function ClientMapsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CLIENT") {
    // If not CLIENT, redirect. If SUPERADMIN, they should use the other panel.
    redirect("/login");
  }

  const userId = (session.user as any).id;

  const assignedChurches = await prisma.church.findMany({
    where: {
      managers: {
        some: {
          userId: userId,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ClientDashboardClient churches={assignedChurches} />
  );
}
