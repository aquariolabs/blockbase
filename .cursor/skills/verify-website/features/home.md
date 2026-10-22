# Home page

The home page is the site visitors open at `/`. It shows the document title Blockbase and one button, `Button from @workspace/ui`. Pressing that button keeps the visitor on `/`.

## Sub-features

- `home-open` shows the shared button on `/`.
- `home-click` presses the button and stays on `/`.
- `home-quiet` loads the page without contacting PostHog.

## How to get to it (user POV)

- Open the site root, `/`.
- From the missing page or the server error page, choose `Voltar para o inicio`. Those returns are proved in those feature files.

## Driving it with verify-website

Preconditions:

- `verify-website doctor` prints `ok: yes`, `mode: dev`, `homepage: complete`, and `analyticsKey: unset`.
- The stored page can be anything. This recipe starts with `goto /`.

- **Open home.** Run `verify-website browser goto / --feature home-open --requests home/requests.log`. The command prints `status: 200`, `title: Blockbase`, and `url: /`.
- **Read the page.** Run `verify-website browser snapshot --aria --feature home-open --path home/home.aria.txt`. The snapshot contains `button "Button from @workspace/ui"` and no heading.
- **Capture the screen.** Run `verify-website browser screenshot --feature home-open --path home/home.png`. The image shows `Button from @workspace/ui`. The caption `home/home.png.caption.txt` records `title: Blockbase`.
- **Press the button.** Run `verify-website browser click --role button --name "Button from @workspace/ui" --feature home-click`. The command prints `navigated: no`, `title: Blockbase`, and `url: /`.
- **Confirm the same page.** Run `verify-website browser snapshot --aria --feature home-click --path home/after-click.aria.txt`. The snapshot still contains `button "Button from @workspace/ui"`.
- **Check the network.** Open `home/requests.log`. It contains the homepage URL and does not contain `posthog.com`.

## Gotchas

- A cold dev server can answer the first `GET /` with status 200 and an incomplete document that does not contain the button. Use the instance only after launch has printed `ok: yes`. A proof that lacks the button text is a failure.
- The server log can contain `Invalid hook call` from that warm-up request. Doctor judges the live homepage, not the absence of that line.
- The button has no destination. A new URL after the click means this recipe failed.
- Dev screenshots can show the Astro toolbar in a corner. Do not click it, and do not treat it as the page button.
- The request log also lists Vite dev modules. Those lines do not excuse a `posthog.com` request.
