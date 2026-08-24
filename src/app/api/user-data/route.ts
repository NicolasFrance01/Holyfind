import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({});

  const userId = (session.user as any).id;
  if (!userId) return NextResponse.json({});

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
