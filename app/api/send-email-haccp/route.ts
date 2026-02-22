import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
   try {
      const formData = await req.formData();

      const email = formData.get('email') as string;
      const file = formData.get('file') as File;
      const companyName = formData.get('companyName') as string;

      // HACCP specifikus adatok
      const haccpServices = formData.get('haccpServices') as string;
      const senderName = formData.get('senderName') as string; // "Jani", "Márk", "Sebastian"
      const salutationName = formData.get('salutationName') as string;

      if (!email || !file) {
         return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // SMTP Beállítás (Pontosan mint a VBF-nél)
      const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
         },
      });

      // --- LEVÉL DESIGN ---
      const greeting = salutationName ? `Kedves ${salutationName}!` : "Kedves Partnerünk!";

      // Aláírás logika
      const signature = "Trident Shield Group Kft.";

      const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #000000; font-size: 14px; line-height: 1.6;">
        <p style="margin-bottom: 20px;">${greeting}</p>
        
        <p>Küldöm az elvégzendő munkához az adatokat. Kérdés esetén keress bátran minket!</p>
        
        <p style="margin-top: 20px; margin-bottom: 30px;">
           Megrendelés: <strong>${haccpServices}</strong>
        </p>

        <p>Üdvözlettel,</p>
        
        <p style="font-size: 24px; margin: 10px 0;">🙌</p>
        
        <p style="font-weight: bold; margin: 0;">${senderName}</p>
        <p style="margin: 0; color: #555;">${signature}</p>
        <p style="margin: 0;"><a href="https://munkavedelmiszaki.hu" style="color: #10b981;">munkavedelmiszaki.hu</a></p>
      </div>
    `;

      await transporter.sendMail({
         from: `"${senderName}" <${process.env.EMAIL_USER}>`,
         to: email,
         // cc: "sebimbalog@gmail.com", // Ha kell fix CC, de a VBF-nél nincs hardcode-olva
         subject: `HACCP Megrendelés - ${companyName}`,
         html: htmlContent,
         attachments: [
            {
               filename: file.name, // "HACCP_Megrendelo.pdf"
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
