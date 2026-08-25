"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getOwnerChurch(userId: string, churchId: string) {
  // Verify the user is actually a manager of this church
  const manager = await prisma.churchManager.findUnique({
    where: { userId_churchId: { userId, churchId } }
  });
  return manager;
}

export async function updateChurchProfile(userId: string, churchId: string, data: any) {
  const manager = await getOwnerChurch(userId, churchId);
  if (!manager) return { error: "No autorizado" };

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
        donationUrl: data.donationUrl,
      }
    });
    revalidatePath("/dashboard");
    revalidatePath("/maps");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar la iglesia" };
  }
}

export async function createEvent(userId: string, churchId: string, data: any) {
  const manager = await getOwnerChurch(userId, churchId);
  if (!manager) return { error: "No autorizado" };

  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        type: data.type,
        imageUrl: data.imageUrl || null,
        isPublic: data.isPublic ?? true,
        churchId,
      }
    });
    revalidatePath("/dashboard");
    revalidatePath("/maps");
    return { success: true };
  } catch (error) {
    return { error: "Error al crear el evento" };
  }
}

export async function updateEvent(userId: string, churchId: string, eventId: string, data: any) {
  const manager = await getOwnerChurch(userId, churchId);
  if (!manager) return { error: "No autorizado" };

  try {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        type: data.type,
        imageUrl: data.imageUrl || null,
        isPublic: data.isPublic ?? true,
      }
    });
    revalidatePath("/dashboard");
    revalidatePath("/maps");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar el evento" };
  }
}

export async function deleteEvent(userId: string, churchId: string, eventId: string) {
  const manager = await getOwnerChurch(userId, churchId);
  if (!manager) return { error: "No autorizado" };

  try {
    await prisma.event.delete({ where: { id: eventId } });
    revalidatePath("/dashboard");
    revalidatePath("/maps");
    return { success: true };
  } catch (error) {
    return { error: "Error al eliminar el evento" };
  }
}
