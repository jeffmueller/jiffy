import { NextRequest, NextResponse } from "next/server";
import { getCachedTrending } from "@/lib/providers/multi";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request);
  if (limited) return limited;

  const data = await getCachedTrending();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
