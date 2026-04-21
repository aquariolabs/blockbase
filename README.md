# dia-zero

Template de monorepo com Vite+, pronto para servir como base de novos projetos.

## Base atual

- `apps/` comeca vazio de proposito
- pacote compartilhado `@workspace/ui` com shadcn-ui em `packages/ui`
- `vp` e o lockfile ficam como fonte da verdade para tooling e dependencias.
- `portless` ja esta instalado para que novos apps possam expor URLs estaveis em `.localhost`.
- configuracao inicial do Renovate
- workflow de CI

## Uso

```bash
vp install
vp run ready
```

## Proximos passos

- aplique um novo estilo em `@workspace/ui`:

  ```bash
  vpx shadcn@latest apply
  ```

- crie os apps e packages que fizerem sentido para o projeto derivado.
- configure `portless` no script `dev` dos novos apps
