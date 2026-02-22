import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import { signToken } from "@/lib/adminAuth";

export async function POST(req: Request) {
  await dbConnect();

  const adminEmail =
    process.env.ADMIN_EMAIL ||
    process.env.SUBMISSION_NOTIFY_EMAIL ||
    process.env.EMAIL_USER;

  if (!adminEmail) {
    return NextResponse.json(
      { error: "Nincs beállított admin e-mail cím." },
      { status: 500 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    req.headers.get("origin") ||
    "http://localhost:3000";

  const expiresAt = Date.now() + 60 * 60 * 1000;

  const payload = {
    purpose: "password" as const,
    email: adminEmail,
    exp: expiresAt,
  };

  const token = signToken(payload);

  const url = `${origin.replace(/\/+$/, "")}/admin-password-reset/${token}`;

  const existing = await AdminUser.findOne({ email: adminEmail });
  const hasPassword = !!existing;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const fromAddress = `Trident Admin <${process.env.EMAIL_USER || adminEmail}>`;

  const subject = hasPassword
    ? "Trident Admin jelszó módosítása"
    : "Trident Admin jelszó beállítása";

  const actionText = hasPassword ? "új jelszót" : "jelszót";

  await transporter.sendMail({
    from: fromAddress,
    to: adminEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; font-size: 14px; line-height: 1.6;">
        <p style="margin-bottom: 12px;">
          A Trident admin felülethez ${actionText} tudsz megadni.
        </p>
        <p style="margin-bottom: 12px;">
          A beállításhoz kattints az alábbi gombra. A link egy órán keresztül érvényes.
        </p>
        <p style="margin-bottom: 16px;">
          <a href="${url}" style="background-color:#4f46e5;color:#ffffff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:bold;">
            Jelszó beállítása
          </a>
        </p>
        <p style="font-size: 12px; color: #6b7280;">
          Ha nem te kérted ezt az e-mailt, hagyd figyelmen kívül.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}

