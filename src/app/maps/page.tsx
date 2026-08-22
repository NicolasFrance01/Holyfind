import { prisma } from "@/lib/prisma";
import MapsViewClient from "./MapsViewClient";

export const dynamic = 'force-dynamic'; // Prevent prerendering at build time

export default async function MapsPage() {
  const churches = await prisma.church.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      description: true,
      type: true,
      imageUrl: true,
      events: {
        where: { isPublic: true },
        orderBy: { eventDate: 'asc' }
      }
    },
  });

  return <MapsViewClient initialChurches={churches} />;
}
