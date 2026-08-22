import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminMapsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "SUPERADMIN") {
    redirect("/login");
  }

  const churches = await prisma.church.findMany({
    include: {
      managers: {
        include: { user: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, email: true, name: true, dni: true, isActive: true, emailConfirmed: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminDashboardClient churches={churches} users={users} />
  );
}
