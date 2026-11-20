# Banco de preview anonimizado

O template não copia a produção para o preview. Sem as variáveis abaixo, os
workflows de banco não fazem nada. Com elas, um job diário lê a produção com um
token somente leitura, transforma cada linha na memória com
[@snaplet/copycat](https://github.com/supabase-community/copycat) e grava só o
resultado em `<grupo-de-preview>-anon-snapshot`, no grupo de preview. Pull
requests semeiam esse snapshot e recebem apenas o token do grupo de preview.

Se o snapshot ainda não existir, o PR ganha um banco vazio com as migrations.
Não há fallback para a produção: um nome de origem terminando em `-production`
encerra o job com exit 1.

## O que configurar

Crie um grupo Turso só de preview, separado do grupo de produção. O token desse
grupo não alcança a produção.

No GitHub, crie o environment `anonymize` e restrinja o deployment branch à
branch padrão. Os segredos de produção ficam só nesse environment. O workflow
`anonymize-snapshot.yml` também recusa qualquer ref que não seja a branch padrão.

| Onde                    | Nome                        | Valor                                                                |
| ----------------------- | --------------------------- | -------------------------------------------------------------------- |
| vars do repositório     | `TURSO_ORGANIZATION_SLUG`   | slug da organização Turso                                            |
| vars do repositório     | `TURSO_PREVIEW_GROUP_NAME`  | nome do grupo de preview, em minúsculas                              |
| vars do repositório     | `TURSO_PROD_DATABASE_URL`   | URL `libsql://` da produção, sem token                               |
| environment `anonymize` | `TURSO_PREVIEW_GROUP_TOKEN` | token que cria bancos no grupo de preview e autentica o libsql deles |
| environment `anonymize` | `TURSO_PROD_READ_TOKEN`     | token somente leitura da produção                                    |
| environment `anonymize` | `ANON_HASH_KEY`             | chave do copycat                                                     |
| environment `preview`   | `TURSO_PREVIEW_GROUP_TOKEN` | o mesmo token de preview, nunca o token de produção                  |

Token somente leitura da produção:

```bash
turso db tokens create <db> --read-only
```

Chave do copycat. Ela fica fora do repositório. Sem ela o copycat seria
determinístico e reversível por quem lê o código. Com ela, o mesmo valor de
origem continua gerando o mesmo valor anonimizado, então UNIQUE e FKs de
colunas `keep` e `fake` se mantêm, mas o mapa não pode ser invertido sem a chave.

```bash
openssl rand -base64 32
```

O job `Anonymize snapshot` roda todo dia e pode ser disparado em
`workflow_dispatch` a partir da branch padrão. Ele recria o snapshot, roda as
migrations e copia as linhas. Os logs desse passo são contagens por tabela.

`preview-database.yml` roda em pull requests, depois dos testes. `delete-preview-db.yml`
apaga `<grupo>-pr-<número>` quando o PR fecha. Os dois usam só o token de preview.

Para migrar localmente:

```bash
DATABASE_URL=file:local.db vp run db#migrate
```

## Senha de preview

Toda coluna `password` de `accounts` vira o hash scrypt no formato do
better-auth (`salt:key`, N=16384, r=16, p=1, 64 bytes). A senha em claro,
igual para todas as contas do preview, é `preview-password`. O e-mail de login
é o e-mail anonimizado, não o e-mail real. Tokens de OAuth não são copiados.

## Classificação

`packages/db/anonymize.config.ts` é a allowlist. Cada tabela da aplicação entra
como `truncate` ou com uma regra por coluna. O script lê `PRAGMA table_info` e
`sqlite_master` e falha se aparecer tabela ou coluna fora da lista, ou se a
lista citar uma coluna que não existe. Tabelas `sqlite_*`, `__drizzle_migrations`
e `libsql_wasm_func_table` são infraestrutura e ficam de fora.

| Regra          | Efeito                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| `keep`         | copia o valor. Use em chaves primárias e FKs.                                      |
| `fake`         | substitui com uma função do copycat. O valor original só existe na memória do job. |
| `null`         | grava NULL. A coluna precisa aceitar NULL.                                         |
| `random-bytes` | grava hex determinístico de 32 bytes. Preserva UNIQUE sem guardar o original.      |
| `truncate`     | na coluna, grava NULL. Na tabela, não copia nenhuma linha.                         |

Classificação deste template:

| Tabela                                                                | Regra                                   |
| --------------------------------------------------------------------- | --------------------------------------- |
| `users.id`                                                            | `keep`                                  |
| `users.name`                                                          | `fake` com `copycat.fullName`           |
| `users.email`                                                         | `fake` com `copycat.email`              |
| `users.email_verified`, `created_at`, `updated_at`                    | `keep`                                  |
| `users.image`                                                         | `null`                                  |
| `sessions`                                                            | `truncate`                              |
| `verifications`                                                       | `truncate`                              |
| `accounts.id`, `accounts.user_id`, `accounts.provider_id`, timestamps | `keep`                                  |
| `accounts.account_id`                                                 | `fake` com `copycat.uuid`               |
| `accounts.access_token`, `refresh_token`, `id_token`                  | `truncate`                              |
| `accounts.password`                                                   | `fake` com o hash de `preview-password` |
| demais colunas de `accounts`                                          | `null`                                  |

## Coluna nova

1. Adicione a coluna numa migration compatível com o código que ainda está no ar.
2. Classifique a coluna em `anonymize.config.ts` antes de mergear.
3. Rode `vp test`. Um config incompleto faz o teste e o job do snapshot falharem,
   citando a tabela e a coluna, sem imprimir valores.

Uma tabela inteira de segredo, como sessão ou verificação, entra como
`{ op: "truncate" }`. Uma coluna nova numa tabela `truncate` continua sem ser
copiada. Uma coluna nova numa tabela copiada quebra o snapshot até ser
classificada.
