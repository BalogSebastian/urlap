// /app/api/stats/route.ts
import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allSubmissions = await Submission.find({});

    // Összesített statisztikák
    const stats = {
      total: allSubmissions.length,
      fireCount: allSubmissions.filter(s => s.formType === 'fire').length,
      vbsCount: allSubmissions.filter(s => s.formType === 'vbs').length,
      
      // E havi statisztikák
      thisMonth: {
        total: allSubmissions.filter(s => new Date(s.createdAt) >= firstDayOfMonth).length,
        fire: allSubmissions.filter(s => s.formType === 'fire' && new Date(s.createdAt) >= firstDayOfMonth).length,
        vbs: allSubmissions.filter(s => s.formType === 'vbs' && new Date(s.createdAt) >= firstDayOfMonth).length,
      },

      // Legutóbbi 5 tevékenység
      recentActivity: allSubmissions
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5)
  .map(s => ({
    id: s._id,
    company: s.companyName,
    type: s.formType,
    date: s.createdAt
  }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Hiba a statisztika lekérésekor" }, { status: 500 });
  }
}