import { NextRequest, NextResponse } from "next/server";
import { listFiles } from "@/lib/r2";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get("bucket") || "";
    const prefix = searchParams.get("prefix") || "";
    const continuationToken = searchParams.get("continuationToken") || "";

    if (!bucket) {
      return NextResponse.json(
        { error: "bucket parameter is required" },
        { status: 400 }
      );
    }

    const result = await listFiles(bucket, prefix || undefined, continuationToken || undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
