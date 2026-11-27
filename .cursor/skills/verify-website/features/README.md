# Website verification map

This directory is the maintained source for verifying the visitor-facing behavior of the blockbase website. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch the website with `verify-website launch` so it listens on `http://127.0.0.1:<port>` for a fresh `VERIFY_WEBSITE_RUN_ID`.
- Leave `POSTHOG_KEY` unset. Launch does this for the server process.
- The site has no accounts and no stored notes. A usable homepage is the baseline.
- Put `.cursor/skills/verify-website/scripts` on `PATH` or invoke `verify-website` by that script path from the repo root.
- Run `verify-website doctor` and require `ok: yes`, `mode: dev`, `homepage: complete`, and `analyticsKey: unset`.
- Never drive an instance that was not started by this verification run.
- Crawl policy is the exception: its preconditions require `verify-website build` and `verify-website launch --preview`.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names over CSS selectors or screen position.
- Treat every command as literal. Keep quoted names, paths, and flags unchanged.
- Run browser actions through `verify-website browser`.
- Run HTTP actions through `verify-website http`.
- Pass `--feature` with the sub-feature id on every proof command.
- Write proof files under the run evidence directory. Do not remove them during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot whose caption names the feature id, entry, URL, status, and title.
- HTTP proof includes the status, content type, and raw response body.
- Navigation proof includes the destination snapshot, not only the click output.
- Record the feature id and entry point on every artifact. The helper writes them into snapshot headers, screenshot captions, and HTTP captions.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the visitor-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify-website` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only visitor paths, stable handles, required state, commands, and observable proof.

## Features

- [Home page](./home.md) covers opening `/`, the shared button, and staying on the page after the button is pressed.
- [Missing page](./missing-page.md) covers an unknown address and `/404`, the not-found copy, and the link back home.
- [Server error page](./server-error.md) covers `/500`, the error copy, and the link back home.
- [Page metadata](./page-metadata.md) covers the document title, description, canonical URL, social tags, icons, JSON-LD, and the missing social image.
- [Crawl policy](./crawl-policy.md) covers `robots.txt` and the sitemap on a test preview.
