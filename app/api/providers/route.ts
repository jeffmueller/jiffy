import { NextResponse } from "next/server";

export async function GET() {
  const providers = [
    process.env.GIPHY_API_KEY && "Giphy",
    process.env.KLIPY_APP_KEY && "Klipy",
  ].filter(Boolean) as string[];

  return NextResponse.json({ providers }, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
