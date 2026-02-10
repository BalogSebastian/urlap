// /app/api/submissions/route.ts
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";

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

    return NextResponse.json({ success: true, data: submission }, { status: 201 });
  } catch (error) {
    console.error("Mentési hiba:", error);
    return NextResponse.json({ error: "Hiba a mentés során" }, { status: 400 });
  }
}