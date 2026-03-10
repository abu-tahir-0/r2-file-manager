import { NextRequest, NextResponse } from "next/server";
import { getFileContent } from "@/lib/r2";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");
    const bucket = searchParams.get("bucket");

    if (!key) {
      return NextResponse.json(
        { error: "key parameter is required" },
        { status: 400 }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        { error: "bucket parameter is required" },
        { status: 400 }
      );
    }

    const { body, contentType } = await getFileContent(bucket, key);

    const filename = key.split("/").pop() || "download";
    // RFC 5987 encoding for Content-Disposition to handle special characters safely
    const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape);

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename.replace(/["\\]/g, "_")}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
