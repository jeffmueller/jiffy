import { NextResponse } from "next/server";
import { getCachedTrending } from "@/lib/providers/multi";

export async function GET() {
  const data = await getCachedTrending();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
