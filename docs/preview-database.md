# Banco de preview anonimizado

O template não copia a produção para o preview. Sem as variáveis abaixo, os
workflows de banco não fazem nada. Com elas, um job diário lê a produção com um
token somente leitura, transforma cada linha na memória com
[@snaplet/copycat](https://github.com/supabase-community/copycat) e grava só o
resultado em `<grupo-de-preview>-anon-snapshot`, no grupo de preview. Pull
requests semeiam esse snapshot e recebem só os dois tokens do grupo de preview.

Se o snapshot ainda não existir, o PR ganha um banco vazio com as migrations.
Não há fallback para a produção: um nome de origem terminando em `-production`
encerra o job com exit 1.

## Antes de ligar

Colunas `keep` continuam sendo dado real: ids, relações, timestamps. Um preview
público, com URL previsível, deixa isso acessível. Antes de gravar os secrets,
coloque [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
na frente das URLs de preview.

Crie um grupo Turso só de preview, separado do grupo de produção.

No GitHub, crie o environment `anonymize` e restrinja o deployment branch à
branch padrão. `TURSO_PROD_READ_TOKEN`, `ANON_HASH_KEY` e `PREVIEW_PASSWORD`
existem só nesse environment. O workflow também recusa qualquer ref que não
seja a branch padrão, então um pull request não consegue pedir esse environment.

## Tokens

São dois tokens, e nenhum deles é o token da organização.

`turso auth token`, ou `turso auth api-tokens mint` sem `--group`, gera um
token da Platform API que vale para a org inteira. Com ele, o código de um
pull request pode emitir um token da produção (`POST /databases/<prod>/auth/tokens`)
e ler ou apagar os dados. Os workflows não leem esse token. Não o coloque em
secret de repositório nem no environment `preview`.

O job de pull request executa o código do PR. O token de API que ele vê tem de
ser incapaz de alcançar a produção. Crie um token preso ao grupo de preview,
só com leitura, criação e remoção de bancos:

```bash
turso auth api-tokens mint preview-ci \
  --org <org> \
  --group <grupo-preview> \
  --scope read \
  --scope db:create \
  --scope db:delete
```

Guarde a saída em `TURSO_PREVIEW_API_TOKEN`, no environment `preview` e também
no `anonymize` (o snapshot diário cria o banco com ele). `read` é o GET que
descobre se o snapshot já existe. Não inclua `db:mint-token`: o acesso SQL não
passa por token emitido na hora.

O token libsql, que conecta em qualquer banco desse grupo e em nenhum outro:

```bash
turso group tokens create <grupo-preview> --expiration never
```

Guarde a saída em `TURSO_PREVIEW_DB_TOKEN`, nos mesmos dois environments. É o
`authToken` das migrations e da cópia. Não serve para a Platform API.

Jobs de `pull_request` referenciam só `TURSO_PREVIEW_API_TOKEN` e
`TURSO_PREVIEW_DB_TOKEN`.

| Onde                    | Nome                       | Valor                                          |
| ----------------------- | -------------------------- | ---------------------------------------------- |
| vars do repositório     | `TURSO_ORGANIZATION_SLUG`  | slug da organização Turso                      |
| vars do repositório     | `TURSO_PREVIEW_GROUP_NAME` | nome do grupo de preview, em minúsculas        |
| vars do repositório     | `TURSO_PROD_DATABASE_URL`  | URL `libsql://` da produção, sem token         |
| `preview` e `anonymize` | `TURSO_PREVIEW_API_TOKEN`  | token de API com `--group` e os scopes acima   |
| `preview` e `anonymize` | `TURSO_PREVIEW_DB_TOKEN`   | saída de `turso group tokens create`           |
| só `anonymize`          | `TURSO_PROD_READ_TOKEN`    | token somente leitura da produção              |
| só `anonymize`          | `ANON_HASH_KEY`            | chave do copycat                               |
| só `anonymize`          | `PREVIEW_PASSWORD`         | senha de login do preview, fora do repositório |

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

Senha de preview. Também fica só no environment `anonymize`. O job calcula o
hash scrypt no formato do better-auth (`salt:key`, N=16384, r=16, p=1, 64 bytes)
na hora da cópia. O texto não entra no repositório.

```bash
openssl rand -base64 24
```

O login do preview usa o e-mail anonimizado (domínio `preview.invalid`) e esse
secret. Tokens de OAuth não são copiados.

O job `Anonymize snapshot` roda todo dia e pode ser disparado em
`workflow_dispatch` a partir da branch padrão. Ele recria o snapshot, roda as
migrations e copia as linhas. Os logs desse passo são contagens por tabela.

`preview-database.yml` roda em pull requests, depois dos testes. `delete-preview-db.yml`
apaga `<grupo>-pr-<número>` quando o PR fecha.

Para migrar localmente:

```bash
DATABASE_URL=file:local.db vp run db#migrate
```

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

| Tabela                                                                | Regra                                           |
| --------------------------------------------------------------------- | ----------------------------------------------- |
| `users.id`                                                            | `keep`                                          |
| `users.name`                                                          | `fake` com `copycat.fullName`                   |
| `users.email`                                                         | `fake` com `copycat.email` em `preview.invalid` |
| `users.email_verified`, `created_at`, `updated_at`                    | `keep`                                          |
| `users.image`                                                         | `null`                                          |
| `sessions`                                                            | `truncate`                                      |
| `verifications`                                                       | `truncate`                                      |
| `accounts.id`, `accounts.user_id`, `accounts.provider_id`, timestamps | `keep`                                          |
| `accounts.account_id`                                                 | `fake` com `copycat.uuid`                       |
| `accounts.access_token`, `refresh_token`, `id_token`                  | `truncate`                                      |
| `accounts.password`                                                   | `fake` com o hash de `PREVIEW_PASSWORD`         |
| demais colunas de `accounts`                                          | `null`                                          |

## Coluna nova

1. Adicione a coluna numa migration compatível com o código que ainda está no ar.
2. Classifique a coluna em `anonymize.config.ts` antes de mergear.
3. Rode `vp test`. Um config incompleto faz o teste e o job do snapshot falharem,
   citando a tabela e a coluna, sem imprimir valores.

Uma tabela inteira de segredo, como sessão ou verificação, entra como
`{ op: "truncate" }`. Uma coluna nova numa tabela `truncate` continua sem ser
copiada. Uma coluna nova numa tabela copiada quebra o snapshot até ser
classificada.
