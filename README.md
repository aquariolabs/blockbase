# dia-zero

Template de monorepo para projetos web, usando Vite+ como toolchain unico para
apps, packages, formatacao, lint, testes e builds.

## Estrutura

- `apps/website`: app Astro base, preparado para Cloudflare
- `apps/storybook`: Storybook para os componentes compartilhados do template
- `packages/ui`: pacote `@workspace/ui` com Tailwind, shadcn/ui e componentes
  React reutilizaveis
- `.github/workflows`: CI, testes, deploy e sincronizacao a partir do template

O workspace usa catalogos do pnpm em `pnpm-workspace.yaml` para manter as
versoes centralizadas. O Vite+ (`vp`) e o lockfile sao a fonte da verdade para
tooling e dependencias.

## Uso

```bash
vp install
vp check
vp test
vp run ready
```

## Desenvolvimento

```bash
vp run website#dev
vp run storybook#dev
```

O app `website` roda via `portless` em `https://website.dia-zero.localhost`.
Ao criar um projeto derivado, ajuste os nomes do app, do Worker, do dominio e
do host `portless` para o novo repositorio.

## Validacao

```bash
vp check
vp test
vp run -r build
```

O comando `vp run ready` executa a verificacao completa usada para preparar
mudancas: formatacao, lint, testes e build de todos os projetos.

## Deploy

O app base `website` usa Astro com adapter Cloudflare, Wrangler e Varlock:

```bash
vp run website#deploy:preview
vp run website#deploy:production
```

As variaveis de ambiente esperadas pelo app ficam em
`apps/website/.env.schema`.

## Ao criar um repo a partir deste template

- renomeie o app, Worker e dominio em `apps/website/wrangler.jsonc`
- ajuste `site` em `apps/website/astro.config.ts`
- atualize o nome usado pelo `portless` em `apps/website/vite.config.ts`
- revise secrets e variables nos workflows do GitHub
- substitua a homepage, SEO, Schema.org e assets sociais
- mantenha dependencias compartilhadas no catalogo do `pnpm-workspace.yaml`
