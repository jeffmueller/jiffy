# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](https://github.com/jeffmueller/jiffy/security/advisories/new)
rather than opening a public issue.

Jiffy is maintained in spare time, so please don't expect a same-day reply.
There is no bug bounty.

## Supported versions

The latest commit on `main` is the only supported version. Jiffy is
distributed as source you build yourself, so "upgrading" means pulling and
rebuilding.

## Scope

Jiffy is self-hosted software. Each operator runs their own instance with
their own provider API keys, which shapes what is and isn't a vulnerability
here.

**In scope** — anything in this repository that puts an operator at risk:

- Bypassing the host allowlist on `/api/proxy-image` (SSRF), or getting it to
  relay non-media content, follow redirects off the allowlist, or return an
  unbounded response.
- Bypassing the rate limiting in `lib/rate-limit.ts` in a way that lets an
  unauthenticated caller exhaust an operator's provider quota.
- XSS, or anything that defeats the Content-Security-Policy in
  `next.config.ts`.
- Anything causing a provider API key to reach the browser, appear in a build
  artifact, or get baked into the Docker image. Keys are runtime-only by
  design.
- Container issues: privilege escalation out of the non-root `node` user, or
  secrets persisted into image layers.

**Out of scope** — decisions rather than defects:

- An instance exposed to the internet without a reverse proxy, TLS, or
  authentication. Jiffy has no concept of users or logins; it assumes the
  operator controls who can reach it.
- `TRUST_PROXY_HEADERS=true` allowing spoofed `X-Forwarded-For`. That setting
  exists precisely because the header is only trustworthy behind a proxy that
  sets it, and it defaults to `false`.
- `RATE_LIMIT_PER_MINUTE=0`, which disables rate limiting deliberately.
- Rate limiting being per-process and resetting on restart. It is in-memory by
  design for a single-container deployment.
- Vulnerabilities in GIPHY's or KLIPY's own APIs or CDNs — please report those
  to them.

## For operators

If you run an instance others can reach:

- Put it behind a reverse proxy with TLS. `deployment/conf/nginx.conf` is a
  worked example with rate limiting and security headers.
- Set `TRUST_PROXY_HEADERS=true` only once that proxy is actually setting
  `X-Forwarded-For`, so limits apply per client rather than globally.
- Keep `.env` out of version control. It is gitignored here, and the Docker
  image never contains it.
