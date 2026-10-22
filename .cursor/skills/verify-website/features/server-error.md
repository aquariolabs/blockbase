# Server error page

The server error page is what visitors get at `/500`. It shows the eyebrow `Erro 500`, the heading `Algo quebrou por aqui.`, a short explanation, and the link `Voltar para o inicio`. Choosing that link returns to the home page. The response status is 500.

## Sub-features

- `error-open` shows the error heading at `/500` with status 500.
- `error-return` follows `Voltar para o inicio` back to the home button.

## How to get to it (user POV)

- Open `/500`.

## Driving it with verify-website

Preconditions:

- `verify-website doctor` prints `ok: yes`, `mode: dev`, `homepage: complete`, and `analyticsKey: unset`.

- **Open the error page.** Run `verify-website browser goto /500 --feature error-open --requests server-error/open.requests.log`. The command prints `status: 500`, `title: Erro interno | Blockbase`, and `url: /500`.
- **Read the page.** Run `verify-website browser snapshot --aria --feature error-open --path server-error/open.aria.txt`. The snapshot contains `paragraph: Erro 500`, `heading "Algo quebrou por aqui."`, and `link "Voltar para o inicio"`.
- **Capture the screen.** Run `verify-website browser screenshot --feature error-open --path server-error/open.png`. The image shows `Algo quebrou por aqui.` and the word `Blockbase`.
- **Return home.** Run `verify-website browser click --role link --name "Voltar para o inicio" --feature error-return`. The command prints `navigated: yes`, `status: 200`, `title: Blockbase`, and `url: /`.
- **Confirm home.** Run `verify-website browser snapshot --aria --feature error-return --path server-error/home.aria.txt` and `verify-website browser screenshot --feature error-return --path server-error/home.png`. The snapshot contains `button "Button from @workspace/ui"` and does not contain `Algo quebrou por aqui.`.
- **Check the network.** `server-error/open.requests.log` does not contain `posthog.com`.

## Gotchas

- The heading's accessible name includes the final period: `Algo quebrou por aqui.`
- `/500` is the visitor entry for this template. A crashed dev render can show the Vite error overlay instead. Do not treat that overlay as this page.
- Status 500 with a different title means this recipe failed. The title is `Erro interno | Blockbase`.
- The return link is the same name as on the missing page. Prove it from `/500`, not from `/404`.
