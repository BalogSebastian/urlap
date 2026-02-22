import FireSafetyForm from "@/app/components/FireSafetyForm";
import crypto from "crypto";

const ALLOWED_FORM_TYPES = ["fire", "vbf", "haccp"] as const;
type FormType = (typeof ALLOWED_FORM_TYPES)[number];

const INVITE_SECRET = process.env.INVITE_SECRET || "dev-invite-secret-change-me";

interface TokenPayload {
  formType: FormType;
  exp: number;
}

function verifyToken(rawToken: string): TokenPayload | null {
  const secret = INVITE_SECRET;

  const parts = rawToken.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(json) as TokenPayload;

    if (!ALLOWED_FORM_TYPES.includes(payload.formType)) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = verifyToken(token);

  if (!info) {
    return (
      <main className="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
            A link érvénytelen vagy lejárt
          </h1>
          <p className="text-sm text-slate-500">
            Kérjük, jelezze nekünk, hogy új meghívó linket küldhessünk.
          </p>
        </div>
      </main>
    );
  }

  const initialTab =
    info.formType === "fire" ? "fire" : info.formType === "vbf" ? "vbf" : "haccp";

  return (
    <main className="min-h-screen w-full bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <FireSafetyForm initialTab={initialTab} lockedTab hideGenerateTab />
    </main>
  );
}
