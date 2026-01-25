import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const file = formData.get('file') as File;
    const companyName = formData.get('companyName') as string;

    if (!email || !file) {
      return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 });
    }

    // Fájl konvertálása Buffer-ré, hogy a nodemailer megegye
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // SMTP Beállítás (Gmail példa)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Levél küldése
    await transporter.sendMail({
      from: `"Tűzvédelmi Rendszer" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Tűzvédelmi Adatlap - ${companyName}`,
      text: `Tisztelt Partnerünk!\n\nCsatoltan küldjük a(z) ${companyName} részére készített tűzvédelmi adatlapot.\n\nÜdvözlettel,\nTűzvédelmi Rendszer`,
      attachments: [
        {
          filename: `tuzvedelem_${companyName.replace(/[^a-z0-9]/gi, '_')}.pdf`,
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