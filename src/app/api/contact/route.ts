import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, address, message } = await req.json();

    if (!name || !address || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpEmail || !smtpPassword) {
      console.error("SMTP env vars not configured");
      return NextResponse.json({ error: "SMTP not configured" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: `"Holyfind" <${smtpEmail}>`,
      to: smtpEmail,
      subject: `🙏 Nueva Solicitud de Iglesia: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: white; padding: 30px; border-radius: 12px;">
          <h2 style="color: #6366f1;">Nueva solicitud de ingreso a Holyfind</h2>
          <hr style="border-color: rgba(255,255,255,0.1);" />
          <p><strong style="color: #94a3b8;">Nombre de la Iglesia:</strong><br/>${name}</p>
          <p><strong style="color: #94a3b8;">Dirección:</strong><br/>${address}</p>
          <p><strong style="color: #94a3b8;">Mensaje:</strong><br/>${message}</p>
          <hr style="border-color: rgba(255,255,255,0.1);" />
          <p style="color: #64748b; font-size: 12px;">Enviado desde el formulario de Holyfind</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error sending email:", error?.message || error);
    return NextResponse.json({ error: "Error sending email" }, { status: 500 });
  }
}
