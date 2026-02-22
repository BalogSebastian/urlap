import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => {
        const [name, ...rest] = c.split("=");
        return [name, rest.join("=")];
      })
  );

  const token = cookies["admin_session"];

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifyToken<{ purpose: "session"; sub: "admin"; exp: number }>(token, "session");

  if (!payload || payload.sub !== "admin") {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}

