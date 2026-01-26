// /app/api/submissions/[id]/route.ts
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";

// --- MÓDOSÍTÁS (PUT) ---
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Jelezzük, hogy ez egy Promise
) {
  await dbConnect();
  try {
    // Az új Next.js verziókban meg kell várni a params feloldását
    const { id } = await params; 
    const body = await req.json();

    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updatedSubmission) {
      return NextResponse.json({ error: "Adat nem található" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSubmission });
  } catch (error) {
    console.error("Módosítási hiba:", error);
    return NextResponse.json({ error: "Hiba a módosítás során" }, { status: 500 });
  }
}

// --- TÖRLÉS (DELETE) ---
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Itt is Promise-ként kezeljük
) {
  await dbConnect();
  try {
    // Itt is kötelező az await
    const { id } = await params;

    const deletedSubmission = await Submission.findByIdAndDelete(id);

    if (!deletedSubmission) {
      return NextResponse.json({ error: "Adat nem található" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Sikeresen törölve" });
  } catch (error) {
    console.error("Törlési hiba:", error);
    return NextResponse.json({ error: "Hiba a törlés során" }, { status: 500 });
  }
}