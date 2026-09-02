import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

export const dynamic = "force-dynamic";

// Rozszerzenie wyprowadzamy z ZWERYFIKOWANEGO typu MIME, a nie z nazwy pliku
// podanej przez klienta — nazwa jest dowolna i trafiała wprost do klucza w R2.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
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

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
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
    // Szczegóły zostają w logach serwera. Odsyłanie String(error) wprost do
    // klienta ujawniało komunikaty z AWS SDK (nazwa bucketa, region, powód
    // odmowy dostępu) każdemu, kto wywołał ten endpoint.
    console.error("[upload] R2 error:", error);
    return NextResponse.json(
      { success: false, error: "Nie udało się wgrać pliku. Spróbuj ponownie." },
      { status: 500 }
    );
  }
}
