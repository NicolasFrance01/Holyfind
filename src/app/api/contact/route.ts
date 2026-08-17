import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, address, message } = await req.json();

    if (!name || !address || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: process.env.SMTP_EMAIL, // Admin receives the request
      subject: `Nueva Solicitud de Ingreso: ${name}`,
      text: `
        Has recibido una nueva solicitud de iglesia para Holyfind:

        Nombre de la Iglesia: ${name}
        Dirección: ${address}
        
        Mensaje Adicional:
        ${message}
      `,
      html: `
        <h3>Nueva solicitud de ingreso a Holyfind</h3>
        <p><strong>Nombre de la Iglesia:</strong> ${name}</p>
        <p><strong>Dirección:</strong> ${address}</p>
        <p><strong>Mensaje Adicional:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Error sending email" }, { status: 500 });
  }
}
