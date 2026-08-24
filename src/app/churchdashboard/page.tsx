import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChurchDashboardClient from "./ChurchDashboardClient";

export default async function ChurchDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const user = session.user as any;

  if (user.role === "SUPERADMIN") redirect("/admin/maps");
  if (user.role === "USER") redirect("/dashboard");

  // Find by email (more reliable than session id)
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email || "" },
    select: { id: true, isActive: true, role: true }
  });

  if (!dbUser || !dbUser.isActive) redirect("/login");
  if (dbUser.role === "USER") redirect("/dashboard");

  // Get churches managed by this user (OWNER) or authorized access
  const managedChurches = await prisma.churchManager.findMany({
    where: { userId: dbUser.id },
    include: {
      church: {
        include: {
          events: { 
            include: { likes: true, saves: true }, 
            orderBy: { eventDate: "asc" } 
          },
          activities: { 
            include: { likes: true, saves: true }, 
            orderBy: { createdAt: "desc" } 
          },
          comments: {
            include: { user: { select: { name: true, profileImage: true } } },
            orderBy: { createdAt: "desc" }
          },
          followers: true,
          stats: true,
        }
      }
    }
  });

  const churches = managedChurches.map((m: any) => m.church);

  return (
    <ChurchDashboardClient
      churches={churches}
      userId={dbUser.id}
      userEmail={user.email}
    />
  );
}
