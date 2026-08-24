import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({});

  const userId = (session.user as any).id;
  if (!userId) return NextResponse.json({});

  if (req.method === "POST" || req.method === "PATCH") {
    try {
      const data = await req.json();
      const { name, dni, phone, birthDate, maritalStatus, profileImage } = data;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (dni !== undefined) updateData.dni = dni;
      if (phone !== undefined) updateData.phone = phone;
      if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
      if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus || null;
      if (profileImage !== undefined) updateData.image = profileImage;

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return NextResponse.json({ success: true });
    } catch (e) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
  }

  try {
    const [likes, saves, follows] = await Promise.all([
      prisma.eventLike.findMany({ where: { userId }, select: { eventId: true } }),
      prisma.eventSave.findMany({ where: { userId }, select: { eventId: true } }),
      prisma.churchFollow.findMany({ where: { userId }, select: { churchId: true } }),
    ]);

    return NextResponse.json({
      likes: likes.map(l => l.eventId),
      saves: saves.map(s => s.eventId),
      follows: follows.map(f => f.churchId),
    });
  } catch (e) {
    return NextResponse.json({});
  }
}
