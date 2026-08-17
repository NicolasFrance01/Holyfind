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
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete church" };
  }
}
