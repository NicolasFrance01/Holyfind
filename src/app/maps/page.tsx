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
    },
  });

  return <MapsViewClient initialChurches={churches} />;
}
