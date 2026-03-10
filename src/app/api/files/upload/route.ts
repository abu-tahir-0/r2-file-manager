import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;
    const bucket = formData.get("bucket") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!bucket) {
      return NextResponse.json({ error: "bucket is required" }, { status: 400 });
    }

    // Normalize path: strip trailing slashes, avoid double slashes
    const cleanPath = path?.replace(/\/+$/, "");
    const key = cleanPath ? `${cleanPath}/${file.name}` : file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadFile(bucket, key, buffer, file.type);

    return NextResponse.json({ key, size: file.size });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
