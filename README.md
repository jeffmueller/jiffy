# Jiffy

Find an animated GIF, copy it, send it to a friend. Jiffy searches Giphy and Klipy
at once and interleaves the results. No walled gardens, no friction.

## Run it with Docker

Jiffy is a single self-contained container — no database, no volumes, nothing to
persist. Good on a NAS, a Raspberry Pi, or any always-on box.

**Requirements:** Docker with Compose v2, and a **64-bit** OS (`uname -m` should
report `aarch64` or `x86_64`). Next.js does not ship native binaries for 32-bit
ARM, so 32-bit Raspberry Pi OS will not build.

```bash
git clone <this-repo> jiffy && cd jiffy
cp .env.example .env      # then add at least one API key (see below)
docker compose up -d --build
```

Jiffy is now on `http://<host>:3003`. Change the host port with `JIFFY_PORT` in
`.env`; the container always listens on 3000 internally.

```bash
docker compose logs -f     # follow logs
docker compose ps          # includes the container's health status
docker compose down        # stop
docker compose up -d --build   # update after a git pull
```

### API keys

Jiffy needs at least one provider key. It searches every provider that has a key
set, so one is enough to start.

| Variable         | Where to get it                                                  |
| ---------------- | ---------------------------------------------------------------- |
| `KLIPY_APP_KEY`  | [partner.klipy.com/api-keys](https://partner.klipy.com/api-keys) |
| `GIPHY_API_KEY`  | [developers.giphy.com](https://developers.giphy.com) — beta keys allow 100 calls/hour |

Keys are read at runtime, never baked into the image, so the same image works for
anyone. Starting with no keys is safe: the app comes up healthy and searches
simply return nothing until you add one and `docker compose up -d`.

Both providers' free keys are capped at **100 calls/hour**, which is the real
constraint on a shared instance — production access is a request form on each
provider's dashboard.

### Rate limiting

Jiffy rate-limits its own API so that anyone who can reach the port can't burn
through your provider quota. Defaults live in `.env`:

| Variable                | Default | Meaning                                                        |
| ----------------------- | ------- | -------------------------------------------------------------- |
| `RATE_LIMIT_PER_MINUTE` | `60`    | Requests/minute against search, autocomplete, trending, proxy. `0` disables. |
| `TRUST_PROXY_HEADERS`   | `false` | Whether to read the client IP from `X-Forwarded-For`.           |

Leave `TRUST_PROXY_HEADERS` off when the container is exposed directly — every
caller then shares one bucket, so the limit acts as a global cap. Turn it on
behind a reverse proxy that sets the header (the bundled nginx config does) to
get per-client limits instead. Trusting the header without a proxy in front
would let anyone spoof it and skip the limit entirely.

The app also sets its own CSP and security headers, so a bare `docker compose up`
is protected without needing nginx.

### Building for a different machine

The image builds on whatever architecture it runs on, so building on the target
device needs no configuration. Building on a Pi is slow, though — to
cross-build from a faster machine instead:

```bash
docker buildx build --platform linux/arm64 -t jiffy:local --load .
docker save jiffy:local | ssh pi@raspberrypi docker load
```

The build itself needs internet access (it downloads the Geist webfonts), but no
API keys.

### Putting it behind a reverse proxy

`deployment/conf/nginx.conf` is a ready-made nginx config — TLS, rate limiting,
and security headers — that proxies to `127.0.0.1:3003`, matching the default
port above. Point `server_name` and the certificate paths at your own domain.

## Development

```bash
npm install
cp .env.example .env.local   # add your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Editing `app/page.tsx` or
anything under `components/` hot-reloads.

```bash
npm run build   # production build (standalone output)
npm run lint
```

## Provider attribution

Both providers require their branding to be displayed by anything using their
API, and that obligation passes to you when you self-host:

- **GIPHY** requires apps to "conspicuously display 'Powered By GIPHY'
  attribution marks where the API is utilized," using their official logo marks.
- **KLIPY** requires their branding too, recommending the "Powered by KLIPY"
  logo and watermark, and "Search KLIPY" as the search placeholder.

Jiffy currently shows text attribution ("Powered by Giphy & Klipy" plus a
per-result source badge). If you run a public instance, review each provider's
current brand guidelines and use their official marks.

## License

MIT — see [LICENSE](LICENSE). Jiffy is not affiliated with GIPHY or KLIPY; you
bring your own API keys and accept their terms.

## Layout

| Path                | What's there                                                   |
| ------------------- | -------------------------------------------------------------- |
| `app/`              | Routes and API handlers (`/api/search`, `/api/trending`, …)     |
| `components/`       | UI                                                              |
| `lib/providers/`    | Giphy and Klipy clients plus the interleaving/multiplexing logic |
| `deployment/`       | Scripts for the non-Docker systemd + nginx deploy to a Pi        |
