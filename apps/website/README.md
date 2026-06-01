# website

App Astro base do template `dia-zero`, preparado para deploy no Cloudflare.

## Stack atual

- Astro 6 com output estatico e adapter Cloudflare
- Cloudflare Workers/Assets via Wrangler
- Varlock para schema e injecao de variaveis de ambiente
- Tailwind CSS 4 e componentes React de `@workspace/ui`
- Sitemap com `@astrojs/sitemap`
- SEO com `astro-seo`
- JSON-LD com `astro-seo-schema`
- PostHog para analytics
- `evlog` para observabilidade no Vite/build

## Scripts

Execute os comandos a partir da raiz do monorepo:

```bash
vp run website#dev
vp run website#build
vp run website#test:e2e
vp run website#deploy:preview
vp run website#deploy:production
```

O servidor local usa `portless` e fica em
`https://website.dia-zero.localhost`. Em repos derivados, troque esse nome em
`package.json`, no campo `"portless"`. O script `dev:app` roda o Astro
diretamente quando for necessario bypassar o proxy.

## Variaveis de ambiente

O schema fica em `.env.schema` e gera os tipos em `env.d.ts`.

- `POSTHOG_KEY`: obrigatoria em `preview` e `production`
- `POSTHOG_HOST`: opcional, com padrao `https://us.i.posthog.com`
- `CLOUDFLARE_API_TOKEN`: usada nos comandos de deploy
- `CLOUDFLARE_ACCOUNT_ID`: usada nos comandos de deploy

Depois de alterar `.env.schema`, rode:

```bash
vp run website#generate:types
```

## Deploy

O Worker e o dominio customizado ficam em `wrangler.jsonc`. Os valores atuais
sao placeholders do template e devem ser revisados em cada projeto derivado.

## Estado da implementacao

A homepage ainda e um placeholder tecnico usando `@workspace/ui`. Os TODOs de
conteudo, SEO e assets sociais estao nos arquivos Astro correspondentes.
