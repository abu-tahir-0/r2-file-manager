import { NextRequest, NextResponse } from "next/server";
import { getPrefixStats, getMultiplePrefixStats } from "@/lib/r2";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get("bucket") || "";
    const prefix = searchParams.get("prefix") || "";
    const prefixes = searchParams.get("prefixes"); // comma-separated for batch

    if (!bucket) {
      return NextResponse.json(
        { error: "bucket parameter is required" },
        { status: 400 }
      );
    }

    if (prefixes) {
      const prefixList = prefixes.split(",").filter(Boolean);
      const stats = await getMultiplePrefixStats(bucket, prefixList);
      return NextResponse.json({ stats });
    }

    const stats = await getPrefixStats(bucket, prefix);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting stats:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
