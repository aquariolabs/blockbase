# blockbase

Template de monorepo para projetos web, usando Vite+ como toolchain único para
apps, packages, formatação, lint, testes e builds.

## Estrutura

- `apps/website`: app Astro base, preparado para Cloudflare
- `packages/ui`: pacote `@workspace/ui` com Tailwind, shadcn/ui e componentes
  React reutilizáveis
- `packages/emails`: templates transacionais com React Email
- `packages/db`: schema Drizzle/libSQL das tabelas de auth e a cópia anonimizada
  para preview
- `.github/workflows`: CI, testes, deploy e snapshot anonimizado
- `.claude`: prepara as sessões cloud do Claude Code, instalando o Vite+, o
  Node.js do projeto e as dependências quando a sessão começa

O workspace usa catálogos do pnpm em `pnpm-workspace.yaml` para manter as
versões centralizadas. O Vite+ (`vp`) e o lockfile são a fonte da verdade para
tooling e dependências.

## Uso

```bash
vp install
vp run check     # formatação, lint e type check
vp run test      # testes unitários
vp run -r build  # build de todos os pacotes
vp run ready     # tudo acima, em sequência
```

`check`, `test` e os `build` de cada pacote são tasks do Vite+ (`run.tasks`
nos `vite.config.ts`) e ficam em cache: se nada mudou desde a última execução
que passou, o resultado é reaproveitado. O CI guarda esse cache entre runs.
Para forçar a execução, use `vp run --no-cache <task>`; para limpar, `vp cache
clean`.

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

## Banco de preview

Pull requests não recebem a produção. Com o grupo de preview configurado, cada
PR semeia o snapshot anonimizado `<grupo>-anon-snapshot`. Sem as variáveis, o
mecanismo fica desligado. Tokens, senha de preview e classificação de colunas
estão em [docs/preview-database.md](docs/preview-database.md).

## Ao criar um repo a partir deste template

- renomeie o app, Worker e domínio em `apps/website/wrangler.jsonc`
- ajuste `site` em `apps/website/astro.config.ts`
- atualize o nome usado pelo `portless` em `apps/website/package.json`
- revise secrets e variables nos workflows do GitHub
- se o projeto usar Turso, siga [docs/preview-database.md](docs/preview-database.md)
  e classifique cada coluna nova em `packages/db/anonymize.config.ts`
- substitua a homepage, SEO, Schema.org e assets sociais
- mantenha dependências compartilhadas no catálogo do `pnpm-workspace.yaml`
