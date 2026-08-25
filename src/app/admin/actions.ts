"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/admin/maps");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update user status" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/admin/maps");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete user" };
  }
}

import bcrypt from "bcryptjs";

export async function updateUser(userId: string, data: any) {
  try {
    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      recoveryEmail: data.recoveryEmail,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    
    revalidatePath("/admin/maps");
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Failed to update user" };
  }
}

export async function deleteChurch(churchId: string) {
  try {
    await prisma.church.delete({
      where: { id: churchId },
    });
    revalidatePath("/admin/maps");
    revalidatePath("/maps");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete church" };
  }
}

export async function saveChurch(data: any) {
  try {
    if (data.id) {
      await prisma.church.update({
        where: { id: data.id },
        data: {
          name: data.name,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          type: data.type,
          description: data.description,
        }
      });
    } else {
      await prisma.church.create({
        data: {
          name: data.name,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          type: data.type,
          description: data.description,
        }
      });
    }
    revalidatePath("/admin/maps");
    revalidatePath("/maps");
    return { success: true, churchId: data.id || undefined };
  } catch (error) {
    return { error: "Failed to save church" };
  }
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });
    return { users };
  } catch (error) {
    return { error: "Failed to get users" };
  }
}

export async function assignChurchManager(userId: string, churchId: string) {
  try {
    // Check if already assigned
    const existing = await prisma.churchManager.findUnique({
      where: {
        userId_churchId: { userId, churchId }
      }
    });

    if (existing) {
      return { error: "El usuario ya es dueño de esta iglesia." };
    }

    await prisma.churchManager.create({
      data: {
        userId,
        churchId,
      }
    });
    revalidatePath("/admin/maps");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al asignar dueño" };
  }
}

export async function removeChurchManager(userId: string, churchId: string) {
  try {
    await prisma.churchManager.delete({
      where: {
        userId_churchId: { userId, churchId }
      }
    });
    revalidatePath("/admin/maps");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Error al remover dueño" };
  }
}

export async function importOsmChurch(data: any) {
  try {
    const newChurch = await prisma.church.create({
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        type: data.type,
      }
    });
    revalidatePath("/maps");
    revalidatePath("/admin");
    return { success: true, church: newChurch };
  } catch (error) {
    return { error: "Error al importar iglesia" };
  }
}

// ────────────────────────────────────────────────────────────────────────
// Admin Event Actions
// ────────────────────────────────────────────────────────────────────────

export async function saveEventAdmin(data: any) {
  try {
    if (data.id) {
      await prisma.event.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description,
          eventDate: new Date(data.eventDate),
          type: data.type,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          isPublic: data.isPublic,
          churchId: data.churchId,
        }
      });
    } else {
      await prisma.event.create({
        data: {
          title: data.title,
          description: data.description,
          eventDate: new Date(data.eventDate),
          type: data.type,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          isPublic: data.isPublic,
          churchId: data.churchId,
        }
      });
    }
    revalidatePath("/admin/maps");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to save event" };
  }
}

export async function deleteEventAdmin(eventId: string) {
  try {
    await prisma.event.delete({
      where: { id: eventId },
    });
    revalidatePath("/admin/maps");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete event" };
  }
}

// ────────────────────────────────────────────────────────────────────────
// Admin Activity Actions
// ────────────────────────────────────────────────────────────────────────

export async function saveActivityAdmin(data: any) {
  try {
    if (data.id) {
      await prisma.activity.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description,
          days: data.days,
          startTime: data.startTime,
          endTime: data.endTime,
          isActive: data.isActive,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          churchId: data.churchId,
        }
      });
    } else {
      await prisma.activity.create({
        data: {
          title: data.title,
          description: data.description,
          days: data.days,
          startTime: data.startTime,
          endTime: data.endTime,
          isActive: data.isActive,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          churchId: data.churchId,
        }
      });
    }
    revalidatePath("/admin/maps");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to save activity" };
  }
}

export async function deleteActivityAdmin(activityId: string) {
  try {
    await prisma.activity.delete({
      where: { id: activityId },
    });
    revalidatePath("/admin/maps");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete activity" };
  }
}
