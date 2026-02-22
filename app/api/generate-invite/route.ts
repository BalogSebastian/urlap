import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";

const ALLOWED_FORM_TYPES = ["fire", "vbf", "haccp"] as const;
type FormType = (typeof ALLOWED_FORM_TYPES)[number];

const INVITE_SECRET = process.env.INVITE_SECRET || "dev-invite-secret-change-me";
const FROM_ADDRESS =
  `Sebastian <${process.env.EMAIL_USER || "sebimbalog@gmail.com"}>`;

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

export async function POST(req: Request) {
  try {
    const secret = INVITE_SECRET;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Érvénytelen kérés." }, { status: 400 });
    }

    const email = (body.email as string || "").trim();
    const formType = body.formType as FormType;
    const durationMinutes = Number(body.durationMinutes) || 60;

    if (!email) {
      return NextResponse.json({ error: "E-mail cím megadása kötelező." }, { status: 400 });
    }

    if (!ALLOWED_FORM_TYPES.includes(formType)) {
      return NextResponse.json({ error: "Érvénytelen szekció típus." }, { status: 400 });
    }

    const safeDurationMinutes = Math.max(1, durationMinutes);
    const expiresAt = Date.now() + safeDurationMinutes * 60_000;

    const payload = {
      formType,
      exp: expiresAt,
    };

    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payloadB64)
      .digest("base64url");

    const token = `${payloadB64}.${signature}`;

    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const url = `${origin.replace(/\/+$/, "")}/invite/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: "Ideiglenes adatlap kitöltési link",
      html: `
        <div style="font-family: Arial, sans-serif; color: #000000; font-size: 14px; line-height: 1.6;">
          <p style="margin-bottom: 16px;">
            Kedves Partnerünk!
          </p>
          <p style="margin-bottom: 16px;">
            Az alábbi linkre kattintva eléri az ideiglenes adatlapot:
          </p>
          <p style="margin-bottom: 16px;">
            <a href="${url}" style="color: #4f46e5; font-weight: bold;">Adatlap megnyitása</a>
          </p>
          <p style="margin-bottom: 16px; font-size: 12px; color: #4b5563;">
            A link csak korlátozott ideig érvényes, ezt követően automatikusan lejár.
          </p>
          <p>
            Üdvözlettel,<br />
            Trident Shield Group Kft.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      url,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Meghívó generálási hiba:", error);
    return NextResponse.json(
      { error: "Hiba történt a meghívó generálása során." },
      { status: 500 },
    );
  }
}
