import { NextRequest, NextResponse } from "next/server";
import { searchGifs } from "@/lib/providers/multi";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request);
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const pos = searchParams.get("pos") || undefined;
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  const data = await searchGifs(q, limit, pos);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
