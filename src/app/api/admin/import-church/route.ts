import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, type, address, latitude, longitude } = body;

    const church = await prisma.church.create({
      data: { name, type, address, latitude, longitude }
    });

    return NextResponse.json({ success: true, church });
  } catch (error) {
    return NextResponse.json({ error: "Error al importar iglesia" }, { status: 500 });
  }
}
