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
    return { success: true };
  } catch (error) {
    return { error: "Failed to save church" };
  }
}
