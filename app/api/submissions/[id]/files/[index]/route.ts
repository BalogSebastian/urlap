import dbConnect from "@/lib/mongodb";
import Submission from "@/models/Submission";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  await dbConnect();
  try {
    const { id, index } = await params;
    const idx = Number(index);
    if (!id || Number.isNaN(idx) || idx < 0) {
      return new Response(JSON.stringify({ error: "Érvénytelen paraméter" }), { status: 400 });
    }

    const sub = await Submission.findById(id);
    if (!sub) {
      return new Response(JSON.stringify({ error: "Adat nem található" }), { status: 404 });
    }

    const files = (sub as any).uploadedFiles as Array<{ fileName: string; fileType: string; fileContent: Buffer }> | undefined;
    if (!files || idx >= files.length) {
      return new Response(JSON.stringify({ error: "Fájl nem található" }), { status: 404 });
    }

    const f = files[idx];
    const headers = new Headers();
    headers.set("Content-Type", f.fileType || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(f.fileName)}"`);
    // Convert Buffer to a Blob-like stream via ArrayBuffer
    const buf = Buffer.from(f.fileContent as any);
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    return new Response(arrayBuf as any, { headers });
  } catch (error) {
    console.error("Fájl letöltési hiba:", error);
    return new Response(JSON.stringify({ error: "Hiba a letöltés során" }), { status: 500 });
  }
}
