import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Brak pliku" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Dozwolone tylko JPG, PNG, WEBP, GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Plik zbyt duży (max 10MB)" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const random = Math.random().toString(36).substring(2, 10);
    const fileName = `${session.user.id}/${Date.now()}-${random}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000",
      })
    );

    const url = `${R2_PUBLIC_URL}/${fileName}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("[upload] R2 error:", error);
    return NextResponse.json(
      { success: false, error: `Błąd uploadu: ${String(error)}` },
      { status: 500 }
    );
  }
}
