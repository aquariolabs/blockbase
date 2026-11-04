# Page metadata

Each page identifies itself in the document head: a title, a description, a canonical URL on `https://blockbase.aquariolabs.com`, Open Graph tags, two favicons, and JSON-LD for a WebSite and a WebPage. The social image tag points at `/assets/icons/study-icon-atlas.png`, and that file is not published, so the request returns the missing page.

## Sub-features

- `meta-home` records the home title, description, canonical URL, and social tags.
- `meta-missing` records the templated title and description of an unknown address.
- `meta-error` records the templated title and description of `/500`.
- `meta-icons` fetches both favicons.
- `meta-schema` records JSON-LD that names the page.
- `meta-og-missing` shows that the social image URL returns the missing page.

## How to get to it (user POV)

- Open `/` and view the document head, tab title, and favicon.
- Open an unknown address and view the tab title.
- Open `/500` and view the tab title.
- Request `/favicon.svg` and `/favicon.ico`.
- Request `/assets/icons/study-icon-atlas.png`.

## Driving it with verify-website

Preconditions:

- `verify-website doctor` prints `ok: yes`, `mode: dev`, `homepage: complete`, and `analyticsKey: unset`.
- The instance URL printed by launch is the origin used below as `<origin>`.

- **Read the home head.** Run `verify-website browser goto / --feature meta-home` and `verify-website browser head --feature meta-home --out page-metadata/home.head.txt`. The output contains `title: Blockbase`, `lang: pt-BR`, `description: Um ponto de partida simples.`, `canonical: https://blockbase.aquariolabs.com/`, `robots: index, follow`, `og:title: Blockbase`, `og:type: website`, `og:image: /assets/icons/study-icon-atlas.png`, and `og:url: <origin>/`.
- **Read home JSON-LD.** The same head output contains `jsonld:` with `"@type":"WebSite"`, `"@type":"WebPage"`, and `"name":"Blockbase"`.
- **Read an unknown address.** Run `verify-website browser goto /verify-missing-page --feature meta-missing` and `verify-website browser head --feature meta-missing --out page-metadata/missing.head.txt`. The output contains `title: Pagina nao encontrada | Blockbase`, `description: A pagina que voce tentou acessar nao existe ou foi movida.`, `canonical: https://blockbase.aquariolabs.com/verify-missing-page`, and `og:title: Pagina nao encontrada`. The `jsonld` name is `Pagina nao encontrada`, not the templated document title.
- **Read the error page.** Run `verify-website browser goto /500 --feature meta-error` and `verify-website browser head --feature meta-error --out page-metadata/error.head.txt`. The output contains `title: Erro interno | Blockbase`, `description: Algo inesperado aconteceu ao carregar esta pagina.`, `canonical: https://blockbase.aquariolabs.com/500`, and `og:title: Erro interno`.
- **Fetch the icons.** Run `verify-website http /favicon.svg --feature meta-icons --out page-metadata/favicon.svg` and `verify-website http /favicon.ico --feature meta-icons --out page-metadata/favicon.ico`. The SVG command prints `status: 200` and `content-type: image/svg+xml`. The ICO command prints `status: 200` and `content-type: image/x-icon`.
- **Fetch the social image.** Run `verify-website http /assets/icons/study-icon-atlas.png --feature meta-og-missing --out page-metadata/og-image.html`. The command prints `status: 404`. The body contains `Pagina nao encontrada | Blockbase` and `Esta pagina saiu do mapa.`.

## Gotchas

- On the dev server, `og:url` uses the instance origin. Canonical URLs stay on `https://blockbase.aquariolabs.com`. A static preview uses the site URL for `og:url` as well. Compare `og:url` with the mode you launched.
- The social image meta tag is present and the image request is a 404. A passing run reports both. Do not drop the 404 to make the recipe pass.
- `meta name="robots"` says `index, follow` on these pages, including the missing page. Crawl policy is the `robots.txt` file, proved separately.
- Home has no visible site title in the body. The caption and head output carry `Blockbase`.
- Icon bodies are binary. Judge them by status, content type, and byte size, not by printed text.
