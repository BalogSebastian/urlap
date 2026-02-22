import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import { hashPassword, verifyToken } from "@/lib/adminAuth";

export async function POST(req: Request) {
  await dbConnect();

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null) as
      | { token?: string; password?: string; passwordConfirm?: string }
      | null;

    if (!body) {
      return NextResponse.json({ error: "Érvénytelen kérés." }, { status: 400 });
    }

    const { token, password, passwordConfirm } = body;
    return handlePasswordChange(token, password, passwordConfirm, false);
  }

  const formData = await req.formData();
  const token = formData.get("token") as string | null;
  const password = formData.get("password") as string | null;
  const passwordConfirm = formData.get("passwordConfirm") as string | null;

  return handlePasswordChange(token, password, passwordConfirm, true);
}

async function handlePasswordChange(
  token: string | null | undefined,
  password: string | null | undefined,
  passwordConfirm: string | null | undefined,
  redirectOnSuccess: boolean
) {
  if (!token) {
    if (redirectOnSuccess) {
      return NextResponse.redirect(new URL("/admin?resetError=missing_token", process.env.NEXT_PUBLIC_BASE_URL));
    }
    return NextResponse.json({ error: "Hiányzó token." }, { status: 400 });
  }

  if (!password || !passwordConfirm) {
    if (redirectOnSuccess) {
      return NextResponse.redirect(new URL("/admin?resetError=missing_password", process.env.NEXT_PUBLIC_BASE_URL));
    }
    return NextResponse.json({ error: "A jelszó megadása kötelező." }, { status: 400 });
  }

  if (password !== passwordConfirm) {
    if (redirectOnSuccess) {
      return NextResponse.redirect(new URL("/admin-password-reset/error?code=nomatch", process.env.NEXT_PUBLIC_BASE_URL));
    }
    return NextResponse.json({ error: "A két jelszó nem egyezik." }, { status: 400 });
  }

  if (password.length < 8) {
    if (redirectOnSuccess) {
      return NextResponse.redirect(new URL("/admin-password-reset/error?code=short", process.env.NEXT_PUBLIC_BASE_URL));
    }
    return NextResponse.json({ error: "A jelszónak legalább 8 karakter hosszúnak kell lennie." }, { status: 400 });
  }

  const payload = verifyToken<{ email: string; purpose: "password"; exp: number }>(token, "password");

  if (!payload) {
    if (redirectOnSuccess) {
      return NextResponse.redirect(new URL("/admin-password-reset/error?code=invalid", process.env.NEXT_PUBLIC_BASE_URL));
    }
    return NextResponse.json({ error: "A link érvénytelen vagy lejárt." }, { status: 400 });
  }

  const email = payload.email;

  const passwordHash = hashPassword(password);

  await AdminUser.findOneAndUpdate(
    { email },
    { $set: { email, passwordHash } },
    { upsert: true }
  );

  if (redirectOnSuccess) {
    return NextResponse.redirect(new URL("/admin?passwordSet=1", process.env.NEXT_PUBLIC_BASE_URL));
  }

  return NextResponse.json({ success: true });
}

