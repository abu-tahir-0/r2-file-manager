import { NextResponse } from "next/server";
import { listBuckets } from "@/lib/r2";

export async function GET() {
  try {
    const buckets = await listBuckets();
    return NextResponse.json({ buckets });
  } catch (error) {
    console.error("Error listing buckets:", error);
    return NextResponse.json(
      { error: "Failed to list buckets" },
      { status: 500 }
    );
  }
}
