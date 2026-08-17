import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = 'master';
  const plainPassword = 'Ndf41847034@';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('El usuario ya existe, actualizando contraseña...');
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: 'SUPERADMIN', isActive: true },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'SUPERADMIN',
        isActive: true,
      },
    });
  }

  console.log(`✅ Usuario admin creado/actualizado:`);
  console.log(`   Email: ${email}`);
  console.log(`   Contraseña: ${plainPassword}`);
  console.log(`   Rol: SUPERADMIN`);

  await pool.end();
}

main().catch(console.error);
