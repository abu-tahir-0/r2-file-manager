import { NextRequest, NextResponse } from "next/server";
import { deleteFiles } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keys, bucket } = body;

    if (!bucket || typeof bucket !== "string") {
      return NextResponse.json(
        { error: "bucket is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: "keys must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    // Validate all keys are strings
    if (!keys.every((k: unknown) => typeof k === "string" && k.length > 0)) {
      return NextResponse.json(
        { error: "All keys must be non-empty strings" },
        { status: 400 }
      );
    }

    await deleteFiles(bucket, keys);

    return NextResponse.json({ deleted: keys.length });
  } catch (error) {
    console.error("Error deleting files:", error);
    return NextResponse.json(
      { error: "Failed to delete files" },
      { status: 500 }
    );
  }
}
