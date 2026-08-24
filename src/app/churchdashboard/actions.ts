"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function verifyOwner(userId: string, churchId: string) {
  const manager = await prisma.churchManager.findUnique({
    where: { userId_churchId: { userId, churchId } }
  });
  return !!manager;
}

// ── Church Profile ────────────────────────────────────────────────────────────

export async function updateChurchProfile(userId: string, churchId: string, data: any) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    await prisma.church.update({
      where: { id: churchId },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        phone: data.phone,
        website: data.website,
        type: data.type,
        instagram: data.instagram || null,
        youtube: data.youtube || null,
        facebook: data.facebook || null,
        whatsapp: data.whatsapp || null,
      }
    });
    revalidatePath("/churchdashboard");
    revalidatePath("/maps");
    return { success: true };
  } catch { return { error: "Error al actualizar la iglesia" }; }
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function createEvent(userId: string, churchId: string, data: any) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        type: data.type,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        notes: data.notes || null,
        isPublic: data.isPublic ?? true,
        jointChurches: data.jointChurches && data.jointChurches.length > 0 ? data.jointChurches : null,
        churchId,
      }
    });
    // Add carrusel media
    if (data.mediaUrls && data.mediaUrls.length > 0) {
      await prisma.eventMedia.createMany({
        data: data.mediaUrls.map((url: string) => ({ eventId: event.id, url, type: "image" }))
      });
    }
    revalidatePath("/churchdashboard");
    revalidatePath("/maps");
    return { success: true };
  } catch (e: any) { return { error: "Error al crear el evento: " + e.message }; }
}

export async function updateEvent(userId: string, churchId: string, eventId: string, data: any) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        type: data.type,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        notes: data.notes || null,
        isPublic: data.isPublic ?? true,
        jointChurches: data.jointChurches && data.jointChurches.length > 0 ? data.jointChurches : null,
      }
    });
    // Refresh carrusel media
    if (data.mediaUrls !== undefined) {
      await prisma.eventMedia.deleteMany({ where: { eventId } });
      if (data.mediaUrls.length > 0) {
        await prisma.eventMedia.createMany({
          data: data.mediaUrls.map((url: string) => ({ eventId, url, type: "image" }))
        });
      }
    }
    revalidatePath("/churchdashboard");
    revalidatePath("/maps");
    return { success: true };
  } catch { return { error: "Error al actualizar el evento" }; }
}

export async function deleteEvent(userId: string, churchId: string, eventId: string) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath("/churchdashboard");
    revalidatePath("/maps");
    return { success: true };
  } catch { return { error: "Error al eliminar el evento" }; }
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function createActivity(userId: string, churchId: string, data: any) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    const activity = await prisma.activity.create({
      data: {
        title: data.title,
        description: data.description,
        days: JSON.stringify(data.days || []),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        notes: data.notes || null,
        isActive: true,
        churchId,
      }
    });
    if (data.mediaUrls && data.mediaUrls.length > 0) {
      await prisma.activityMedia.createMany({
        data: data.mediaUrls.map((url: string) => ({ activityId: activity.id, url, type: "image" }))
      });
    }
    revalidatePath("/churchdashboard");
    return { success: true };
  } catch (e: any) { return { error: "Error al crear la actividad: " + e.message }; }
}

export async function updateActivity(userId: string, churchId: string, activityId: string, data: any) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        title: data.title,
        description: data.description,
        days: JSON.stringify(data.days || []),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        notes: data.notes || null,
        isActive: data.isActive ?? true,
      }
    });
    if (data.mediaUrls !== undefined) {
      await prisma.activityMedia.deleteMany({ where: { activityId } });
      if (data.mediaUrls.length > 0) {
        await prisma.activityMedia.createMany({
          data: data.mediaUrls.map((url: string) => ({ activityId, url, type: "image" }))
        });
      }
    }
    revalidatePath("/churchdashboard");
    return { success: true };
  } catch { return { error: "Error al actualizar la actividad" }; }
}

export async function deleteActivity(userId: string, churchId: string, activityId: string) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    await prisma.activity.delete({ where: { id: activityId } });
    revalidatePath("/churchdashboard");
    return { success: true };
  } catch { return { error: "Error al eliminar la actividad" }; }
}

// ── Comments Moderation ───────────────────────────────────────────────────────

export async function toggleCommentVisibility(userId: string, churchId: string, commentId: string) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return { error: "Comentario no encontrado" };
    await prisma.comment.update({
      where: { id: commentId },
      data: { isVisible: !comment.isVisible }
    });
    revalidatePath("/churchdashboard");
    return { success: true };
  } catch { return { error: "Error al actualizar el comentario" }; }
}

// ── Authorized Users ──────────────────────────────────────────────────────────

export async function addAuthorizedUser(userId: string, churchId: string, targetEmail: string, permissions: any) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!targetUser) return { error: "No se encontró un usuario con ese email" };

    await prisma.churchAuthorized.upsert({
      where: { userId_churchId: { userId: targetUser.id, churchId } },
      create: {
        userId: targetUser.id,
        churchId,
        canProfile: permissions.canProfile ?? false,
        canEvents: permissions.canEvents ?? false,
        canActivities: permissions.canActivities ?? false,
        canComments: permissions.canComments ?? false,
      },
      update: {
        canProfile: permissions.canProfile ?? false,
        canEvents: permissions.canEvents ?? false,
        canActivities: permissions.canActivities ?? false,
        canComments: permissions.canComments ?? false,
      }
    });
    revalidatePath("/churchdashboard");
    return { success: true };
  } catch { return { error: "Error al agregar autorizado" }; }
}

export async function removeAuthorizedUser(userId: string, churchId: string, targetUserId: string) {
  if (!await verifyOwner(userId, churchId)) return { error: "No autorizado" };
  try {
    await prisma.churchAuthorized.delete({
      where: { userId_churchId: { userId: targetUserId, churchId } }
    });
    revalidatePath("/churchdashboard");
    return { success: true };
  } catch { return { error: "Error al remover autorizado" }; }
}
