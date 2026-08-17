import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Limpiando iglesias existentes para evitar duplicados...");
  await prisma.church.deleteMany({});

  const iglesiasMuestra = [
    {
      name: 'Catedral de Córdoba',
      address: 'Independencia 80, Córdoba, Argentina',
      type: 'Católica',
      latitude: -31.4168,
      longitude: -64.1835,
      description: 'La Iglesia Matriz de la ciudad de Córdoba.',
    },
    {
      name: 'Iglesia de los Capuchinos',
      address: 'Buenos Aires 693, Córdoba, Argentina',
      type: 'Católica',
      latitude: -31.4243,
      longitude: -64.1866,
      description: 'Iglesia de estilo neogótico en el barrio Nueva Córdoba.',
    },
    {
      name: 'Hillsong Buenos Aires',
      address: 'Buenos Aires, Argentina',
      type: 'Cristiana Evangélica',
      latitude: -34.5828,
      longitude: -58.4326,
      description: 'Una iglesia contemporánea para todas las generaciones.',
    },
    {
      name: 'Iglesia del Salvador',
      address: 'Callao 542, Buenos Aires, Argentina',
      type: 'Católica',
      latitude: -34.6015,
      longitude: -58.3912,
      description: 'Impresionante templo en el corazón de Buenos Aires.',
    },
    {
      name: 'Rey de Reyes',
      address: 'Av. Olazábal 2500, Buenos Aires, Argentina',
      type: 'Cristiana Evangélica',
      latitude: -34.5615,
      longitude: -58.4611,
      description: 'Iglesia evangélica en Belgrano.',
    },
    {
      name: 'Catedral Metropolitana',
      address: 'San Martín 27, Buenos Aires, Argentina',
      type: 'Católica',
      latitude: -34.6075,
      longitude: -58.3731,
      description: 'El principal templo católico de Argentina.',
    },
    {
      name: 'Comunidad de Fe Rosario',
      address: 'Rosario, Santa Fe, Argentina',
      type: 'Cristiana Evangélica',
      latitude: -32.9468,
      longitude: -60.6393,
      description: 'Iglesia con gran impacto en la ciudad de Rosario.',
    },
    {
      name: 'Basílica de Luján',
      address: 'San Martín 51, Luján, Buenos Aires',
      type: 'Católica',
      latitude: -34.5645,
      longitude: -59.1177,
      description: 'Uno de los centros de peregrinación más importantes.',
    },
  ];

  console.log("Cargando iglesias de muestra...");
  for (const iglesia of iglesiasMuestra) {
    await prisma.church.create({
      data: iglesia,
    });
  }

  const total = await prisma.church.count();
  console.log(`✅ ¡Se cargaron ${total} iglesias de muestra correctamente!`);

  await pool.end();
}

main().catch(console.error);
