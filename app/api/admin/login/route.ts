import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import { verifyPassword } from "@/lib/adminAuth";

export async function POST(req: Request) {
  await dbConnect();

  const body = (await req.json().catch(() => null)) as { password?: string } | null;

  if (!body || !body.password) {
    return NextResponse.json({ error: "A jelszó megadása kötelező." }, { status: 400 });
  }

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

  const adminUser = await AdminUser.findOne({ email: adminEmail });

  if (!adminUser || !verifyPassword(body.password, adminUser.passwordHash)) {
    return NextResponse.json({ error: "Hibás jelszó." }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
