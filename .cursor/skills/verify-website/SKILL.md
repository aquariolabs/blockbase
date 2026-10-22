---
name: verify-website
description: "Drive the blockbase Astro website in a browser and over HTTP to prove the homepage, missing page, server error page, document metadata, and crawl files. Use when a change can affect what a visitor sees in apps/website."
---

# Verify the blockbase website

The visitor-facing surface is the Astro app in `apps/website`. This skill launches an isolated instance and drives it with `verify-website`. Two other surfaces exist and are out of scope here: the React Email preview (`vp run emails#dev`, `http://localhost:3000`) and the `@workspace/notifications` library, which has no user interface.

The documented day-to-day command `vp run website#dev` publishes one shared portless host, `https://website.blockbase.localhost`. Verification does not use that host. A second run would attach to the same proxy and the same session. Launch the Astro process directly, on `127.0.0.1` and a port this run selected.

There is no database and no login. Instances are isolated by port and `VERIFY_WEBSITE_RUN_ID`. Preview mode reads the shared build in `apps/website/dist`; do not rebuild while a preview instance is running.

## Launch

From the repo root, with Node >= 26:

```bash
export VERIFY_WEBSITE_RUN_ID=missing-page-proof
.cursor/skills/verify-website/scripts/verify-website launch
```

`VERIFY_WEBSITE_RUN_ID` is required. Use lowercase letters, digits, and hyphens. Set `VERIFY_WEBSITE_PORT` only when you need a fixed port; if that port is taken, launch exits instead of attaching to the existing process.

Launch runs this from `apps/website`, with `VARLOCK_ENV=test`, `ASTRO_TELEMETRY_DISABLED=1`, and `POSTHOG_KEY` removed from the child environment:

```bash
varlock run -- astro dev --host 127.0.0.1 --port <port>
```

Ready means the log contains `astro  v7.3.8 ready in` and `GET /` returns a complete document: status 200, `<title>Blockbase</title>`, the text `Button from @workspace/ui`, a closing `</html>` tag, and `const apiKey = undefined`. A listening socket is not enough. On a cold dev start the first homepage response can be status 200 with an incomplete body and an `Invalid hook call` line in the server log, while Vite finishes optimizing dependencies. Launch keeps requesting `/` until the complete document arrives, or exits after 60 seconds and leaves the instance recorded so cleanup can stop it.

Crawl files are not served by this dev server. For those checks, build first, then launch preview:

```bash
.cursor/skills/verify-website/scripts/verify-website build
.cursor/skills/verify-website/scripts/verify-website launch --preview
```

`build` runs `varlock run -- astro build` with the same test environment and replaces `apps/website/dist`. Preview is ready when its log contains `Local    http://127.0.0.1:<port>/`, the homepage check above passes, and `/robots.txt` is the test crawl file (see `features/crawl-policy.md`). The preview log line `astro  v14.3.4 ready` is the `@astrojs/cloudflare` adapter version, not the Astro version. Dev mode is the one that prints Astro `v7.3.8`.

One-time browser install, from `apps/website`, if a browser command reports a missing executable:

```bash
pnpm exec playwright install chromium
```

Launch prints `url`, `pid`, `evidence`, and `scratch`. Drive only that URL.

## Doctor

Run this before driving, and again whenever the page looks wrong:

```bash
.cursor/skills/verify-website/scripts/verify-website doctor
```

Doctor is read-only. It exits 0 only when all of these are true:

- `ok: yes`
- `pid` is alive and its `VARLOCK_ENV` is `test`
- `POSTHOG_KEY` is unset on that process
- exactly one `127.0.0.1:<port>` listener exists, and that process is the launched pid or a descendant
- dev mode log contains `astro  v7.3.8 ready`; preview mode log contains the instance URL
- `homepage: complete` and `analyticsKey: unset`
- preview mode also serves the test `/robots.txt`

`mode` is `dev` or `preview`. Do not drive an instance doctor rejects, and do not drive a server this run did not start.

## Drive

Read `features/README.md`, then follow one feature file. Browser commands use headless Chromium and accessible names. HTTP commands fetch the launched origin. The helper reloads the stored path for each browser command, so `goto` and `click` are what move the page.

```bash
.cursor/skills/verify-website/scripts/verify-website browser goto / --feature home-open
.cursor/skills/verify-website/scripts/verify-website browser click --role button --name "Button from @workspace/ui" --feature home-click
.cursor/skills/verify-website/scripts/verify-website browser snapshot --aria --feature home-open --path home/home.aria.txt
.cursor/skills/verify-website/scripts/verify-website browser screenshot --feature home-open --path home/home.png
.cursor/skills/verify-website/scripts/verify-website browser head --feature meta-title --out page-metadata/home.head.txt
.cursor/skills/verify-website/scripts/verify-website http /robots.txt --feature crawl-robots --out crawl/robots.txt
```

`goto` prints `status`, `title`, and `url`. `click` prints `clicked`, `navigated`, and, when the click loads a new document, `status`. Names are exact accessible names. A count other than one fails the command.

Stable handles on the current pages:

- home button: role `button`, name `Button from @workspace/ui`
- missing page heading: `Esta pagina saiu do mapa.`
- server error heading: `Algo quebrou por aqui.`
- return link on both error pages: role `link`, name `Voltar para o inicio`
- paths: `/`, an unknown path such as `/verify-missing-page`, `/404`, `/500`

The dev toolbar can appear in a corner of dev screenshots. Do not click it. It is not part of the page.

## Evidence

Proof artifacts go under `.cursor/skills/verify-website/evidence/<VERIFY_WEBSITE_RUN_ID>/`. Relative `--path`, `--out`, and `--requests` values are resolved inside that directory. The helper rejects absolute paths and `..`.

Record the action and the resulting state. A screenshot of the last screen is not enough.

- Browser proof is an ARIA snapshot plus a full-page screenshot. The snapshot file starts with `feature`, `entry`, `url`, `status`, and `title`. The screenshot writes the same facts to `<image>.caption.txt`. The page identity has to be visible in the shot or named in that caption.
- `goto --requests` writes one requested URL per line. Use it to see what the page actually loaded.
- HTTP proof is the printed status and content type plus the raw body saved by `--out`. A sibling `.caption.txt` holds the feature id and entry. The body file stays raw.
- Mutation is limited to navigation. Confirm it with the next page's snapshot, not with the click output alone.
- Pass `--feature` with the sub-feature id from the feature file.

The dev server has no user data to seed. Do not invent a test-only route or call an internal setter. `POSTHOG_KEY` is unset on purpose: the inline script sets `apiKey` to `undefined` and must not request `posthog.com`. Confirm that from the request log. A production analytics key is a different setup and is not proved by this skill.

`build` and `launch --preview` are the production boundary for crawl files. `VARLOCK_ENV=test` makes `robots.txt` disallow all crawling. A production environment would allow it. Read the served file; do not treat the mode name as the proof. Dev mode returns the missing page for `/robots.txt` and `/sitemap-index.xml`. That result does not verify the crawl policy.

## Cleanup

```bash
.cursor/skills/verify-website/scripts/verify-website cleanup
```

Cleanup sends `SIGTERM`, then `SIGKILL`, to the process group of the pid recorded for this run id. It then deletes `/tmp/verify-website-<run-id>/`, including the server log. It does not delete the evidence directory, and it does not delete `apps/website/dist`. It does not kill by process name. If launch fails halfway, run cleanup before trying again so the recorded pid is not left behind.

Copy any server log lines you need into the evidence directory before cleanup.

## Helpers

The executable helper is `.cursor/skills/verify-website/scripts/verify-website`. Run it from the repo root. `verify-website help` prints the same commands.

| Command | Effect |
| --- | --- |
| `launch` | Start `astro dev` on a free port and wait until `/` is a complete homepage. |
| `launch --preview` | Start `astro preview` for a test build. Fails if `dist/client/robots.txt` is missing or is not the test crawl file. |
| `doctor` | Read-only health check described above. |
| `build` | `astro build` with `VARLOCK_ENV=test`. No run id required. |
| `cleanup` | Stop this run's process group and delete its scratch directory. |
| `http <path> --feature <id> [--out <file>]` | Fetch `<path>` from the launched origin. |
| `browser goto <path> --feature <id> [--requests <file>]` | Open `<path>` and record status, title, and URL. |
| `browser click --role <role> --name <name> --feature <id>` | Click the unique accessible element on the current path. |
| `browser snapshot --aria --feature <id> --path <file>` | Write the body ARIA snapshot, with a proof header. |
| `browser screenshot --feature <id> --path <file>` | Write a full-page PNG and a caption file. |
| `browser head --feature <id> [--out <file>]` | Print title, language, description, canonical, robots meta, Open Graph, icons, and JSON-LD. |
| `browser status` | Print the status stored by the last `goto` or navigating `click`. |
| `browser title` | Print the title stored by the last `goto` or `click`. |
