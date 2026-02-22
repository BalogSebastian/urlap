// /app/api/submissions/route.ts
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// GET: Összes adat lekérése
// Ezt hívja meg mindkét Admin oldal (a Tűzvédelmi és a VBF is).
// A szűrést (hogy melyik admin mit lát) a frontend végzi a 'formType' alapján.
export async function GET() {
  await dbConnect();
  try {
    const submissions = await Submission.find({}).sort({ createdAt: -1 });
    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Lekérdezési hiba:", error);
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

// POST: Új űrlap mentése
// A frontendről érkező JSON tartalmazza a 'formType'-ot ('fire' vagy 'vbf'),
// így a rendszer tudja, hogy mit ment el, és később hogyan kell megjeleníteni.
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();

    // Az adatbázisba mentés (Schema validációval)
    const submission = await Submission.create(body);

    // Értesítő email küldése (nem blokkolja a mentést, hiba esetén csak logolunk)
    try {
      const formType = (body.formType as string) || "fire";
      const companyName = (body.companyName as string) || "-";
      const siteAddress = (body.siteAddress as string) || "-";
      const managerEmail = (body.managerEmail as string) || "-";

      const origin =
        process.env.NEXT_PUBLIC_BASE_URL ||
        req.headers.get("origin") ||
        "http://localhost:3000";

      let adminPath = "/adminadmin";
      if (formType === "vbf") adminPath = "/adminvbf";
      else if (formType === "haccp") adminPath = "/adminhaccp";

      const adminUrl = `${origin.replace(/\/+$/, "")}${adminPath}`;

      const notifyTo =
        process.env.SUBMISSION_NOTIFY_EMAIL ||
        process.env.EMAIL_USER ||
        "sebimbalog@gmail.com";

      const fromAddress = `Trident Admin <${
        process.env.EMAIL_USER || "sebimbalog@gmail.com"
      }>`;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const formTypeLabel =
        formType === "vbf"
          ? "VBF adatlap"
          : formType === "haccp"
          ? "HACCP adatlap"
          : "Tűzvédelmi adatlap";

      await transporter.sendMail({
        from: fromAddress,
        to: notifyTo,
        subject: `Új ${formTypeLabel}: ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #0f172a; font-size: 14px; line-height: 1.6;">
            <p style="margin-bottom: 12px;">Új adatlap érkezett a rendszerben.</p>
            <p style="margin-bottom: 12px;">
              <strong>Típus:</strong> ${formTypeLabel}<br />
              <strong>Cég neve:</strong> ${companyName}<br />
              <strong>Telephely:</strong> ${siteAddress}<br />
              <strong>Kapcsolattartó e-mail:</strong> ${managerEmail}
            </p>
            <p style="margin-bottom: 12px;">
              Az adatlap részletesen az admin felületen tekinthető meg:
            </p>
            <p style="margin-bottom: 16px;">
              <a href="${adminUrl}" style="background-color:#4f46e5;color:#ffffff;padding:8px 16px;border-radius:999px;text-decoration:none;font-weight:bold;">
                Admin felület megnyitása
              </a>
            </p>
            <p style="font-size: 12px; color: #6b7280;">
              Ez az üzenet automatikusan generálódott a Trident Shield Group űrlaprendszeréből.
            </p>
          </div>
        `,
      });
    } catch (notifyError) {
      console.error("Értesítő email hiba:", notifyError);
    }

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error) {
    console.error("Mentési hiba:", error);
    return NextResponse.json({ error: "Hiba a mentés során" }, { status: 400 });
  }
}
