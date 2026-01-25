// /app/api/submissions/route.ts
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";

// GET: Összes adat lekérése (Admin oldalnak)
export async function GET() {
  await dbConnect();
  try {
    const submissions = await Submission.find({}).sort({ createdAt: -1 });
    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json({ error: "Hiba az adatok lekérésekor" }, { status: 500 });
  }
}

// POST: Új űrlap mentése (User oldal)
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const submission = await Submission.create(body);
    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Hiba a mentés során" }, { status: 400 });
  }
}