# dia-zero

Template de monorepo com Vite+, pronto para servir como base de novos projetos.

## Base atual

- `apps/` e `packages/` começam vazios de proposito.
- `vp` e o lockfile ficam como fonte da verdade para tooling e dependencias.
- `portless` ja esta instalado para que novos apps possam expor URLs estaveis em `.localhost`.

## Uso

```bash
vp install
vp run ready
```

Depois disso, crie os apps e packages que fizerem sentido para o projeto derivado.
