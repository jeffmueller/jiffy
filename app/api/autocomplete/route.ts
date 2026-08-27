import { NextRequest, NextResponse } from "next/server";
import { getAutocomplete } from "@/lib/providers/multi";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request);
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const suggestions = await getAutocomplete(q);
  return NextResponse.json(
    { suggestions },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
