import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";

const ALLOWED_HOSTS = [
  "media.giphy.com",
  "i.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
  "static.klipy.com",
];

// Only media — keeps the endpoint from relaying arbitrary documents that
// happen to be served from an allowed host.
const ALLOWED_CONTENT_TYPES = ["image/", "video/"];

const UPSTREAM_TIMEOUT_MS = 10_000;
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * Caps the body as it streams through, so an upstream with a missing or
 * dishonest Content-Length still can't force us to buffer without bound.
 */
function capped(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  let total = 0;
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        total += chunk.byteLength;
        if (total > MAX_BYTES) {
          controller.error(new Error("Upstream exceeded size cap"));
          return;
        }
        controller.enqueue(chunk);
      },
    })
  );
}

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request);
  if (limited) return limited;

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only https is allowed" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  let res: Response;
  try {
    res = await fetch(parsed, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      redirect: "error", // a redirect could land outside the allowlist
    });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 504 });
  }

  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") || "";
  if (!ALLOWED_CONTENT_TYPES.some((prefix) => contentType.startsWith(prefix))) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  const declaredLength = Number(res.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  return new NextResponse(capped(res.body), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
