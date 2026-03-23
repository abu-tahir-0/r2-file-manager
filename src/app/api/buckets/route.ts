import { NextResponse } from "next/server";
import { listBuckets } from "@/lib/r2";

export async function GET() {
  try {
    const buckets = await listBuckets();
    const accountId = process.env.R2_ACCOUNT_ID;
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || "";
    const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    return NextResponse.json({ buckets, r2Endpoint, publicDomain });
  } catch (error) {
    console.error("Error listing buckets:", error);
    return NextResponse.json(
      { error: "Failed to list buckets" },
      { status: 500 }
    );
  }
}
