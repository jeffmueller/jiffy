# Contributing

Jiffy is a personal project that happens to be open source. It is maintained
in spare time, so issues and pull requests may sit for a while — that is not
disinterest, just bandwidth. Small, focused changes get merged fastest.

## Getting set up

```bash
npm install
cp .env.example .env.local   # add a Klipy and/or Giphy key
npm run dev
```

You need at least one provider key for search to return anything. Both
providers' free keys allow 100 calls/hour, which you will notice while
developing — the trending results are cached for five minutes partly for that
reason.

The Docker path is worth testing too if you touch anything about deployment:

```bash
cp .env.example .env
docker compose up -d --build
```

## Before you open a pull request

```bash
npm run lint        # must pass with no errors and no warnings
npx tsc --noEmit    # must pass
npm run build       # must succeed
```

CI runs all three, plus it builds the Docker image and asserts the container
starts and reports healthy with no API keys set. That last check matters: a
first run always happens before anyone has filled in `.env`.

## Things worth knowing

- **Keys are runtime-only.** Nothing is read at build time, which is what lets
  one image work for everyone. Please keep it that way — no `NEXT_PUBLIC_`
  provider keys, and no reading `process.env` during static generation.
- **`<img>` and `<video>` are deliberate.** `next/image` is not used, because
  animated GIFs gain nothing from the optimizer. `no-img-element` is off in
  the eslint config for this reason, and `next.config.ts` carries no `images`
  config.
- **The CSP in `next.config.ts` lists provider media hosts explicitly.** If you
  add a provider, add its media hostnames there or its GIFs will be blocked.
- **Adding a provider** means implementing `GifProvider` in `lib/providers/`
  and registering it in `lib/providers/multi.ts`. Everything else — result
  interleaving, cursor packing, ID-prefix routing for shared links — is
  handled generically. Do implement `getById`: without it, every shared link
  to that provider's GIFs 404s.
- **Rate limiting is in-memory and per-process.** That is a deliberate fit for
  a single self-hosted container, not an oversight. It is not correct for a
  multi-instance deployment.

## Style

Match the surrounding code: TypeScript, double quotes, two-space indent, named
exports. Comments should explain why something is the way it is, not restate
what the line does.

There are no automated tests yet. If you are changing logic in `lib/`, saying
in the PR how you verified it goes a long way.

## Provider terms

Jiffy ships plain-text attribution and bundles no provider logo assets. If a
change affects how results are attributed, please read the
[provider terms section](README.md#provider-terms-are-the-operators-responsibility)
first — the obligations belong to whoever operates an instance.
