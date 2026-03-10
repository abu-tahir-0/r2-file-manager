import { NextRequest, NextResponse } from "next/server";
import { renameFile } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldKey, newKey, bucket } = body;

    if (
      !bucket ||
      !oldKey ||
      !newKey ||
      typeof bucket !== "string" ||
      typeof oldKey !== "string" ||
      typeof newKey !== "string"
    ) {
      return NextResponse.json(
        { error: "bucket, oldKey and newKey are required strings" },
        { status: 400 }
      );
    }

    await renameFile(bucket, oldKey, newKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error renaming file:", error);
    return NextResponse.json(
      { error: "Failed to rename file" },
      { status: 500 }
    );
  }
}
