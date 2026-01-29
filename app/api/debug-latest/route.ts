import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";

export async function GET() {
   await dbConnect();
   try {
      const submissions = await Submission.find({}).sort({ createdAt: -1 }).limit(5);
      return NextResponse.json(submissions);
   } catch (error) {
      return NextResponse.json({ error: "Error" }, { status: 500 });
   }
}
