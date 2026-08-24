import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserDashboardClient from "./UserDashboardClient";

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;

  // Role-based routing
  if (user.role === "SUPERADMIN") redirect("/admin/maps");
  if (user.role === "CLIENT") redirect("/churchdashboard");

  // Find by email
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email || "" },
    select: {
      id: true, email: true, name: true, role: true, isActive: true,
      profileImage: true, phone: true, phoneVerified: true,
      birthDate: true, maritalStatus: true, recoveryEmail: true,
      createdAt: true, dni: true,
    }
  });

  if (!dbUser || !dbUser.isActive) redirect("/login");

  // Get followed churches
  const followedChurches = await prisma.churchFollow.findMany({
    where: { userId: dbUser.id },
    include: {
      church: {
        include: {
          events: { where: { isPublic: true, eventDate: { gte: new Date() } }, orderBy: { eventDate: "asc" }, take: 5 },
          activities: { where: { isActive: true } },
        }
      }
    }
  });

  // Saved events
  const savedEvents = await prisma.eventSave.findMany({
    where: { userId: dbUser.id },
    include: {
      event: {
        include: {
          church: { select: { id: true, name: true, imageUrl: true, type: true } },
          media: true,
          likes: { select: { userId: true } },
          saves: { select: { userId: true } },
        }
      }
    },
    orderBy: { id: "desc" }
  });

  // Saved activities
  const savedActivities = await prisma.activitySave.findMany({
    where: { userId: dbUser.id },
    include: {
      activity: {
        include: {
          church: { select: { id: true, name: true, imageUrl: true } },
          media: true,
        }
      }
    }
  });

  // Liked event IDs (for UI toggle state)
  const likedEventIds = (await prisma.eventLike.findMany({
    where: { userId: dbUser.id }, select: { eventId: true }
  })).map(l => l.eventId);

  const savedEventIds = savedEvents.map(s => s.eventId);

  return (
    <UserDashboardClient
      user={dbUser as any}
      followedChurches={followedChurches.map(f => f.church)}
      savedEvents={savedEvents.map(s => s.event)}
      savedActivities={savedActivities.map(s => s.activity)}
      likedEventIds={likedEventIds}
      savedEventIds={savedEventIds}
    />
  );
}
