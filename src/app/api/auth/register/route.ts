import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        isActive: true,
        emailConfirmed: true, // We auto-confirm for now since they are creating their own account
      }
    });

    // Send welcome email
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (smtpEmail && smtpPassword) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: smtpEmail, pass: smtpPassword },
        });

        await transporter.sendMail({
          from: `"Holyfind" <${smtpEmail}>`,
          to: email,
          subject: "🙏 Bienvenido a Holyfind - Cuenta creada con éxito",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: white; padding: 30px; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6366f1; margin: 0; font-size: 2rem;">Holyfind</h1>
                <p style="color: #94a3b8; margin-top: 5px;">Encuentra tu lugar de culto</p>
              </div>
              
              <h2 style="color: white; margin-bottom: 5px;">¡Bienvenido/a, ${name}!</h2>
              <p style="color: #94a3b8;">Tu cuenta como usuario ha sido creada exitosamente en Holyfind.</p>
              
              <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #818cf8; margin-top: 0;">📋 Tus datos de acceso</h3>
                <p style="margin: 8px 0;"><strong style="color: #94a3b8;">Email:</strong> <span style="color: white;">${email}</span></p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'https://holyfind.vercel.app'}/login" 
                   style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 1rem;">
                  🚀 Entrar al Sistema
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 0.85rem;">Ya puedes ingresar para descubrir, guardar y calificar las iglesias cerca tuyo.</p>
              
              <hr style="border-color: rgba(255,255,255,0.1); margin: 25px 0;" />
              <p style="color: #475569; font-size: 0.75rem; text-align: center;">
                Este correo fue enviado por el equipo de Holyfind. 
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Email send error (non-fatal):", emailError);
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Register user error:", error);
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 });
  }
}
