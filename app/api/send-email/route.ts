// /app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Adatok kinyerése
    const email = formData.get('email') as string;
    const files = formData.getAll('files') as File[];

    // Adatlap adatai
    const companyName = formData.get('companyName') as string;
    const headquarters = formData.get('headquarters') as string;
    const siteAddress = formData.get('siteAddress') as string;
    const managerName = formData.get('managerName') as string;

    // Kiválasztott opciók
    const orderType = formData.get('orderType') as string;
    const senderName = formData.get('senderName') as string; // "Jani" vagy "Márk"

    const salutationName = formData.get('salutationName') as string;

    if (!email || !files || files.length === 0) {
      return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 });
    }

    // Fájlok konvertálása Buffer-ré és csatolmányokká alakítása
    const attachments = await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
            filename: file.name,
            content: buffer,
        };
    }));

    // SMTP Beállítás
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // --- LEVÉL HTML TARTALMA ---
    // Módosítva: Dinamikus megszólítás
    const greeting = salutationName ? `Kedves ${salutationName}!` : "Kedves Kolléga!";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #000000; font-size: 14px; line-height: 1.5;">
        <p style="margin-bottom: 20px;">${greeting}</p>
        
        <p style="margin-bottom: 25px;">A mellékletben csatolom az elvégzendő munkához az adatokat. Kérdés esetén keress bátran minket! 😉</p>
        
        <p style="font-weight: bold; margin-bottom: 5px;">Ügyfél adatai:</p>
        <div style="margin-left: 0px;">
            <p style="margin: 3px 0;">Cégnév: ${companyName}</p>
            <p style="margin: 3px 0;">Telephely: ${siteAddress}</p>
            <p style="margin: 3px 0;">Székhely: ${headquarters}</p>
            <p style="margin: 3px 0;">Ügyvezető: ${managerName}</p>
        </div>
        
        <p style="margin-top: 15px; margin-bottom: 25px;">
           <span style="font-weight: bold;">Megrendelés:</span> <i>${orderType}</i>
        </p>

        <p style="margin-bottom: 5px;">Köszönjük,</p>
        <p style="font-weight: bold; margin-top: 0;">${senderName}</p>
        
        <p style="margin-top: 20px;">
           Minden információt megtalálsz a pdf-ben. A képeket is csatolom.
        </p>
      </div>
    `;

    // Fájlok konvertálása Buffer-ré és csatolmányokká alakítása
    await transporter.sendMail({
      from: `"${senderName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Adatlap - ${companyName}`,
      html: htmlContent,
      attachments: attachments,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email hiba:', error);
    return NextResponse.json({ error: 'Hiba a küldés során' }, { status: 500 });
  }
}