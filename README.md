# blockbase

Template de monorepo para projetos web, usando Vite+ como toolchain único para
apps, packages, formatação, lint, testes e builds.

## Estrutura

- `apps/website`: app Astro base, preparado para Cloudflare
- `packages/ui`: pacote `@workspace/ui` com Tailwind, shadcn/ui e componentes
  React reutilizáveis
- `packages/emails`: templates transacionais com React Email
- `.github/workflows`: CI, testes, deploy e sincronização a partir do template

O workspace usa catálogos do pnpm em `pnpm-workspace.yaml` para manter as
versões centralizadas. O Vite+ (`vp`) e o lockfile são a fonte da verdade para
tooling e dependências.

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
vp run emails#dev
```

O app `website` roda via `portless` em `https://website.blockbase.localhost`.
Ao criar um projeto derivado, ajuste os nomes do app, do Worker, do domínio e
do host `portless` para o novo repositório. A configuração do host fica no
campo `"portless"` de `apps/website/package.json`; o task `dev` do Vite+ chama
`portless`, que executa o script `dev:app` por trás do proxy.

O preview do React Email roda em `http://localhost:3000`. Os templates ficam em
`packages/emails/templates/transactional` e podem ser exportados com
`vp run emails#export`.

## Validação

```bash
vp check
vp test
vp run -r build
```

O comando `vp run ready` executa a verificação completa usada para preparar
mudanças: formatação, lint, testes e build de todos os projetos.

## Deploy

As variáveis de ambiente esperadas pelo app ficam em
`.env.schema`.

## Ao criar um repo a partir deste template

- renomeie o app, Worker e domínio em `apps/website/wrangler.jsonc`
- ajuste `site` em `apps/website/astro.config.ts`
- atualize o nome usado pelo `portless` em `apps/website/package.json`
- revise secrets e variables nos workflows do GitHub
- substitua a homepage, SEO, Schema.org e assets sociais
- mantenha dependências compartilhadas no catálogo do `pnpm-workspace.yaml`
