# Crawl policy

A non-production build tells crawlers to skip the site and points them at the sitemap. `/robots.txt` disallows every URL for every user agent, names the sitemap, and sets `Content-Signal: ai-train=no, search=yes, ai-input=no`. `/sitemap-index.xml` points at `/sitemap-0.xml`, which lists the home page on `https://blockbase.aquariolabs.com/`.

## Sub-features

- `crawl-robots` serves the test `robots.txt`.
- `crawl-sitemap` serves the sitemap index and the home URL entry.
- `crawl-dev-gap` reports that the dev server does not serve these files.

## How to get to it (user POV)

- Request `/robots.txt` on a preview of a test build.
- Request `/sitemap-index.xml` on that preview.
- Request `/sitemap-0.xml` on that preview.

## Driving it with verify-website

Preconditions:

- `verify-website build` exits 0 and prints `robots: apps/website/dist/client/robots.txt`.
- That file's text is the block in the robots step below, including the final newline.
- `verify-website launch --preview` prints `ok: yes` and `mode: preview`.
- `verify-website doctor` prints `ok: yes`, `mode: preview`, and `homepage: complete`.
- A dev-mode instance does not satisfy these preconditions.

- **Read robots.txt.** Run `verify-website http /robots.txt --feature crawl-robots --out crawl/robots.txt`. The command prints `status: 200` and a `content-type` starting with `text/plain`. The saved body is exactly:

```text
User-agent: *
Disallow: /
Sitemap: https://blockbase.aquariolabs.com/sitemap-index.xml
Content-Signal: ai-train=no, search=yes, ai-input=no
```

- **Read the sitemap index.** Run `verify-website http /sitemap-index.xml --feature crawl-sitemap --out crawl/sitemap-index.xml`. The command prints `status: 200`. The body contains `https://blockbase.aquariolabs.com/sitemap-0.xml`.
- **Read the sitemap entry.** Run `verify-website http /sitemap-0.xml --feature crawl-sitemap --out crawl/sitemap-0.xml`. The command prints `status: 200`. The body contains `<loc>https://blockbase.aquariolabs.com/</loc>`.
- **Dev server gap.** On a dev instance, `verify-website http /robots.txt --feature crawl-dev-gap --out crawl/dev-robots.html` prints `status: 404` and the missing page. Stop there and report the unmet preview precondition. Do not mark `crawl-robots` or `crawl-sitemap` verified.

## Gotchas

- `verify-website build` replaces `apps/website/dist`. Cleanup does not restore it.
- Do not rebuild while a preview instance is running. Preview reads that directory.
- `VARLOCK_ENV=test` is what produces `Disallow: /`. A production build allows crawling. The served body is the proof, not the command name.
- The dev server returns the missing page for `/robots.txt`, `/sitemap-index.xml`, and `/sitemap-0.xml`. That 404 is `crawl-dev-gap`, not a passing crawl policy.
- The preview ready line `astro  v14.3.4 ready` is the Cloudflare adapter version. Dev mode prints Astro `v7.3.8`.
