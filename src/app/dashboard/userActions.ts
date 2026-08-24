"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── Profile ───────────────────────────────────────────────────────────────────

export async function updateUserProfile(userId: string, data: {
  name?: string; phone?: string; birthDate?: string;
  maritalStatus?: string; recoveryEmail?: string; profileImage?: string;
}) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        maritalStatus: (data.maritalStatus as any) || null,
        recoveryEmail: data.recoveryEmail || null,
        profileImage: data.profileImage || null,
      }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) { return { error: "Error al actualizar el perfil: " + e.message }; }
}

// ── Follow/Unfollow Church ────────────────────────────────────────────────────

export async function toggleFollowChurch(userId: string, churchId: string) {
  const existing = await prisma.churchFollow.findUnique({
    where: { userId_churchId: { userId, churchId } }
  });
  if (existing) {
    await prisma.churchFollow.delete({ where: { userId_churchId: { userId, churchId } } });
    revalidatePath("/dashboard");
    return { following: false };
  } else {
    await prisma.churchFollow.create({ data: { userId, churchId } });
    revalidatePath("/dashboard");
    return { following: true };
  }
}

// ── Like / Save Events ────────────────────────────────────────────────────────

export async function toggleEventLike(userId: string, eventId: string) {
  const existing = await prisma.eventLike.findUnique({ where: { userId_eventId: { userId, eventId } } });
  if (existing) {
    await prisma.eventLike.delete({ where: { userId_eventId: { userId, eventId } } });
    return { liked: false };
  } else {
    await prisma.eventLike.create({ data: { userId, eventId } });
    return { liked: true };
  }
}

export async function toggleEventSave(userId: string, eventId: string) {
  const existing = await prisma.eventSave.findUnique({ where: { userId_eventId: { userId, eventId } } });
  if (existing) {
    await prisma.eventSave.delete({ where: { userId_eventId: { userId, eventId } } });
    return { saved: false };
  } else {
    await prisma.eventSave.create({ data: { userId, eventId } });
    return { saved: true };
  }
}

export async function toggleActivityLike(userId: string, activityId: string) {
  const existing = await prisma.activityLike.findUnique({ where: { userId_activityId: { userId, activityId } } });
  if (existing) {
    await prisma.activityLike.delete({ where: { userId_activityId: { userId, activityId } } });
    return { liked: false };
  } else {
    await prisma.activityLike.create({ data: { userId, activityId } });
    return { liked: true };
  }
}

export async function toggleActivitySave(userId: string, activityId: string) {
  const existing = await prisma.activitySave.findUnique({ where: { userId_activityId: { userId, activityId } } });
  if (existing) {
    await prisma.activitySave.delete({ where: { userId_activityId: { userId, activityId } } });
    return { saved: false };
  } else {
    await prisma.activitySave.create({ data: { userId, activityId } });
    return { saved: true };
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function addComment(userId: string, churchId: string, rating: number, text: string) {
  try {
    await prisma.comment.create({
      data: { userId, churchId, rating, text, isVisible: true }
    });
    revalidatePath("/maps");
    return { success: true };
  } catch { return { error: "Error al publicar el comentario" }; }
}

// ── Track Stats ───────────────────────────────────────────────────────────────

export async function trackChurchClick(churchId: string, type: "map_click" | "profile_view") {
  try {
    await prisma.churchStat.create({ data: { churchId, type } });
  } catch { /* silent */ }
}

// ── Get Public Events ─────────────────────────────────────────────────────────

export async function getPublicEvents() {
  return prisma.event.findMany({
    where: { isPublic: true, eventDate: { gte: new Date() } },
    include: {
      church: { select: { id: true, name: true, imageUrl: true, type: true, instagram: true, youtube: true, facebook: true, whatsapp: true, phone: true, website: true } },
      media: true,
      likes: { select: { userId: true } },
      saves: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" }, // newest published first
  });
}

export async function getPublicChurchDetail(churchId: string) {
  return prisma.church.findUnique({
    where: { id: churchId },
    include: {
      events: { where: { isPublic: true, eventDate: { gte: new Date() } }, include: { media: true, likes: { select: { userId: true } }, saves: { select: { userId: true } } }, orderBy: { eventDate: "asc" }, take: 10 },
      activities: { where: { isActive: true }, include: { media: true, likes: { select: { userId: true } }, saves: { select: { userId: true } } } },
      comments: { where: { isVisible: true }, include: { user: { select: { name: true, profileImage: true } }, media: true }, orderBy: { createdAt: "desc" } },
      followers: { select: { userId: true } },
    }
  });
}
