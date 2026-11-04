# Missing page

The missing page appears when a visitor opens an address the site does not have. It shows the eyebrow `Erro 404`, the heading `Esta pagina saiu do mapa.`, a short explanation that mentions Blockbase, and the link `Voltar para o inicio`. Choosing that link returns to the home page.

## Sub-features

- `missing-open` shows the not-found heading for an unknown address.
- `missing-route` shows the same page at `/404`.
- `missing-return` follows `Voltar para o inicio` back to the home button.
- `missing-quiet` loads the page without contacting PostHog.

## How to get to it (user POV)

- Open an address that is not a real page, such as `/verify-missing-page`.
- Open `/404`.

## Driving it with verify-website

Preconditions:

- `verify-website doctor` prints `ok: yes`, `mode: dev`, `homepage: complete`, and `analyticsKey: unset`.
- No route named `/verify-missing-page` exists.

- **Open an unknown address.** Run `verify-website browser goto /verify-missing-page --feature missing-open --requests missing-page/open.requests.log`. The command prints `status: 404`, `title: Pagina nao encontrada | Blockbase`, and `url: /verify-missing-page`.
- **Read the unknown-address page.** Run `verify-website browser snapshot --aria --feature missing-open --path missing-page/open.aria.txt`. The snapshot contains `paragraph: Erro 404`, `heading "Esta pagina saiu do mapa."`, and `link "Voltar para o inicio"`.
- **Capture the unknown-address page.** Run `verify-website browser screenshot --feature missing-open --path missing-page/open.png`. The image shows `Esta pagina saiu do mapa.` and the word `Blockbase`.
- **Return from the unknown address.** Run `verify-website browser click --role link --name "Voltar para o inicio" --feature missing-return`. The command prints `navigated: yes`, `status: 200`, `title: Blockbase`, and `url: /`.
- **Confirm home.** Run `verify-website browser snapshot --aria --feature missing-return --path missing-page/home.aria.txt` and `verify-website browser screenshot --feature missing-return --path missing-page/home.png`. The snapshot contains `button "Button from @workspace/ui"` and does not contain `Esta pagina saiu do mapa.`.
- **Open the /404 route.** Run `verify-website browser goto /404 --feature missing-route --requests missing-page/route.requests.log`. The command prints `status: 404`, `title: Pagina nao encontrada | Blockbase`, and `url: /404`.
- **Read the /404 route.** Run `verify-website browser snapshot --aria --feature missing-route --path missing-page/route.aria.txt`. The snapshot contains the same heading and the same return link.
- **Capture the /404 route.** Run `verify-website browser screenshot --feature missing-route --path missing-page/route.png`. The image shows `Esta pagina saiu do mapa.`.
- **Return from /404.** Run `verify-website browser click --role link --name "Voltar para o inicio" --feature missing-return`. The command prints `navigated: yes`, `status: 200`, `title: Blockbase`, and `url: /`.
- **Confirm home again.** Run `verify-website browser snapshot --aria --feature missing-return --path missing-page/home-from-route.aria.txt`. The snapshot contains `button "Button from @workspace/ui"`.
- **Check the network.** `missing-page/open.requests.log` and `missing-page/route.requests.log` do not contain `posthog.com`.

## Gotchas

- The heading's accessible name includes the final period: `Esta pagina saiu do mapa.`
- The link name is `Voltar para o inicio`, without an accent.
- `/404` and an unknown address are different entries. Proving one does not prove the other.
- On the dev server, `/robots.txt` and `/sitemap-index.xml` also render this page. That is not a crawl-policy result. Use the crawl policy recipe for those paths.
- The page meta robots tag still says `index, follow`. That tag is not the crawl policy.
