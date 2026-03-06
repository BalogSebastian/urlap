import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";

const ALLOWED_FORM_TYPES = ["fire", "vbf", "haccp"] as const;
type FormType = (typeof ALLOWED_FORM_TYPES)[number];

const INVITE_SECRET = process.env.INVITE_SECRET || "dev-invite-secret-change-me";
const FROM_ADDRESS =
  `Munkavédelmiszaki <${process.env.EMAIL_USER || "sebimbalog@gmail.com"}>`;

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
    const mode = (body.mode as string || "").trim();
    const customSubjectRaw = (body.emailSubject as string | undefined) || "";
    const customMessageRaw = (body.emailMessage as string | undefined) || "";

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

    const base = origin.replace(/\/+$/, "");
    const url = mode === "files" ? `${base}/danger/${token}` : `${base}/invite/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const isFilesMode = mode === "files";
    const subjectDefault = isFilesMode ? "Csatolmány beküldési link" : "Ideiglenes adatlap kitöltési link";
    const subject = customSubjectRaw.trim() ? customSubjectRaw.trim().slice(0, 140) : subjectDefault;
    const safeMessage = customMessageRaw.trim()
      ? escapeHtml(customMessageRaw.trim()).replaceAll("\n", "<br />")
      : "";

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; font-size: 14px; line-height: 1.7;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
            <div style="padding: 22px 22px 18px; background: ${isFilesMode ? "#fff7ed" : "#eef2ff"}; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: 800; font-size: 16px; letter-spacing: .08em; color: ${isFilesMode ? "#9a3412" : "#3730a3"};">
                ${isFilesMode ? "CSATOLMÁNY BEKÜLDÉS" : "ADATLAP KITÖLTÉS"}
              </div>
              <div style="margin-top: 6px; font-weight: 800; font-size: 22px; color: #0f172a;">
                ${isFilesMode ? "Fájlfeltöltési link" : "Ideiglenes kitöltési link"}
              </div>
            </div>

            <div style="padding: 22px;">
              <p style="margin: 0 0 14px;">Kedves Partnerünk!</p>
              ${
                safeMessage
                  ? `<div style="margin: 0 0 14px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; color: #334155;">
                       ${safeMessage}
                     </div>`
                  : ""
              }
              <p style="margin: 0 0 14px;">
                ${
                  isFilesMode
                    ? "Az alábbi gombra kattintva megnyílik a fájlfeltöltési oldal (cégnév, e-mail és csatolt fájlok)."
                    : "Az alábbi gombra kattintva eléri az ideiglenes adatlapot:"
                }
              </p>
              <p style="margin: 0 0 16px;">
                <a href="${url}" style="display: inline-block; background: ${isFilesMode ? "#f59e0b" : "#4f46e5"}; color: #ffffff; padding: 10px 16px; border-radius: 999px; text-decoration: none; font-weight: 800;">
                  Megnyitás
                </a>
              </p>
              <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                A link csak korlátozott ideig érvényes, ezt követően automatikusan lejár.
              </div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
                Ha a gomb nem működik, másolja be ezt a linket a böngészőbe:<br />
                <span style="word-break: break-all; color: #475569;">${url}</span>
              </div>
              <div style="margin-top: 18px; color: #334155;">
                Üdvözlettel,<br />
                Trident Shield Group Kft.
              </div>
            </div>
          </div>
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
