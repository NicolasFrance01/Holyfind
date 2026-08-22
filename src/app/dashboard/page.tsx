import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  // Both SUPERADMIN and CLIENT can access. Redirect to admin panel if superadmin.
  if (user.role === "SUPERADMIN") {
    redirect("/admin/maps");
  }

  if (!user.id) {
    redirect("/login");
  }

  // Get churches managed by this user
  const managedChurches = await prisma.churchManager.findMany({
    where: { userId: user.id },
    include: {
      church: {
        include: {
          events: {
            orderBy: { eventDate: "asc" }
          }
        }
      }
    }
  });

  const churches = managedChurches.map((m: any) => m.church);

  return <DashboardClient churches={churches} userId={user.id} userEmail={user.email} />;
}
