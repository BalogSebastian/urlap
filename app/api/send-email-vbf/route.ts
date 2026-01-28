// /app/api/send-email-vbf/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const email = formData.get('email') as string;
    const file = formData.get('file') as File;
    const companyName = formData.get('companyName') as string;

    // VBF specifikus adatok
    const vbfServices = formData.get('vbfServices') as string; // "Villamos Biztonsági..."
    const senderName = formData.get('senderName') as string; // "Jani" vagy "Márk"
    const salutationName = formData.get('salutationName') as string;

    if (!email || !file) {
      return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // --- VBF LEVÉL DESIGN (A KÉP ALAPJÁN) ---
    const greeting = salutationName ? `Kedves ${salutationName}!` : "Kedves Kolléga!";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #000000; font-size: 14px; line-height: 1.6;">
        <p style="margin-bottom: 20px;">${greeting}</p>
        
        <p>Küldöm az elvégzendő munkához az adatokat. Kérdés esetén keress bátran minket!</p>
        
        <p style="margin-top: 20px; margin-bottom: 30px;">
           Megrendelés: <strong>${vbfServices}</strong>
        </p>

        <p>Üdvözlettel,</p>
        
        <p style="font-size: 24px; margin: 10px 0;">🙌</p>
        
        <p style="font-weight: bold; margin: 0;">${senderName}</p>
        <p style="margin: 0; color: #555;">Trident Shield Group Kft.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"${senderName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `VBF Megrendelés - ${companyName}`,
      html: htmlContent,
      attachments: [
        {
          filename: file.name,
          content: buffer,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email hiba:', error);
    return NextResponse.json({ error: 'Hiba a küldés során' }, { status: 500 });
  }
}